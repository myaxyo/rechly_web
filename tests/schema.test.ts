import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("appwrite.config.json", "utf8")) as {
    tables: Array<{
        $id: string;
        columns: Array<{ key: string; type: string; required: boolean; size?: number; default?: unknown }>;
        indexes?: Array<{ key: string; columns: string[] }>;
    }>;
};
const table = (id: string) => config.tables.find((t) => t.$id === id);
const setupSource = readFileSync("src/app/api/admin/setup-collections/route.ts", "utf8");

test("recurring item discountPercent is an optional double with a creatable default", () => {
    const ri = table("recurring_invoice_items");
    assert.ok(ri, "recurring_invoice_items table exists in config");
    const col = ri.columns.find((c) => c.key === "discountPercent");
    assert.ok(col, "discountPercent column declared (writers always send it)");
    assert.equal(col.type, "double");
    // Appwrite rejects defaults on required attributes — that was the prod failure.
    assert.equal(col.required, false);
});

test("invoice_templates payload is declared off-row sized, not an inline varchar", () => {
    const templates = table("invoice_templates");
    assert.ok(templates, "invoice_templates table exists in config");
    const payload = templates.columns.find((c) => c.key === "payload");
    assert.ok(payload, "payload column declared");
    assert.equal(payload.type, "string");
    // >= 100k forces off-row TEXT storage; a 16k varchar exceeds the row-size limit.
    assert.ok((payload.size ?? 0) >= 100_000, `payload size ${payload.size} would be stored inline`);
});

test("setup route creates both attributes in their creatable form", () => {
    // The recurring discount must not be created as required+default again.
    assert.doesNotMatch(setupSource, /"recurring_invoice_items",\s*"discountPercent",\s*true/);
    // Template payload must be created at the off-row size, not 16000.
    assert.match(setupSource, /"invoice_templates",\s*"payload",\s*1_000_000/);
});

test("bank_transactions declares every attribute the bank import writes", () => {
    const bank = table("bank_transactions");
    assert.ok(bank, "bank_transactions table exists in config");
    const col = (key: string) => bank.columns.find((c) => c.key === key);
    for (const key of [
        "userId", "bookingDate", "valueDate", "amount", "currency",
        "description", "reference", "counterpartName", "counterpartIban",
        "status", "matchedInvoiceId", "importBatchId", "bankReference",
    ]) {
        assert.ok(col(key), `bank_transactions.${key} declared (import writes it unconditionally)`);
    }
    assert.equal(col("bookingDate")?.size, 10);
    assert.equal(col("description")?.size, 1000);
    assert.equal(col("reference")?.size, 500);
    assert.equal(col("counterpartName")?.size, 200);
    assert.equal(col("counterpartIban")?.size, 34);
    assert.equal(col("currency")?.size, 3);
    // IBAN-scoped references ("<IBAN>:<AcctSvcrRef>#n") need 128, not 64.
    assert.equal(col("bankReference")?.size, 128);
    assert.equal(col("description")?.required, false);
    assert.equal(col("bankReference")?.required, false);

    const composite = (bank.indexes ?? []).find(
        (i) => i.columns.length === 2 && i.columns[0] === "userId" && i.columns[1] === "bookingDate",
    );
    assert.ok(composite, "composite (userId, bookingDate) index declared for orderDesc(bookingDate)");
});

test("setup route creates bank_transactions attributes and index in sync with config", () => {
    assert.match(setupSource, /"bank_transactions",\s*"description",\s*1000/);
    assert.match(setupSource, /"bank_transactions",\s*"bankReference",\s*128/);
    assert.match(setupSource, /"bank_transactions",\s*"bookingDate",\s*10/);
    assert.match(setupSource, /userId_bookingDate_idx/);
    const migrateSource = readFileSync("scripts/migrate-bank.mjs", "utf8");
    assert.match(migrateSource, /bankReference/);
    assert.match(migrateSource, /userId_bookingDate_idx/);
});
