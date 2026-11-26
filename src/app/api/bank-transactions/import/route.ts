import { NextRequest, NextResponse } from "next/server";
import { Query, ID, Permission, Role } from "node-appwrite";
import Papa from "papaparse";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";
import { CamtParseError, parseCamt } from "@/lib/bank/camt";
import {
    CAMT_LIMITS,
    CamtFileError,
    extractCamtDocuments,
} from "@/lib/bank/camtFile";
import { normalizeBookingDate } from "@/lib/bank/dates";
import {
    BANK_REFERENCE_MAX_LENGTH,
    planBankImport,
    scopedBankReference,
} from "@/lib/bank/importPlan";
import { isUnknownAttribute } from "@/lib/appwrite-errors";
import { allDocuments } from "@/lib/server/pagination";

interface NormalizedTransaction {
    /** Canonical booking date (YYYY-MM-DD) */
    bookingDate: string;
    valueDate?: string;
    amount: number;
    currency: string;
    description: string;
    reference?: string;
    counterpartName?: string;
    counterpartIban?: string;
    /** CAMT AcctSvcrRef, used to recognise re-imported entries */
    bankReference?: string;
    /** Own account IBAN of the CAMT statement, scopes bankReference */
    accountIban?: string;
}

function parseDKB(rows: Record<string, string>[]): NormalizedTransaction[] {
    return rows
        .filter((r) => r["Buchungsdatum"] || r["Valutadatum"])
        .map((r) => ({
            bookingDate: (r["Buchungsdatum"] || r["Valutadatum"])
                .split(".")
                .reverse()
                .join("-"),
            amount: parseFloat(
                (r["Betrag (EUR)"] || r["Betrag"] || "0")
                    .replace(/\./g, "")
                    .replace(",", "."),
            ),
            currency: "EUR",
            description:
                r["Verwendungszweck"] || r["Glaeubigeridentifikation"] || "",
            counterpartName:
                r["Auftraggeber / Beguenstigter"] ||
                r["Beguenstigter/Zahlungspflichtiger"] ||
                undefined,
            counterpartIban: r["Kontonummer"] || r["IBAN"] || undefined,
            reference: r["Mandatsreferenz"] || undefined,
        }));
}

function parseING(rows: Record<string, string>[]): NormalizedTransaction[] {
    return rows
        .filter((r) => r["Buchung"])
        .map((r) => {
            const dateStr = r["Buchung"];
            const parts = dateStr.split(".");
            const isoDate =
                parts.length === 3
                    ? `${parts[2]}-${parts[1]}-${parts[0]}`
                    : dateStr;
            const amountRaw = r["Betrag"] || "0";
            const amount = parseFloat(
                amountRaw.replace(/\./g, "").replace(",", "."),
            );
            return {
                bookingDate: isoDate,
                amount,
                currency: r["Währung"] || "EUR",
                description: r["Verwendungszweck"] || "",
                counterpartName: r["Auftraggeber/Empfänger"] || undefined,
                counterpartIban: r["Kontonummer/IBAN"] || undefined,
            };
        });
}

function parseGeneric(rows: Record<string, string>[]): NormalizedTransaction[] {
    return rows
        .map((r) => {
            const dateKey = Object.keys(r).find(
                (k) =>
                    k.toLowerCase().includes("date") ||
                    k.toLowerCase().includes("datum"),
            );
            const amountKey = Object.keys(r).find(
                (k) =>
                    k.toLowerCase().includes("amount") ||
                    k.toLowerCase().includes("betrag"),
            );
            const descKey = Object.keys(r).find(
                (k) =>
                    k.toLowerCase().includes("desc") ||
                    k.toLowerCase().includes("verwendung") ||
                    k.toLowerCase().includes("purpose"),
            );

            return {
                // Normalize to YYYY-MM-DD: the raw cell can be a datetime
                // ("2026-11-17 10:30:00") or DD.MM.YYYY, both of which
                // violate the 10-char bookingDate attribute as-is.
                bookingDate:
                    (dateKey ? normalizeBookingDate(r[dateKey]) : undefined) ??
                    new Date().toISOString().slice(0, 10),
                amount: amountKey
                    ? parseFloat(
                          r[amountKey]
                              .replace(/[^\d.,-]/g, "")
                              .replace(",", "."),
                      )
                    : 0,
                currency: "EUR",
                description: descKey ? r[descKey] : "",
            };
        })
        .filter((t) => t.bookingDate && !isNaN(t.amount));
}

