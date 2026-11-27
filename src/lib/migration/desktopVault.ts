/**
 * Decrypt Rechly Desktop `.rechly-backup` files (AES-256-GCM + scrypt)
 * and map the vault snapshot into the web RechlyBackupBundle shape.
 */
import { scrypt, createDecipheriv } from "node:crypto";
import type {
    NormalizedMigrationClient,
    NormalizedMigrationExpense,
    NormalizedMigrationInvoice,
    NormalizedMigrationInvoiceItem,
    NormalizedMigrationProduct,
    RechlyBackupBundle,
} from "@/lib/migration/types";

export const MAX_DESKTOP_BACKUP_BYTES = 64 * 1024 * 1024;
const MAGIC = Buffer.from("RECHLYBK\x01", "binary");
const HEADER = MAGIC.length + 16 + 12 + 16;

function keyFor(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) =>
        scrypt(
            password,
            salt,
            32,
            { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
            (error, key) => (error ? reject(error) : resolve(key as Buffer)),
        ),
    );
}

export function isEncryptedDesktopBackup(data: Buffer): boolean {
    return data.subarray(0, MAGIC.length).equals(MAGIC);
}

export async function decryptDesktopVault(
    data: Buffer,
    password: string,
): Promise<unknown> {
    if (typeof password !== "string" || password.length < 12 || password.length > 1024) {
        throw new Error("Das Sicherungspasswort muss 12 bis 1.024 Zeichen enthalten.");
    }
    if (data.length < HEADER || data.length > MAX_DESKTOP_BACKUP_BYTES || !isEncryptedDesktopBackup(data)) {
        throw new Error("Unbekanntes oder beschädigtes Sicherungsformat.");
    }
    let offset = MAGIC.length;
    const salt = data.subarray(offset, (offset += 16));
    const iv = data.subarray(offset, (offset += 12));
    const tag = data.subarray(offset, (offset += 16));
    const key = await keyFor(password, salt);
    try {
        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAAD(MAGIC);
        decipher.setAuthTag(tag);
        const plain = Buffer.concat([decipher.update(data.subarray(offset)), decipher.final()]);
        return JSON.parse(plain.toString("utf8"));
    } catch {
        throw new Error("Falsches Passwort oder beschädigte Sicherung.");
    } finally {
        key.fill(0);
    }
}

type Loose = Record<string, unknown>;

