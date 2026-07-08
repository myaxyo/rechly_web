import { NextRequest, NextResponse } from "next/server";
import { Query, ID, Permission, Role } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";
import {
    calculateInvoiceTotals,
    calculateLineItemTotals,
} from "@/lib/currencyUtils";

// GET all invoices with client info
export async function GET() {
    try {
        let account;
        try {
            const sessionClient = await createSessionClient();
            account = sessionClient.account;
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const { databases } = await createAdminClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        // Get invoices filtered by userId
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            [
                Query.equal("userId", user.$id),
                Query.orderDesc("$createdAt"),
                Query.limit(1000),
            ],
        );

        // Get all clients for this user to join
        const clientsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            [Query.equal("userId", user.$id), Query.limit(1000)],
        );

        const clientsMap = new Map(
            clientsResponse.documents.map((c) => [
                c.$id,
                {
                    id: c.$id,
                    name: c.name,
                    contact_person: c.contactPerson ?? undefined,
                    address_line1: c.addressLine1,
                    address_line2: c.addressLine2 ?? undefined,
                    postal_code: c.postalCode,
                    city: c.city,
                    country: c.country || "Deutschland",
                    email: c.email ?? undefined,
                    phone: c.phone ?? undefined,
                    vat_id: c.vatId ?? undefined,
                    tax_number: c.taxNumber ?? undefined,
                    leitweg_id: c.leitwegId ?? undefined,
                    created_at: new Date(c.$createdAt).getTime(),
                    updated_at: new Date(c.$updatedAt).getTime(),
                },
            ]),
        );

        // Map documents to invoice format with client
        const invoices = response.documents.map((doc) => ({
            id: doc.$id,
            client_id: doc.clientId,
            invoice_number: doc.invoiceNumber,
            issue_date: doc.issueDate,
            due_date: doc.dueDate ?? undefined,
            subtotal: doc.subtotal ?? 0,
            total_vat: doc.totalVat ?? 0,
            total_gross: doc.totalGross ?? 0,
            status: doc.status || "draft",
            notes: doc.notes ?? undefined,
            purchase_order_ref: doc.purchaseOrderRef ?? undefined,
            delivery_date: doc.deliveryDate ?? undefined,
            payment_terms: doc.paymentTerms ?? undefined,
            correction_type: doc.correctionType ?? null,
            corrects_invoice_id: doc.correctsInvoiceId ?? null,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
            client: clientsMap.get(doc.clientId) || undefined,
        }));

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoices" },
            { status: 500 },
        );
    }
}

// POST create new invoice with items
export async function POST(request: NextRequest) {
    try {
        let account;
        try {
            const sessionClient = await createSessionClient();
            account = sessionClient.account;
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const { databases } = await createAdminClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Generate a unique ID - ID.unique() should always be unique
        // but we log it for debugging purposes
        const invoiceId = ID.unique();

        // Log request body for debugging
        console.log("Generated invoice ID:", invoiceId);
        console.log("Invoice number from body:", body.invoice_number);
        console.log("Client ID from body:", body.client_id);
        console.log("User ID:", user.$id);

        // Calculate totals
        const totals = calculateInvoiceTotals(
            body.items.map(
                (item: {
                    quantity: number;
                    price: number;
                    tax_rate_percent: number;
                    discount_percent?: number;
                }) => ({
                    quantity: item.quantity,
                    price: item.price,
                    tax_rate_percent: item.tax_rate_percent,
                    discount_percent: item.discount_percent || 0,
                }),
            ),
        );

        // Create invoice document with permissions
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            invoiceId,
            {
                userId: user.$id,
                clientId: body.client_id,
                invoiceNumber: body.invoice_number,
                issueDate: body.issue_date,
                dueDate: body.due_date || null,
                subtotal: totals.netAfterDiscount,
                totalVat: totals.totalVAT,
                totalGross: totals.totalGross,
                status: "draft",
                notes: body.notes || null,
                purchaseOrderRef: body.purchase_order_ref || null,
                deliveryDate: body.delivery_date || null,
                paymentTerms: body.payment_terms || null,
                correctionType: null,
                correctsInvoiceId: null,
            },
            [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ],
        );

        // Create invoice items
        for (const item of body.items) {
            const itemCalc = calculateLineItemTotals(
                item.quantity,
                item.price,
                item.tax_rate_percent,
                item.discount_percent || 0,
            );

            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.INVOICE_ITEMS,
                ID.unique(),
                {
                    invoiceId: invoiceId,
                    productId: item.product_id || null,
                    description: item.description,
                    quantity: item.quantity,
                    unitOfMeasure: item.unit_of_measure || "Stück",
                    price: item.price,
                    taxRatePercent: item.tax_rate_percent,
                    discountPercent: item.discount_percent || 0,
                    subtotal: itemCalc.subtotal,
                    taxAmount: itemCalc.taxAmount,
                    total: itemCalc.total,
                },
                [
                    Permission.read(Role.user(user.$id)),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ],
            );
        }

        return NextResponse.json({ id: invoiceId });
    } catch (error) {
        console.error("Error creating invoice:", error);
        // Log more details for debugging
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        // Check if it's an Appwrite error with more details
        const appwriteError = error as {
            code?: number;
            type?: string;
            response?: unknown;
        };
        if (appwriteError.code) {
            console.error("Appwrite error code:", appwriteError.code);
            console.error("Appwrite error type:", appwriteError.type);
            console.error(
                "Appwrite error response:",
                JSON.stringify(appwriteError.response),
            );
        }
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to create invoice", details: errorMessage },
            { status: 500 },
        );
    }
}
