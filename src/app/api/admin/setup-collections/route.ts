import { NextResponse } from "next/server";
import { Client, Databases, Storage, IndexType } from "node-appwrite";
import {
    getAppwriteEndpoint,
    getAppwriteProjectId,
    getOptionalEnv,
} from "@/lib/env";

/**
 * POST /api/admin/setup-collections
 *
 * Idempotently creates all new Appwrite collections, attributes, indexes
 * and the receipts storage bucket required for the new features.
 *
 * REQUIRES: APPWRITE_API_KEY must have scopes:
 *   databases.write, collections.write, attributes.write, indexes.write, buckets.write
 *
 * Safe to run multiple times — skips already-existing resources.
 */

const DATABASE_ID = "rechly-db";

async function getAdminClient() {
    const apiKey = getOptionalEnv("APPWRITE_API_KEY");
    if (!apiKey) throw new Error("APPWRITE_API_KEY not configured");

    const client = new Client()
        .setEndpoint(getAppwriteEndpoint())
        .setProject(getAppwriteProjectId())
        .setKey(apiKey);

    return { databases: new Databases(client), storage: new Storage(client) };
}

async function safeCreate<T>(
    fn: () => Promise<T>,
    resourceName: string,
): Promise<{
    name: string;
    status: "created" | "exists" | "error";
    error?: string;
}> {
    try {
        await fn();
        return { name: resourceName, status: "created" };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
            msg.includes("already exists") ||
            msg.includes("409") ||
            (err as { code?: number })?.code === 409
        ) {
            return { name: resourceName, status: "exists" };
        }
        return { name: resourceName, status: "error", error: msg };
    }
}

