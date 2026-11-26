// Operator-only additive migration for bank_transactions (CAMT import).
// Run BEFORE deploying code that writes description/bankReference, or at
// least before the first CAMT/CSV import on an existing instance:
//   node --env-file=.env.local scripts/migrate-bank.mjs
// Ensures every attribute the bank import writes exists, widens
// bankReference 64 -> 128 (IBAN-scoped references), and adds the
// composite (userId, bookingDate) index used by GET /api/bank-transactions.
// The import route also degrades gracefully on a not-yet-migrated schema,
// but deduplication by bankReference only works once this has run.
import { Client, Databases, IndexType } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;
if (!endpoint || !project || !key) throw new Error("Set Appwrite endpoint, project and scoped API key in the environment.");

const DB = "rechly-db";
const COLL = "bank_transactions";
const db = new Databases(new Client().setEndpoint(endpoint).setProject(project).setKey(key));

async function getAttr(name) {
    try { return await db.getAttribute(DB, COLL, name); }
    catch (error) { if (error.code === 404) return null; throw error; }
}

async function waitAvailable(name) {
    for (let attempt = 0; attempt < 60; attempt++) {
        const value = await db.getAttribute(DB, COLL, name);
        if (value.status === "available") { console.log(`${COLL}.${name}: ready`); return value; }
        if (value.status === "failed" || value.status === "stuck") throw new Error(`Attribute creation failed: ${COLL}.${name}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Attribute still pending: ${COLL}.${name}; retry later.`);
}

async function ensure(name, create) {
    const existing = await getAttr(name);
    if (existing) {
        console.log(`${COLL}.${name}: exists`);
        return existing.status === "available" ? existing : waitAvailable(name);
    }
    try { await create(); }
    catch (error) { if (error.code !== 409) throw error; }
    return waitAvailable(name);
}

await ensure("userId", () => db.createStringAttribute(DB, COLL, "userId", 36, true));
await ensure("bookingDate", () => db.createStringAttribute(DB, COLL, "bookingDate", 10, true));
await ensure("valueDate", () => db.createStringAttribute(DB, COLL, "valueDate", 10, false));
await ensure("counterpartName", () => db.createStringAttribute(DB, COLL, "counterpartName", 200, false));
await ensure("counterpartIban", () => db.createStringAttribute(DB, COLL, "counterpartIban", 34, false));
await ensure("reference", () => db.createStringAttribute(DB, COLL, "reference", 500, false));
await ensure("description", () => db.createStringAttribute(DB, COLL, "description", 1000, false));
await ensure("amount", () => db.createFloatAttribute(DB, COLL, "amount", true));
await ensure("currency", () => db.createStringAttribute(DB, COLL, "currency", 3, true));
await ensure("status", () => db.createEnumAttribute(DB, COLL, "status", ["unmatched", "matched", "ignored"], false, "unmatched"));
await ensure("matchedInvoiceId", () => db.createStringAttribute(DB, COLL, "matchedInvoiceId", 36, false));
await ensure("importBatchId", () => db.createStringAttribute(DB, COLL, "importBatchId", 36, true));
const bankReference = await ensure("bankReference", () => db.createStringAttribute(DB, COLL, "bankReference", 128, false));

// Widen a pre-existing 64-char bankReference: scoped references
// ("<IBAN>:<AcctSvcrRef>#n") do not reliably fit in 64 chars.
if ((bankReference.size ?? 0) < 128) {
    await db.updateStringAttribute(DB, COLL, "bankReference", false, undefined, 128);
    await waitAvailable("bankReference");
    console.log(`${COLL}.bankReference: widened to 128`);
}

async function ensureIndex(keyName, attributes, orders) {
    try {
        await db.createIndex(DB, COLL, keyName, IndexType.Key, attributes, orders);
        console.log(`index ${keyName}: created`);
    } catch (error) {
        if (error.code !== 409) throw error;
        console.log(`index ${keyName}: exists`);
    }
}
await ensureIndex("userId_idx", ["userId"], ["ASC"]);
await ensureIndex("userId_bookingDate_idx", ["userId", "bookingDate"], ["ASC", "DESC"]);

console.log("bank_transactions migration complete.");
