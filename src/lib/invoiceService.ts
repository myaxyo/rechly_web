import { Query } from "appwrite";
import {
    databases,
    DATABASE_ID,
    COLLECTIONS,
    generateId,
    getCurrentUserId,
    getUserPermissions,
} from "./appwrite";
import type {
    Invoice,
    InvoiceItem,
    InvoiceWithClient,
    InvoiceWithDetails,
    InvoiceFormData,
} from "@/types";
import { getClientById } from "./clientService";
import {
    calculateInvoiceTotals,
    calculateLineItemTotals,
} from "./currencyUtils";

/**
 * Invoice Service - CRUD operations for Appwrite
 * Uses camelCase field names to match Appwrite schema
 * Filters by userId for data isolation between users
 */

/**
 * Map Appwrite document to Invoice base
 */
const mapDocumentToInvoice = (doc: Record<string, unknown>): Invoice => ({
    id: doc.$id as string,
    client_id: doc.clientId as string,
    invoice_number: doc.invoiceNumber as string,
    issue_date: doc.issueDate as string,
    due_date: (doc.dueDate as string | null) ?? undefined,
    subtotal: (doc.subtotal as number) ?? 0,
    total_vat: (doc.totalVat as number) ?? 0,
    total_gross: (doc.totalGross as number) ?? 0,
    status: ((doc.status as string) || "draft") as
        | "draft"
        | "sent"
        | "paid"
        | "cancelled",
    notes: (doc.notes as string | null) ?? undefined,
    purchase_order_ref: (doc.purchaseOrderRef as string | null) ?? undefined,
    delivery_date: (doc.deliveryDate as string | null) ?? undefined,
    payment_terms: (doc.paymentTerms as string | null) ?? undefined,
    created_at: new Date(doc.$createdAt as string).getTime(),
    updated_at: new Date(doc.$updatedAt as string).getTime(),
});

/**
 * Get all invoices with client info
 */
export const getAllInvoices = async (): Promise<InvoiceWithClient[]> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.log("No user logged in, returning empty invoices");
            return [];
        }

        // Build query - try to filter by userId if the field exists in Appwrite schema
        const baseQueries = [Query.orderDesc("$createdAt"), Query.limit(1000)];

        let response;
        try {
            // Try with userId filter first (if attribute exists in Appwrite)
            response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.INVOICES,
                [Query.equal("userId", userId), ...baseQueries]
            );
        } catch (error: unknown) {
            // If userId attribute doesn't exist, fall back to no filter
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === 400
            ) {
                console.log(
                    "userId attribute not found in invoices schema, relying on document permissions"
                );
                response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.INVOICES,
                    baseQueries
                );
            } else {
                throw error;
            }
        }

        const invoices: InvoiceWithClient[] = [];

        for (const doc of response.documents) {
            const client = doc.clientId
                ? await getClientById(doc.clientId as string)
                : undefined;

            invoices.push({
                ...mapDocumentToInvoice(doc),
                client: client || undefined,
            });
        }

        return invoices;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
    }
};

/**
 * Get invoice by ID with all details
 */
export const getInvoiceById = async (
    id: string
): Promise<InvoiceWithDetails | null> => {
    try {
        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            id
        );

        const client = doc.clientId
            ? await getClientById(doc.clientId)
            : undefined;

        // Get invoice items
        const itemsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.INVOICE_ITEMS,
            [Query.equal("invoiceId", id), Query.limit(100)]
        );

        const items: InvoiceItem[] = itemsResponse.documents.map((item) => ({
            id: item.$id,
            invoice_id: item.invoiceId,
            product_id: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit_of_measure: item.unitOfMeasure || "Stück",
            price: item.price,
            tax_rate_percent: item.taxRatePercent ?? 19,
            discount_percent: item.discountPercent ?? 0,
            subtotal: item.subtotal ?? 0,
            tax_amount: item.taxAmount ?? 0,
            total: item.total ?? 0,
        }));

        return {
            id: doc.$id,
            client_id: doc.clientId,
            invoice_number: doc.invoiceNumber,
            issue_date: doc.issueDate,
            due_date: doc.dueDate,
            subtotal: doc.subtotal ?? 0,
            total_vat: doc.totalVat ?? 0,
            total_gross: doc.totalGross ?? 0,
            status: doc.status || "draft",
            notes: doc.notes,
            purchase_order_ref: doc.purchaseOrderRef,
            delivery_date: doc.deliveryDate,
            payment_terms: doc.paymentTerms,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
            client: client || undefined,
            items,
        };
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return null;
    }
};