export async function POST() {
    try {
        const { databases, storage } = await getAdminClient();
        const results: Array<{
            name: string;
            status: "created" | "exists" | "error";
            error?: string;
        }> = [];

        // ── Offers collection ──────────────────────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createCollection(
                        DATABASE_ID,
                        "offers",
                        "offers",
                        [],
                    ),
                "collection:offers",
            ),
        );
        const offerAttrs: Array<[string, () => Promise<unknown>]> = [
            [
                "offers.userId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "userId",
                        36,
                        true,
                    ),
            ],
            [
                "offers.clientId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "clientId",
                        36,
                        true,
                    ),
            ],
            [
                "offers.offerNumber",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "offerNumber",
                        50,
                        true,
                    ),
            ],
            [
                "offers.issueDate",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "issueDate",
                        10,
                        true,
                    ),
            ],
            [
                "offers.validUntil",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "validUntil",
                        10,
                        false,
                    ),
            ],
            [
                "offers.subtotal",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offers",
                        "subtotal",
                        true,
                    ),
            ],
            [
                "offers.totalVat",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offers",
                        "totalVat",
                        true,
                    ),
            ],
            [
                "offers.totalGross",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offers",
                        "totalGross",
                        true,
                    ),
            ],
            [
                "offers.status",
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "offers",
                        "status",
                        [
                            "draft",
                            "sent",
                            "accepted",
                            "rejected",
                            "expired",
                            "converted",
                        ],
                        true,
                        "draft",
                    ),
            ],
            [
                "offers.notes",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "notes",
                        2000,
                        false,
                    ),
            ],
            [
                "offers.purchaseOrderRef",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "purchaseOrderRef",
                        200,
                        false,
                    ),
            ],
            [
                "offers.paymentTerms",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "paymentTerms",
                        500,
                        false,
                    ),
            ],
            [
                "offers.convertedInvoiceId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offers",
                        "convertedInvoiceId",
                        36,
                        false,
                    ),
            ],
        ];
        for (const [name, fn] of offerAttrs)
            results.push(await safeCreate(fn, `attr:${name}`));
        results.push(
            await safeCreate(
                () =>
                    databases.createIndex(
                        DATABASE_ID,
                        "offers",
                        "userId_idx",
                        IndexType.Key,
                        ["userId"],
                        ["ASC"],
                    ),
                "index:offers.userId",
            ),
        );

        // ── Offer Items collection ─────────────────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createCollection(
                        DATABASE_ID,
                        "offer_items",
                        "offer_items",
                        [],
                    ),
                "collection:offer_items",
            ),
        );
        const offerItemAttrs: Array<[string, () => Promise<unknown>]> = [
            [
                "offer_items.offerId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "offerId",
                        36,
                        true,
                    ),
            ],
            [
                "offer_items.productId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "productId",
                        36,
                        false,
                    ),
            ],
            [
                "offer_items.description",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "description",
                        1000,
                        true,
                    ),
            ],
            [
                "offer_items.quantity",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "quantity",
                        true,
                    ),
            ],
            [
                "offer_items.unitOfMeasure",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "unitOfMeasure",
                        50,
                        true,
                    ),
            ],
            [
                "offer_items.price",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "price",
                        true,
                    ),
            ],
            [
                "offer_items.taxRatePercent",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "taxRatePercent",
                        true,
                    ),
            ],
            [
                "offer_items.discountPercent",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "discountPercent",
                        true,
                        undefined,
                        undefined,
                        0,
                    ),
            ],
            [
                "offer_items.subtotal",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "subtotal",
                        true,
                    ),
            ],
            [
                "offer_items.taxAmount",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "taxAmount",
                        true,
                    ),
            ],
            [
                "offer_items.total",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "offer_items",
                        "total",
                        true,
                    ),
            ],
        ];
        for (const [name, fn] of offerItemAttrs)
            results.push(await safeCreate(fn, `attr:${name}`));
        results.push(
            await safeCreate(
                () =>
                    databases.createIndex(
                        DATABASE_ID,
                        "offer_items",
                        "offerId_idx",
                        IndexType.Key,
                        ["offerId"],
                        ["ASC"],
                    ),
                "index:offer_items.offerId",
            ),
        );

        // ── Recurring Invoices collection ──────────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createCollection(
                        DATABASE_ID,
                        "recurring_invoices",
                        "recurring_invoices",
                        [],
                    ),
                "collection:recurring_invoices",
            ),
        );
        const recurringAttrs: Array<[string, () => Promise<unknown>]> = [
            [
                "recurring.userId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "userId",
                        36,
                        true,
                    ),
            ],
            [
                "recurring.templateName",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "templateName",
                        200,
                        true,
                    ),
            ],
            [
                "recurring.clientId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "clientId",
                        36,
                        true,
                    ),
            ],
            [
                "recurring.interval",
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "interval",
                        ["weekly", "monthly", "quarterly", "annually"],
                        true,
                        "monthly",
                    ),
            ],
            [
                "recurring.nextDueDate",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "nextDueDate",
                        10,
                        true,
                    ),
            ],
            [
                "recurring.endDate",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "endDate",
                        10,
                        false,
                    ),
            ],
            [
                "recurring.isActive",
                () =>
                    databases.createBooleanAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "isActive",
                        true,
                        true,
                    ),
            ],
            [
                "recurring.lastCreatedInvoiceId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "lastCreatedInvoiceId",
                        36,
                        false,
                    ),
            ],
            [
                "recurring.notes",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "notes",
                        2000,
                        false,
                    ),
            ],
            [
                "recurring.paymentTerms",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "paymentTerms",
                        500,
                        false,
                    ),
            ],
            [
                "recurring.subtotal",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "subtotal",
                        true,
                    ),
            ],
            [
                "recurring.totalVat",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "totalVat",
                        true,
                    ),
            ],
            [
                "recurring.totalGross",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoices",
                        "totalGross",
                        true,
                    ),
            ],
        ];
        for (const [name, fn] of recurringAttrs)
            results.push(await safeCreate(fn, `attr:${name}`));
        results.push(
            await safeCreate(
                () =>
                    databases.createIndex(
                        DATABASE_ID,
                        "recurring_invoices",
                        "userId_idx",
                        IndexType.Key,
                        ["userId"],
                        ["ASC"],
                    ),
                "index:recurring_invoices.userId",
            ),
        );

        // ── Recurring Invoice Items collection ─────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createCollection(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "recurring_invoice_items",
                        [],
                    ),
                "collection:recurring_invoice_items",
            ),
        );
        const recurringItemAttrs: Array<[string, () => Promise<unknown>]> = [
            [
                "ri_items.recurringInvoiceId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "recurringInvoiceId",
                        36,
                        true,
                    ),
            ],
            [
                "ri_items.productId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "productId",
                        36,
                        false,
                    ),
            ],
            [
                "ri_items.description",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "description",
                        1000,
                        true,
                    ),
            ],
            [
                "ri_items.quantity",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "quantity",
                        true,
                    ),
            ],
            [
                "ri_items.unitOfMeasure",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "unitOfMeasure",
                        50,
                        true,
                    ),
            ],
            [
                "ri_items.price",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "price",
                        true,
                    ),
            ],
            [
                "ri_items.taxRatePercent",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "taxRatePercent",
                        true,
                    ),
            ],
            [
                "ri_items.discountPercent",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "discountPercent",
                        true,
                        undefined,
                        undefined,
                        0,
                    ),
            ],
            [
                "ri_items.subtotal",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "subtotal",
                        true,
                    ),
            ],
            [
                "ri_items.taxAmount",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "taxAmount",
                        true,
                    ),
            ],
            [
                "ri_items.total",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "total",
                        true,
                    ),
            ],
        ];
        for (const [name, fn] of recurringItemAttrs)
            results.push(await safeCreate(fn, `attr:${name}`));
        results.push(
            await safeCreate(
                () =>
                    databases.createIndex(
                        DATABASE_ID,
                        "recurring_invoice_items",
                        "riId_idx",
                        IndexType.Key,
                        ["recurringInvoiceId"],
                        ["ASC"],
                    ),
                "index:ri_items.recurringInvoiceId",
            ),
        );

        // ── Expenses collection ────────────────────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createCollection(
                        DATABASE_ID,
                        "expenses",
                        "expenses",
                        [],
                    ),
                "collection:expenses",
            ),
        );
        const expenseAttrs: Array<[string, () => Promise<unknown>]> = [
            [
                "expenses.userId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "expenses",
                        "userId",
                        36,
                        true,
                    ),
            ],
            [
                "expenses.date",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "expenses",
                        "date",
                        10,
                        true,
                    ),
            ],
            [
                "expenses.vendorName",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "expenses",
                        "vendorName",
                        200,
                        true,
                    ),
            ],
            [
                "expenses.description",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "expenses",
                        "description",
                        1000,
                        false,
                    ),
            ],
            [
                "expenses.amountNet",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "expenses",
                        "amountNet",
                        true,
                    ),
            ],
            [
                "expenses.vatAmount",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "expenses",
                        "vatAmount",
                        true,
                    ),
            ],
            [
                "expenses.amountGross",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "expenses",
                        "amountGross",
                        true,
                    ),
            ],
            [
                "expenses.vatRatePercent",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "expenses",
                        "vatRatePercent",
                        true,
                    ),
            ],
            [
                "expenses.category",
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "expenses",
                        "category",
                        [
                            "office",
                            "travel",
                            "software",
                            "hardware",
                            "marketing",
                            "consulting",
                            "utilities",
                            "rent",
                            "insurance",
                            "other",
                        ],
                        true,
                        "other",
                    ),
            ],
            [
                "expenses.paymentMethod",
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "expenses",
                        "paymentMethod",
                        [
                            "bank_transfer",
                            "cash",
                            "credit_card",
                            "paypal",
                            "other",
                        ],
                        true,
                        "bank_transfer",
                    ),
            ],
            [
                "expenses.receiptFileId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "expenses",
                        "receiptFileId",
                        36,
                        false,
                    ),
            ],
            [
                "expenses.status",
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "expenses",
                        "status",
                        ["pending", "approved"],
                        true,
                        "pending",
                    ),
            ],
        ];
        for (const [name, fn] of expenseAttrs)
            results.push(await safeCreate(fn, `attr:${name}`));
        results.push(
            await safeCreate(
                () =>
                    databases.createIndex(
                        DATABASE_ID,
                        "expenses",
                        "userId_idx",
                        IndexType.Key,
                        ["userId"],
                        ["ASC"],
                    ),
                "index:expenses.userId",
            ),
        );

        // ── Bank Transactions collection ───────────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createCollection(
                        DATABASE_ID,
                        "bank_transactions",
                        "bank_transactions",
                        [],
                    ),
                "collection:bank_transactions",
            ),
        );
        const bankAttrs: Array<[string, () => Promise<unknown>]> = [
            [
                "bank.userId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "userId",
                        36,
                        true,
                    ),
            ],
            [
                "bank.bookingDate",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "bookingDate",
                        10,
                        true,
                    ),
            ],
            [
                "bank.valueDate",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "valueDate",
                        10,
                        false,
                    ),
            ],
            [
                "bank.counterpartName",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "counterpartName",
                        200,
                        false,
                    ),
            ],
            [
                "bank.counterpartIban",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "counterpartIban",
                        34,
                        false,
                    ),
            ],
            [
                "bank.reference",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "reference",
                        500,
                        false,
                    ),
            ],
            [
                "bank.amount",
                () =>
                    databases.createFloatAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "amount",
                        true,
                    ),
            ],
            [
                "bank.currency",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "currency",
                        3,
                        true,
                    ),
            ],
            [
                "bank.status",
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "status",
                        ["unmatched", "matched", "ignored"],
                        true,
                        "unmatched",
                    ),
            ],
            [
                "bank.matchedInvoiceId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "matchedInvoiceId",
                        36,
                        false,
                    ),
            ],
            [
                "bank.importBatchId",
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "bank_transactions",
                        "importBatchId",
                        36,
                        true,
                    ),
            ],
        ];
        for (const [name, fn] of bankAttrs)
            results.push(await safeCreate(fn, `attr:${name}`));
        results.push(
            await safeCreate(
                () =>
                    databases.createIndex(
                        DATABASE_ID,
                        "bank_transactions",
                        "userId_idx",
                        IndexType.Key,
                        ["userId"],
                        ["ASC"],
                    ),
                "index:bank_transactions.userId",
            ),
        );

        // ── Receipts Storage Bucket ────────────────────────────────────────
        results.push(
            await safeCreate(
                () =>
                    storage.createBucket(
                        "receipts",
                        "receipts",
                        [],
                        false,
                        undefined,
                        10485760,
                        ["jpg", "jpeg", "png", "pdf", "webp", "heic"],
                    ),
                "bucket:receipts",
            ),
        );

        // ── Add correction fields to existing invoices collection ──────────
        results.push(
            await safeCreate(
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "invoices",
                        "correctionType",
                        20,
                        false,
                    ),
                "attr:invoices.correctionType",
            ),
        );
        results.push(
            await safeCreate(
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "invoices",
                        "correctsInvoiceId",
                        36,
                        false,
                    ),
                "attr:invoices.correctsInvoiceId",
            ),
        );

        // ── Add DATEV fields to user_company collection ────────────────────
        results.push(
            await safeCreate(
                () =>
                    databases.createEnumAttribute(
                        DATABASE_ID,
                        "user_company",
                        "datevChartOfAccounts",
                        ["SKR03", "SKR04"],
                        false,
                    ),
                "attr:user_company.datevChartOfAccounts",
            ),
        );
        results.push(
            await safeCreate(
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "user_company",
                        "datevConsultantNumber",
                        20,
                        false,
                    ),
                "attr:user_company.datevConsultantNumber",
            ),
        );
        results.push(
            await safeCreate(
                () =>
                    databases.createStringAttribute(
                        DATABASE_ID,
                        "user_company",
                        "datevClientNumber",
                        20,
                        false,
                    ),
                "attr:user_company.datevClientNumber",
            ),
        );

        const errors = results.filter((r) => r.status === "error");
        return NextResponse.json(
            {
                ok: true,
                summary: {
                    created: results.filter((r) => r.status === "created")
                        .length,
                    already_existed: results.filter(
                        (r) => r.status === "exists",
                    ).length,
                    errors: errors.length,
                },
                results,
            },
            { status: errors.length > 0 ? 207 : 200 },
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