function str(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function mapItems(items: unknown): NormalizedMigrationInvoiceItem[] {
    if (!Array.isArray(items)) return [];
    return items.map((raw) => {
        const item = (raw ?? {}) as Loose;
        return {
            description: str(item.description, "Position"),
            quantity: num(item.quantity, 1),
            unit_of_measure: str(item.unit_of_measure || item.unit, "Stk"),
            price: num(item.price ?? item.unit_price),
            tax_rate_percent: num(item.tax_rate_percent ?? item.vat_rate, 19),
            discount_percent: num(item.discount_percent, 0) || undefined,
        };
    });
}

/** Map a decrypted desktop StoreData snapshot to the web backup bundle. */
export function desktopVaultToBackupBundle(vault: unknown): RechlyBackupBundle {
    const data = (vault ?? {}) as Loose;
    const company = (data.company ?? null) as Loose | null;
    const clients = Array.isArray(data.clients) ? data.clients : [];
    const products = Array.isArray(data.products) ? data.products : [];
    const invoices = Array.isArray(data.invoices) ? data.invoices : [];
    const offers = Array.isArray(data.offers) ? data.offers : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];

    const clientName = (id: unknown) => {
        const found = clients.find((c) => str((c as Loose).id) === str(id)) as Loose | undefined;
        return found ? str(found.name, "Kunde") : "Kunde";
    };

    return {
        rechlyBackupVersion: 1,
        exportedAt: new Date().toISOString(),
        sourceApp: "rechly_desktop_vault",
        company: company
            ? {
                  name: str(company.name),
                  address_line1: str(company.address_line1 || company.street),
                  postal_code: str(company.postal_code || company.zip),
                  city: str(company.city),
                  email: str(company.email),
                  phone: str(company.phone),
                  vat_id: str(company.vat_id || company.ust_id),
                  tax_number: str(company.tax_number || company.steuernummer),
                  bank_iban: str(company.bank_iban || company.iban),
                  bank_bic: str(company.bank_bic || company.bic),
                  bank_name: str(company.bank_name),
                  is_small_business: Boolean(company.is_small_business),
              }
            : null,
        clients: clients.map((raw) => {
            const c = (raw ?? {}) as Loose;
            return {
                name: str(c.name, "Kunde"),
                contact_person: str(c.contact_person) || undefined,
                address_line1: str(c.address_line1 || c.street),
                address_line2: str(c.address_line2) || undefined,
                postal_code: str(c.postal_code || c.zip),
                city: str(c.city),
                country: str(c.country, "DE"),
                email: str(c.email) || undefined,
                phone: str(c.phone) || undefined,
                vat_id: str(c.vat_id) || undefined,
                tax_number: str(c.tax_number) || undefined,
                leitweg_id: str(c.leitweg_id) || undefined,
                customer_number: str(c.customer_number || c.id) || undefined,
            } satisfies NormalizedMigrationClient;
        }),
        products: products.map((raw) => {
            const p = (raw ?? {}) as Loose;
            return {
                name: str(p.name, "Produkt"),
                description: str(p.description) || undefined,
                price: num(p.price),
                tax_rate_percent: num(p.tax_rate_percent ?? p.vat_rate, 19),
                unit_of_measure: str(p.unit_of_measure || p.unit, "Stk"),
                article_number: str(p.article_number) || undefined,
                ean_gtin: str(p.ean_gtin || p.gtin) || undefined,
            } satisfies NormalizedMigrationProduct;
        }),
        invoices: invoices.map((raw) => {
            const inv = (raw ?? {}) as Loose;
            const statusRaw = str(inv.status, "draft");
            const status = (["draft", "sent", "paid", "cancelled", "overdue"].includes(statusRaw)
                ? statusRaw
                : "draft") as NormalizedMigrationInvoice["status"];
            return {
                invoice_number: str(inv.invoice_number || inv.number, "RE-IMPORT"),
                issue_date: str(inv.issue_date || inv.date).slice(0, 10),
                due_date: str(inv.due_date).slice(0, 10),
                delivery_date: str(inv.delivery_date || inv.delivery_date_end).slice(0, 10) || undefined,
                status,
                client_name: str(inv.client_name) || clientName(inv.client_id),
                client_email: str(inv.client_email) || undefined,
                subtotal: num(inv.subtotal ?? inv.total_net),
                total_vat: num(inv.total_vat ?? inv.vat_total),
                total_gross: num(inv.total_gross ?? inv.total),
                notes: str(inv.notes) || undefined,
                purchase_order_ref: str(inv.purchase_order_ref) || undefined,
                payment_terms: str(inv.payment_terms) || undefined,
                items: mapItems(inv.items),
            } satisfies NormalizedMigrationInvoice;
        }),
        offers: offers.map((raw) => {
            const o = (raw ?? {}) as Loose;
            return {
                offer_number: str(o.offer_number || o.number, "AN-IMPORT"),
                issue_date: str(o.issue_date || o.date).slice(0, 10),
                valid_until: str(o.valid_until).slice(0, 10) || undefined,
                status: str(o.status, "draft"),
                client_name: str(o.client_name) || clientName(o.client_id),
                client_email: str(o.client_email) || undefined,
                subtotal: num(o.subtotal ?? o.total_net),
                total_vat: num(o.total_vat ?? o.vat_total),
                total_gross: num(o.total_gross ?? o.total),
                notes: str(o.notes) || undefined,
                purchase_order_ref: str(o.purchase_order_ref) || undefined,
                payment_terms: str(o.payment_terms) || undefined,
                items: mapItems(o.items),
            };
        }),
        expenses: expenses.map((raw) => {
            const e = (raw ?? {}) as Loose;
            const gross = num(e.amount_gross ?? e.amount);
            const vatRate = num(e.vat_rate_percent ?? e.vat_rate, 19);
            const net = num(e.amount_net, gross / (1 + vatRate / 100));
            const vat = num(e.vat_amount, gross - net);
            return {
                date: str(e.date).slice(0, 10),
                vendor_name: str(e.vendor_name || e.vendor || e.supplier, "Lieferant"),
                description: str(e.description, "Ausgabe"),
                category: (str(e.category, "other") as NormalizedMigrationExpense["category"]),
                amount_net: net,
                vat_rate_percent: vatRate,
                vat_amount: vat,
                amount_gross: gross,
                payment_method: (str(e.payment_method, "other") as NormalizedMigrationExpense["payment_method"]),
                invoice_number: str(e.invoice_number) || undefined,
                notes: str(e.notes) || undefined,
            } satisfies NormalizedMigrationExpense;
        }),
    };
}
