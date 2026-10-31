import { type Databases, type Storage, type Users, type Models, Query, Permission, Role } from "node-appwrite";
import { allDocuments } from "./pagination";

const database = "rechly-db";
const children: Record<string, [string, string]> = {
    invoices: ["invoice_items", "invoiceId"],
    offers: ["offer_items", "offerId"],
    recurring_invoices: ["recurring_invoice_items", "recurringInvoiceId"],
};
const collections = ["invoices", "offers", "recurring_invoices", "dunning_notices", "expenses", "bank_transactions", "products", "clients", "user_company"];
type Backend = { databases: Databases; storage: Storage; users: Users };
const errorType = (error: unknown) => (error as { type?: string })?.type;
async function deleteIfPresent(action: () => Promise<unknown>) {
    try { await action(); } catch (error) {
        if (!["document_not_found", "storage_file_not_found"].includes(errorType(error) || "")) throw error;
    }
}

/** Never accepts a browser-supplied account ID. Caller must authenticate first.
 * Identity deletion is last: failed cleanup leaves the login available for retry.
 */
export async function eraseAccountData({ databases, storage, users }: Backend, userId: string) {
    // Preflight authentication/key scope before any data deletion.
    await users.get(userId);
    type OwnedDocument = Models.Document & { userId: string };
    const records = new Map<string, OwnedDocument[]>();
    for (const collection of collections) {
        try {
            records.set(collection, await allDocuments(q => databases.listDocuments<OwnedDocument>(database, collection, q), [Query.equal("userId", userId)]));
        } catch (error) {
            // Optional feature collections may not have been provisioned.
            if (errorType(error) !== "collection_not_found" || ["clients", "invoices", "user_company", "products"].includes(collection)) throw error;
        }
    }
    // Include replaced/unattached uploads. Do not trust receiptFileId references:
    // a malformed reference must never delete another tenant's file.
    let files: Awaited<ReturnType<Storage["listFiles"]>>["files"] = [];
    try {
        files = await allDocuments(async q => ({ documents: (await storage.listFiles("receipts", q)).files }), []);
    } catch (error) {
        if (errorType(error) !== "storage_bucket_not_found") throw error;
    }
    const ownerPermission = Permission.delete(Role.user(userId));
    for (const file of files.filter(file => file.$permissions.includes(ownerPermission))) {
        await deleteIfPresent(() => storage.deleteFile("receipts", file.$id));
    }
    for (const [collection, documents] of records) {
        for (const document of documents) {
            if (document.userId !== userId) throw new Error("Account deletion ownership mismatch");
            const child = children[collection];
            if (child) {
                const items = await allDocuments(q => databases.listDocuments(database, child[0], q), [Query.equal(child[1], document.$id)]);
                for (const item of items) await deleteIfPresent(() => databases.deleteDocument(database, child[0], item.$id));
            }
            await deleteIfPresent(() => databases.deleteDocument(database, collection, document.$id));
        }
    }
    // Appwrite Users.delete removes the actual identity and its preferences,
    // including saved AI credentials. Account.updateStatus only disables it.
    await users.delete(userId);
}
