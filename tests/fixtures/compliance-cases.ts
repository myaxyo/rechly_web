import { invoice, company } from "./identifier-invoice";

/** Synthetic cases only; no customer data is passed to external services. */
export function complianceCases() {
    const base = () => structuredClone({ invoice, company });
    const identifiers = base();
    const legacy = base();
    delete legacy.invoice.e_invoice;
    delete legacy.invoice.items[0].gtin;
    const exempt = base();
    exempt.company.is_small_business = true;
    delete exempt.company.vat_id;
    exempt.company.tax_number = "12/345/67890";
    Object.assign(exempt.invoice.items[0], { tax_rate_percent: 0, tax_amount: 0, total: 100 });
    Object.assign(exempt.invoice, { total_vat: 0, total_gross: 100 });
    const mixed = base();
    mixed.invoice.items.push({ ...mixed.invoice.items[0], description: "Reduced rate", tax_rate_percent: 7, tax_amount: 7, total: 107 });
    Object.assign(mixed.invoice, { subtotal: 200, total_vat: 26, total_gross: 226 });
    const discount = base();
    Object.assign(discount.invoice.items[0], { discount_percent: 10, subtotal: 90, tax_amount: 17.1, total: 107.1 });
    Object.assign(discount.invoice, { subtotal: 90, total_vat: 17.1, total_gross: 107.1 });
    const credit = base();
    Object.assign(credit.invoice.items[0], { quantity: -1, subtotal: -100, tax_amount: -19, total: -119 });
    Object.assign(credit.invoice, { correction_type: "credit_note", subtotal: -100, total_vat: -19, total_gross: -119 });
    const multipage = base();
    multipage.invoice.items = Array.from({ length: 40 }, (_, i) => ({ ...multipage.invoice.items[0], description: `Position ${i + 1}: Beratung für Müller & Söhne` }));
    Object.assign(multipage.invoice, { subtotal: 4000, total_vat: 760, total_gross: 4760 });
    return { identifiers, legacy, exempt, mixed, discount, credit, multipage };
}
