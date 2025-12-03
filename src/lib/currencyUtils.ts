/**
 * Currency Utilities - Shared with mobile app logic
 */

/**
 * Format currency in German format (1.234,56 €)
 */
export const formatCurrencyGerman = (amount: number): string => {
    try {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        console.error("Error formatting currency:", error);
        return `${amount.toFixed(2)} €`;
    }
};

/**
 * Format currency in English format (€1,234.56)
 */
export const formatCurrencyEnglish = (amount: number): string => {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        console.error("Error formatting currency:", error);
        return `€${amount.toFixed(2)}`;
    }
};

/**
 * Format currency based on locale
 */
export const formatCurrency = (
    amount: number,
    locale: string = "de"
): string => {
    if (locale === "de" || locale === "de-DE") {
        return formatCurrencyGerman(amount);
    }
    return formatCurrencyEnglish(amount);
};

/**
 * Calculate percentage of amount
 */
export const calculatePercentage = (
    amount: number,
    percentage: number
): number => {
    return (amount * percentage) / 100;
};

/**
 * Calculate VAT amount
 */
export const calculateVAT = (netAmount: number, vatRate: number): number => {
    return calculatePercentage(netAmount, vatRate);
};

/**
 * Round to 2 decimal places (for currency)
 */
export const roundCurrency = (amount: number): number => {
    return Math.round(amount * 100) / 100;
};

/**
 * Calculate line item totals
 */
export const calculateLineItemTotals = (
    quantity: number,
    price: number,
    taxRate: number,
    discountPercent: number = 0
): {
    subtotal: number;
    discountAmount: number;
    netAfterDiscount: number;
    taxAmount: number;
    total: number;
} => {
    const subtotal = roundCurrency(quantity * price);
    const discountAmount = roundCurrency(
        calculatePercentage(subtotal, discountPercent)
    );
    const netAfterDiscount = roundCurrency(subtotal - discountAmount);
    const taxAmount = roundCurrency(calculateVAT(netAfterDiscount, taxRate));
    const total = roundCurrency(netAfterDiscount + taxAmount);

    return {
        subtotal,
        discountAmount,
        netAfterDiscount,
        taxAmount,
        total,
    };
};

/**
 * Calculate invoice totals from line items
 */
export interface InvoiceTotals {
    subtotal: number;
    totalDiscount: number;
    netAfterDiscount: number;
    vatBreakdown: { rate: number; amount: number }[];
    totalVAT: number;
    totalGross: number;
}

export const calculateInvoiceTotals = (
    items: Array<{
        quantity: number;
        price: number;
        tax_rate_percent: number;
        discount_percent: number;
    }>
): InvoiceTotals => {
    let subtotal = 0;
    let totalDiscount = 0;
    let netAfterDiscount = 0;
    const vatByRate: Map<number, number> = new Map();

    items.forEach((item) => {
        const itemCalc = calculateLineItemTotals(
            item.quantity,
            item.price,
            item.tax_rate_percent,
            item.discount_percent
        );

        subtotal += itemCalc.subtotal;
        totalDiscount += itemCalc.discountAmount;
        netAfterDiscount += itemCalc.netAfterDiscount;

        // Accumulate VAT by rate
        const currentVAT = vatByRate.get(item.tax_rate_percent) || 0;
        vatByRate.set(item.tax_rate_percent, currentVAT + itemCalc.taxAmount);
    });

    // Build VAT breakdown
    const vatBreakdown = Array.from(vatByRate.entries())
        .map(([rate, amount]) => ({ rate, amount: roundCurrency(amount) }))
        .sort((a, b) => b.rate - a.rate);

    const totalVAT = roundCurrency(
        vatBreakdown.reduce((sum, item) => sum + item.amount, 0)
    );

    const totalGross = roundCurrency(netAfterDiscount + totalVAT);

    return {
        subtotal: roundCurrency(subtotal),
        totalDiscount: roundCurrency(totalDiscount),
        netAfterDiscount: roundCurrency(netAfterDiscount),
        vatBreakdown,
        totalVAT,
        totalGross,
    };
};
