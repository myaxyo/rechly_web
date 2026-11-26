/**
 * Automatic bank-transaction → invoice matching.
 *
 * A transaction may only mark an invoice paid when it is money flowing
 * in the invoice's direction: an incoming credit for a regular invoice
 * (positive total), an outgoing debit only for a credit note (negative
 * total). Matching on Math.abs(amount) — as the previous inline code
 * did — let a -119.00 € supplier direct debit "pay" a +119.00 € customer
 * invoice once CAMT imports started carrying debits. Currency must be
 * EUR (invoices in this app are EUR-denominated), the amount must agree
 * to within a cent, and an amount-only match is accepted only when it
 * is unambiguous.
 */

export interface AutoMatchTransaction {
    amount: number;
    currency?: string;
    description?: string;
    reference?: string;
}

export interface AutoMatchInvoice {
    id?: string;
    status: string;
    total_gross: number;
    invoice_number?: string;
}

const AMOUNT_TOLERANCE = 0.02;

const amountMatches = (tx: AutoMatchTransaction, inv: AutoMatchInvoice) =>
    // Signed comparison: a debit never matches a positive invoice.
    Math.sign(tx.amount) === Math.sign(inv.total_gross) &&
    Math.abs(inv.total_gross - tx.amount) < AMOUNT_TOLERANCE;

const referenceMatches = (tx: AutoMatchTransaction, inv: AutoMatchInvoice) => {
    const needle = inv.invoice_number?.trim().toLowerCase();
    // An empty invoice number must not match everything (includes("")).
    if (!needle) return false;
    const haystack = `${tx.description ?? ""} ${tx.reference ?? ""}`.toLowerCase();
    return haystack.includes(needle);
};

export function findAutoMatchInvoice<T extends AutoMatchInvoice>(
    tx: AutoMatchTransaction,
    invoices: readonly T[],
): T | undefined {
    if (!tx.amount) return undefined;
    if ((tx.currency || "EUR").trim().toUpperCase() !== "EUR") return undefined;

    const eligible = invoices.filter(
        (inv) => inv.status !== "paid" && inv.status !== "cancelled",
    );

    // Strongest signal first: amount and invoice number both agree.
    const byReference = eligible.filter(
        (inv) => amountMatches(tx, inv) && referenceMatches(tx, inv),
    );
    if (byReference.length) return byReference[0];

    // Amount alone only when exactly one open invoice fits.
    const byAmount = eligible.filter((inv) => amountMatches(tx, inv));
    return byAmount.length === 1 ? byAmount[0] : undefined;
}
