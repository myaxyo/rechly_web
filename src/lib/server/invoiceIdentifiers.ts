import { type Databases, Query } from "node-appwrite";
import { COLLECTIONS, DATABASE_ID } from "@/lib/appwrite-server";
import { readEInvoiceData, snapshotIdentifiers } from "@/lib/eRechnung/identifiers";

/** Snapshot current defaults when a template/offer becomes an invoice. */
export async function invoiceIdentifierDefaults(databases: Databases, userId: string, clientId: string) {
    const client = await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, clientId);
    if (client.userId !== userId) return null;
    const companies = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMPANY_INFO, [
        Query.equal("userId", userId), Query.limit(1),
    ]);
    const snapshot = snapshotIdentifiers(readEInvoiceData(client.eInvoiceData), readEInvoiceData(companies.documents[0]?.eInvoiceData));
    return Object.keys(snapshot).length ? { eInvoiceData: JSON.stringify(snapshot) } : {};
}