/**
 * Create new invoice with items
 */
export const createInvoice = async (data: InvoiceFormData): Promise<string> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("Must be logged in to create invoices");
        }

        const invoiceId = generateId();
        const permissions = getUserPermissions(userId);

        // Calculate totals
        const totals = calculateInvoiceTotals(
            data.items.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                tax_rate_percent: item.tax_rate_percent,
                discount_percent: item.discount_percent || 0,
            }))
        );

        // Create invoice document with user permissions
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            invoiceId,
            {
                clientId: data.client_id,
                invoiceNumber: data.invoice_number,
                issueDate: data.issue_date,
                dueDate: data.due_date || null,
                subtotal: totals.netAfterDiscount,
                totalVat: totals.totalVAT,
                totalGross: totals.totalGross,
                status: "draft",
                notes: data.notes || null,
                purchaseOrderRef: data.purchase_order_ref || null,
                deliveryDate: data.delivery_date || null,
                paymentTerms: data.payment_terms || null,
            },
            permissions
        );

        // Create invoice items
        for (const item of data.items) {
            const itemCalc = calculateLineItemTotals(
                item.quantity,
                item.price,
                item.tax_rate_percent,
                item.discount_percent || 0
            );

            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.INVOICE_ITEMS,
                generateId(),
                {
                    invoiceId: invoiceId,
                    productId: item.product_id || null,
                    description: item.description,
                    quantity: item.quantity,
                    unitOfMeasure: item.unit_of_measure,
                    price: item.price,
                    taxRatePercent: item.tax_rate_percent,
                    discountPercent: item.discount_percent || 0,
                    subtotal: itemCalc.subtotal,
                    taxAmount: itemCalc.taxAmount,
                    total: itemCalc.total,
                },
                permissions
            );
        }

        return invoiceId;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (
    id: string,
    status: string
): Promise<void> => {
    try {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.INVOICES, id, {
            status,
        });
    } catch (error) {
        console.error("Error updating invoice status:", error);
        throw error;
    }
};

/**
 * Delete invoice and its items
 */
export const deleteInvoice = async (id: string): Promise<void> => {
    try {
        // First delete all invoice items
        const itemsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.INVOICE_ITEMS,
            [Query.equal("invoiceId", id)]
        );

        for (const item of itemsResponse.documents) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.INVOICE_ITEMS,
                item.$id
            );
        }

        // Then delete the invoice
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.INVOICES, id);
    } catch (error) {
        console.error("Error deleting invoice:", error);
        throw error;
    }
};

/**
 * Get invoice statistics
 */
export interface InvoiceStats {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    cancelled: number;
    paidAmount: number;
    unpaidAmount: number;
}

export const getInvoiceStats = async (): Promise<InvoiceStats> => {
    try {
        const invoices = await getAllInvoices();

        const stats: InvoiceStats = {
            total: invoices.length,
            draft: 0,
            sent: 0,
            paid: 0,
            cancelled: 0,
            paidAmount: 0,
            unpaidAmount: 0,
        };

        for (const invoice of invoices) {
            switch (invoice.status) {
                case "draft":
                    stats.draft++;
                    stats.unpaidAmount += invoice.total_gross;
                    break;
                case "sent":
                    stats.sent++;
                    stats.unpaidAmount += invoice.total_gross;
                    break;
                case "paid":
                    stats.paid++;
                    stats.paidAmount += invoice.total_gross;
                    break;
                case "cancelled":
                    stats.cancelled++;
                    break;
            }
        }

        return stats;
    } catch (error) {
        console.error("Error getting invoice stats:", error);
        return {
            total: 0,
            draft: 0,
            sent: 0,
            paid: 0,
            cancelled: 0,
            paidAmount: 0,
            unpaidAmount: 0,
        };
    }
};
