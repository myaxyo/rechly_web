import type { InvoiceWithDetails, UserCompany } from "../../src/types";
export const company: UserCompany = {
    name: "Rechly Test GmbH", address_line1: "Teststraße 1", postal_code: "10115", city: "Berlin", country: "DE",
    email: "seller@example.invalid", phone: "+49 30 1234567", vat_id: "DE123456789", bank_iban: "DE89370400440532013000",
    payment_terms_default: "14 Tage", created_at: 0, updated_at: 0,
};
export const invoice: InvoiceWithDetails = {
    invoice_number: "TEST-2026-001", client_id: "test-client", issue_date: "2026-10-27", due_date: "2026-11-10",
    status: "draft", subtotal: 100, total_vat: 19, total_gross: 119, created_at: 0, updated_at: 0,
    client: { name: "Buyer & Co", address_line1: "Testweg 2", postal_code: "20095", city: "Hamburg", country: "DE",
        email: "buyer@example.invalid", created_at: 0, updated_at: 0 },
    e_invoice: {
        buyer_identifier: { value: "4006381333931", scheme: "0088" },
        seller_identifier: { value: "9501101530003", scheme: "0088" },
        delivery: { name: "Branch <North>", street: "Lieferweg 3", postal_code: "28195", city: "Bremen", country: "DE",
            identifier: { value: "4006381333931", scheme: "0088" } },
    },
    items: [{ invoice_id: "test", description: "Consulting", quantity: 1, price: 100, tax_rate_percent: 19,
        discount_percent: 0, unit_of_measure: "Stunde", subtotal: 100, tax_amount: 19, total: 119, gtin: "4006381333931" }],
};