export async function POST(request: NextRequest) {
    try {
        let account;
        try {
            const sessionClient = await createSessionClient();
            account = sessionClient.account;
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const { databases } = await createAdminClient();
        const user = await account.get();

        // CAMT uploads arrive as multipart FormData with the raw .xml/.zip
        // file: the statement is inflated server-side, so the HTTP body
        // stays the compressed upload size instead of up to 25 MB of JSON
        // that reverse proxies reject with 413. The JSON form (csvText, and
        // the legacy xmlFiles array) is kept for CSV and older clients.
        let csvText: string | undefined;
        let format: string;
        let camtDocuments: string[] | undefined;
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            format = String(formData.get("format") ?? "");
            const fileEntry = formData.get("file");
            const csvEntry = formData.get("csvText");
            if (typeof csvEntry === "string") csvText = csvEntry;
            if (format === "camt") {
                if (!(fileEntry instanceof File)) {
                    return NextResponse.json(
                        { error: "file required" },
                        { status: 400 },
                    );
                }
                if (fileEntry.size > CAMT_LIMITS.maxUploadBytes) {
                    return NextResponse.json(
                        { error: "CAMT file too large" },
                        { status: 413 },
                    );
                }
                try {
                    camtDocuments = extractCamtDocuments(
                        new Uint8Array(await fileEntry.arrayBuffer()),
                    );
                } catch (error) {
                    if (error instanceof CamtFileError) {
                        return NextResponse.json(
                            { error: error.message },
                            { status: 400 },
                        );
                    }
                    throw error;
                }
            }
        } else {
            const body = (await request.json()) as {
                csvText?: string;
                format: string;
                xmlFiles?: unknown;
            };
            csvText = body.csvText;
            format = body.format;
            if (format === "camt") {
                if (
                    !Array.isArray(body.xmlFiles) ||
                    !body.xmlFiles.length ||
                    !body.xmlFiles.every((x) => typeof x === "string")
                ) {
                    return NextResponse.json(
                        { error: "xmlFiles required" },
                        { status: 400 },
                    );
                }
                camtDocuments = body.xmlFiles as string[];
            }
        }

        let normalized: NormalizedTransaction[] = [];
        let skippedPending = 0;

        if (format === "camt") {
            const documents = camtDocuments ?? [];
            const totalLength = documents.reduce(
                (sum, xml) => sum + xml.length,
                0,
            );
            if (
                documents.length > CAMT_LIMITS.maxFiles ||
                totalLength > CAMT_LIMITS.maxTotalBytes
            ) {
                return NextResponse.json(
                    { error: "Too many or too large CAMT files" },
                    { status: 413 },
                );
            }
            for (const xml of documents) {
                try {
                    const result = parseCamt(xml);
                    skippedPending += result.skippedPending;
                    normalized.push(...result.transactions);
                } catch (error) {
                    if (error instanceof CamtParseError) {
                        return NextResponse.json(
                            { error: error.message },
                            { status: 400 },
                        );
                    }
                    throw error;
                }
            }
        } else if (!csvText) {
            return NextResponse.json(
                { error: "csvText required" },
                { status: 400 },
            );
        }

        if (format !== "camt") {
            // Skip DKB header lines (they start with non-CSV metadata)
            let csvToParse = csvText ?? "";
            if (format === "dkb") {
                const lines = csvToParse.split("\n");
                const headerIndex = lines.findIndex(
                    (l) =>
                        l.startsWith('"Buchungsdatum"') ||
                        l.startsWith("Buchungsdatum"),
                );
                if (headerIndex > -1) {
                    csvToParse = lines.slice(headerIndex).join("\n");
                }
            }

            const { data: rows } = Papa.parse<Record<string, string>>(
                csvToParse,
                {
                    header: true,
                    delimiter: format === "dkb" ? ";" : ",",
                    skipEmptyLines: true,
                },
            );

            if (format === "dkb") normalized = parseDKB(rows);
            else if (format === "ing") normalized = parseING(rows);
            else normalized = parseGeneric(rows);
        }

        // Scope CAMT references by the statement's own account and clamp
        // them to the stored size *before* duplicate detection, so dedup
        // compares exactly what will be persisted (and two accounts at
        // the same bank cannot collide on statement-local references).
        normalized = normalized.map((tx) => ({
            ...tx,
            bookingDate:
                normalizeBookingDate(tx.bookingDate) ??
                tx.bookingDate.slice(0, 10),
            ...(tx.bankReference
                ? {
                      bankReference: scopedBankReference(
                          tx.accountIban,
                          tx.bankReference,
                      ),
                  }
                : {}),
        }));

        // Existing rows of the user, for duplicate detection. On a
        // not-yet-migrated database (no bankReference/description column
        // yet) the documents simply lack those fields here.
        const existing = await allDocuments(
            (queries) =>
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.BANK_TRANSACTIONS,
                    queries,
                ),
            [Query.equal("userId", user.$id)],
        );
        const { toCreate, duplicates } = planBankImport(
            existing.map((d) => ({
                bookingDate: d.bookingDate,
                transactionDate: d.transactionDate,
                amount: d.amount,
                description: d.description,
                bankReference: d.bankReference,
            })),
            normalized,
        );
        const importBatchId = ID.unique();

        const permissions = [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
        ];

        // Persist one transaction, degrading the payload when the
        // database predates the CAMT schema (description/bankReference
        // attributes missing, or bankReference still at its old 64-char
        // size) instead of failing the whole import with HTTP 500.
        // Operators should still run setup-collections /
        // scripts/migrate-bank.mjs; this only keeps imports working.
        const createTx = async (tx: NormalizedTransaction) => {
            const full: Record<string, unknown> = {
                userId: user.$id,
                // Clamp to the declared attribute sizes so one long
                // remittance text cannot abort the whole import midway.
                bookingDate: tx.bookingDate.slice(0, 10),
                ...(tx.valueDate
                    ? { valueDate: tx.valueDate.slice(0, 10) }
                    : {}),
                amount: tx.amount,
                currency: (tx.currency || "EUR").slice(0, 3),
                description: (tx.description || "").slice(0, 1000),
                reference: tx.reference?.slice(0, 500) || null,
                counterpartName: tx.counterpartName?.slice(0, 200) || null,
                counterpartIban: tx.counterpartIban?.slice(0, 34) || null,
                status: "unmatched",
                matchedInvoiceId: null,
                importBatchId,
                ...(tx.bankReference
                    ? {
                          bankReference: tx.bankReference.slice(
                              0,
                              BANK_REFERENCE_MAX_LENGTH,
                          ),
                      }
                    : {}),
            };
            const legacySized: Record<string, unknown> = {
                ...full,
                ...(tx.bankReference
                    ? { bankReference: tx.bankReference.slice(0, 64) }
                    : {}),
            };
            const minimal: Record<string, unknown> = { ...legacySized };
            delete minimal.description;
            delete minimal.bankReference;
            delete minimal.valueDate;

            let lastError: unknown;
            for (const payload of [full, legacySized, minimal]) {
                try {
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.BANK_TRANSACTIONS,
                        ID.unique(),
                        payload,
                        permissions,
                    );
                    return;
                } catch (error) {
                    lastError = error;
                    if (!isUnknownAttribute(error)) throw error;
                    // Unknown/mismatched attribute: retry degraded.
                }
            }
            throw lastError;
        };

        // Chunked parallel writes: a yearly statement can hold ~1,500
        // rows, which serially risks gateway timeouts.
        let imported = 0;
        const WRITE_CHUNK = 10;
        for (let i = 0; i < toCreate.length; i += WRITE_CHUNK) {
            const chunk = toCreate.slice(i, i + WRITE_CHUNK);
            await Promise.all(chunk.map((tx) => createTx(tx)));
            imported += chunk.length;
        }

        return NextResponse.json({
            imported,
            duplicates,
            ...(skippedPending ? { skippedPending } : {}),
        });
    } catch (error) {
        console.error("Bank import error:", error);
        return NextResponse.json(
            { error: "Failed to import bank transactions" },
            { status: 500 },
        );
    }
}
