/**
 * Helpers extracted from the invoice create wizard to shrink the page module.
 * Further steps/sections should move here (or into focused components) over time.
 */
import type { InvoiceLineItem } from "@/lib/invoiceForm";

export function sumLineNet(items: InvoiceLineItem[]): number {
    return items.reduce((sum, item) => {
        const line = item.quantity * item.price;
        const discounted = line * (1 - (item.discount_percent || 0) / 100);
        return sum + discounted;
    }, 0);
}

export function sumLineVat(items: InvoiceLineItem[]): number {
    return items.reduce((sum, item) => {
        const line = item.quantity * item.price;
        const discounted = line * (1 - (item.discount_percent || 0) / 100);
        return sum + discounted * ((item.tax_rate_percent || 0) / 100);
    }, 0);
}

export function summarizeLineItems(items: InvoiceLineItem[]) {
    const subtotal = sumLineNet(items);
    const totalVat = sumLineVat(items);
    return {
        subtotal,
        totalVat,
        totalGross: subtotal + totalVat,
        lineCount: items.length,
    };
}
