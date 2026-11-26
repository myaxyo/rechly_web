/**
 * Duplicate detection for bank imports.
 *
 * Entries with a bank reference (CAMT AcctSvcrRef) are identified by it, so
 * overlapping re-imports are skipped while two genuinely identical payments
 * (same day, amount and text) are both kept. Rows without a reference — CSV
 * imports — fall back to booking date + amount + the first 50 characters of
 * the text; a CAMT entry is also skipped when it matches a CSV row imported
 * earlier that way.
 *
 * References are scoped by the statement's own account IBAN
 * (`<IBAN>:<AcctSvcrRef>`) so two accounts at the same bank with
 * statement-local sequence references do not collide. Rows imported before
 * scoping was introduced carry the raw reference; a scoped candidate still
 * matches such a legacy raw row, so upgrading does not re-import history.
 */

/** Storage limit for the bankReference attribute. */
export const BANK_REFERENCE_MAX_LENGTH = 128;

const SCOPED_REF = /^([A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}):(.+)$/;

/** `<accountIban>:<bankReference>`, truncated to the storage limit. */
export function scopedBankReference(
    accountIban: string | undefined,
    bankReference: string | undefined,
): string | undefined {
    if (!bankReference) return undefined;
    const scoped = accountIban
        ? `${accountIban.replace(/\s+/g, "").toUpperCase()}:${bankReference}`
        : bankReference;
    return scoped.slice(0, BANK_REFERENCE_MAX_LENGTH);
}

/** Raw reference without its IBAN scope, or undefined when not scoped. */
const unscopedPart = (ref: string): string | undefined =>
    SCOPED_REF.exec(ref)?.[2];

export interface ImportCandidate {
    bookingDate: string;
    amount: number;
    description?: string;
    bankReference?: string;
}

export interface ExistingBankRow {
    bookingDate?: string | null;
    /** Field name used by older imports */
    transactionDate?: string | null;
    amount?: number | null;
    description?: string | null;
    bankReference?: string | null;
}

const legacyKey = (
    date: string | null | undefined,
    amount: number | null | undefined,
    description: string | null | undefined,
) =>
    `${String(date ?? "").slice(0, 10)}|${Number(amount ?? 0).toFixed(2)}|${(description ?? "").slice(0, 50)}`;

export function planBankImport<T extends ImportCandidate>(
    existing: ExistingBankRow[],
    candidates: T[],
) {
    const references = new Set<string>();
    // Existing rows stored before IBAN scoping (raw AcctSvcrRef only).
    const legacyReferences = new Set<string>();
    const keysWithoutReference = new Set<string>();
    for (const row of existing) {
        if (row.bankReference) {
            references.add(row.bankReference);
            if (!unscopedPart(row.bankReference))
                legacyReferences.add(row.bankReference);
        } else
            keysWithoutReference.add(
                legacyKey(
                    row.bookingDate ?? row.transactionDate,
                    row.amount,
                    row.description,
                ),
            );
    }

    const toCreate: T[] = [];
    let duplicates = 0;
    for (const candidate of candidates) {
        const key = legacyKey(
            candidate.bookingDate,
            candidate.amount,
            candidate.description,
        );
        const rawPart = candidate.bankReference
            ? unscopedPart(candidate.bankReference)
            : undefined;
        const duplicate = candidate.bankReference
            ? references.has(candidate.bankReference) ||
              // Scoped candidate vs. row imported before scoping existed.
              (rawPart !== undefined && legacyReferences.has(rawPart)) ||
              keysWithoutReference.has(key)
            : keysWithoutReference.has(key);
        if (duplicate) {
            duplicates++;
            continue;
        }
        toCreate.push(candidate);
        if (candidate.bankReference) {
            references.add(candidate.bankReference);
            if (!rawPart) legacyReferences.add(candidate.bankReference);
        } else keysWithoutReference.add(key);
    }
    return { toCreate, duplicates };
}
