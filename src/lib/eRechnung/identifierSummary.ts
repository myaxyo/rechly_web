import type { EInvoiceData } from "./identifiers";

/** Shared human-readable snapshot for the PDF previews and embedded-XML PDF. */
export function identifierSummary(data?: EInvoiceData): string {
    if (!data) return "";
    const lines: string[] = [];
    if (data.buyer_identifier) lines.push(`BT-46: ${data.buyer_identifier.value}${data.buyer_identifier.scheme ? ` (${data.buyer_identifier.scheme})` : ""}`);
    if (data.seller_identifier) lines.push(`BT-29: ${data.seller_identifier.value}${data.seller_identifier.scheme ? ` (${data.seller_identifier.scheme})` : ""}`);
    if (data.delivery) {
        const d = data.delivery;
        lines.push(`Lieferort / Delivery: ${d.name}`, d.street, `${d.postal_code} ${d.city}, ${d.country}`);
        if (d.identifier) lines.push(`BT-71: ${d.identifier.value}${d.identifier.scheme ? ` (${d.identifier.scheme})` : ""}`);
    }
    return lines.join("\n");
}
