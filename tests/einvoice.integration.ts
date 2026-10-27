/** Run against an isolated local desktop-backed Next server, never production. */
import assert from "node:assert/strict";
import { getDesktopClients } from "../src/lib/desktop/appwrite-compat";
import { invoice, company } from "./fixtures/identifier-invoice";

async function main() {
    if (process.env.RECHLY_DATA_DIR !== "/tmp/rechly-web-integration") throw new Error("Use the isolated integration data directory");
    const origin = "http://127.0.0.1:3102";
    async function request(path: string, method = "GET", body?: unknown, expected = 200) {
        const response = await fetch(origin + path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
        const text = await response.text();
        assert.equal(response.status, expected, `${method} ${path}: ${text}`);
        return JSON.parse(text);
    }
    assert.equal((await request("/api/desktop/health")).storage, "sqlite");
    const ids: string[] = [];
    let invoiceId: string | undefined;
    const generatedIds: string[] = [];
    const sourceIds: [string, string][] = [];
    const { databases } = getDesktopClients();
    const foreignId = `foreign-${Date.now()}`;
    try {
        await request("/api/company", "POST", { ...company, e_invoice: { seller_identifier: invoice.e_invoice!.seller_identifier } });
        // All 260 records pass through the real Next API and are persisted in SQLite.
        for (let batch = 0; batch < 26; batch++) {
            await Promise.all(Array.from({ length: 10 }, async (_, n) => {
                const data = await request("/api/clients", "POST", { ...invoice.client, name: `Integration ${batch * 10 + n}`, e_invoice: {
                    buyer_identifier: invoice.e_invoice!.buyer_identifier,
                    delivery_locations: [invoice.e_invoice!.delivery, { ...invoice.e_invoice!.delivery, name: "South" }],
                } });
                ids.push(data.id);
            }));
        }
        const customers = await request("/api/clients");
        for (const id of ids) assert.ok(customers.some((c: { id: string }) => c.id === id));
        assert.equal((await request(`/api/clients/${ids[0]}`)).e_invoice.delivery_locations.length, 2);
        await request(`/api/clients/${ids[0]}`, "PUT", { ...invoice.client, name: "Edited", e_invoice: {
            buyer_identifier: { value: "internal-override" }, delivery_locations: [invoice.e_invoice!.delivery],
        } });
        assert.equal((await request(`/api/clients/${ids[0]}`)).e_invoice.buyer_identifier.value, "internal-override");
        // Older API clients omit the new fields: existing metadata must survive.
        await request(`/api/clients/${ids[0]}`, "PUT", { ...invoice.client, name: "Legacy edit" });
        assert.equal((await request(`/api/clients/${ids[0]}`)).e_invoice.buyer_identifier.value, "internal-override");
        for (const [collection, endpoint] of [["offers", "convert"], ["recurring_invoices", "generate"]]) {
            const sourceId = `source-${collection}-${Date.now()}`;
            await databases.createDocument("rechly-db", collection, sourceId, {
                userId: "desktop-local-user", clientId: ids[0], status: "draft", subtotal: 0, totalVat: 0, totalGross: 0,
                nextDueDate: "2026-10-27", interval: "monthly",
            });
            sourceIds.push([collection, sourceId]);
            const route = collection === "offers" ? "offers" : "recurring";
            const generated = await request(`/api/${route}/${sourceId}/${endpoint}`, "POST");
            generatedIds.push(generated.invoiceId);
            const result = await request(`/api/invoices/${generated.invoiceId}`);
            assert.equal(result.e_invoice.buyer_identifier.value, "internal-override");
            assert.equal(result.e_invoice.seller_identifier.scheme, "0088");
        }
        const created = await request("/api/invoices", "POST", { ...invoice, client_id: ids[0],
            e_invoice: { buyer_identifier: { value: "invoice-specific" }, delivery: invoice.e_invoice!.delivery } });
        invoiceId = created.id;
        const saved = await request(`/api/invoices/${invoiceId}`);
        assert.equal(saved.items[0].gtin, invoice.items[0].gtin);
        assert.equal(saved.total_gross, 119);
        assert.equal(saved.e_invoice.buyer_identifier.value, "invoice-specific");
        assert.equal(saved.e_invoice.seller_identifier.scheme, "0088");
        await request(`/api/clients/${ids[0]}`, "PUT", { ...invoice.client, e_invoice: {} });
        assert.equal((await request(`/api/invoices/${invoiceId}`)).e_invoice.delivery.name, "Branch <North>");
        await request("/api/clients", "POST", { ...invoice.client, e_invoice: { buyer_identifier: { value: "123", scheme: "0088" } } }, 400);
        await request("/api/invoices", "POST", { ...invoice, client_id: ids[0], items: [{ ...invoice.items[0], gtin: "123" }] }, 400);
        await databases.createDocument("rechly-db", "clients", foreignId, { userId: "another-tenant", name: "Private" });
        for (const method of ["GET", "PUT", "DELETE"]) await request(`/api/clients/${foreignId}`, method, method === "PUT" ? invoice.client : undefined, 404);
        await request("/api/invoices", "POST", { ...invoice, client_id: foreignId }, 404);
        for (const [collection, sourceId] of sourceIds) {
            await databases.updateDocument("rechly-db", collection, sourceId, { clientId: foreignId, status: "draft" });
            const route = collection === "offers" ? "offers" : "recurring";
            const endpoint = collection === "offers" ? "convert" : "generate";
            await request(`/api/${route}/${sourceId}/${endpoint}`, "POST", undefined, 404);
        }
        assert.equal((await databases.getDocument("rechly-db", "clients", foreignId)).name, "Private");
        console.log("PASS: 260 persisted customers; branches; edits; invoice snapshots; GTIN; invalid input; cross-tenant read/update/delete/invoice protection.");
    } finally {
        if (invoiceId) await request(`/api/invoices/${invoiceId}`, "DELETE");
        for (const id of generatedIds) await request(`/api/invoices/${id}`, "DELETE");
        for (const [collection, id] of sourceIds) await databases.deleteDocument("rechly-db", collection, id);
        for (const id of ids) await request(`/api/clients/${id}`, "DELETE");
        await databases.deleteDocument("rechly-db", "clients", foreignId);
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
