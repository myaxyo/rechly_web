import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
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
        const user = await account.get();

        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.RECURRING_INVOICES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const [itemsRes, clientDoc] = await Promise.all([
            databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.RECURRING_INVOICE_ITEMS,
                [Query.equal("recurringInvoiceId", id), Query.limit(200)],
            ),
            databases
                .getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, doc.clientId)
                .catch(() => null),
        ]);

        const template = {
            id: doc.$id,
            template_name: doc.templateName,
            client_id: doc.clientId,
            interval: doc.interval,
            next_due_date: doc.nextDueDate,
            end_date: doc.endDate ?? null,
            is_active: doc.isActive ?? true,
            last_created_invoice_id: doc.lastCreatedInvoiceId ?? null,
            notes: doc.notes ?? undefined,
            payment_terms: doc.paymentTerms ?? undefined,
            subtotal: doc.subtotal ?? 0,
            total_vat: doc.totalVat ?? 0,
            total_gross: doc.totalGross ?? 0,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
            client: clientDoc
                ? {
                      id: clientDoc.$id,
                      name: clientDoc.name,
                      email: clientDoc.email ?? undefined,
                      city: clientDoc.city,
                      country: clientDoc.country || "Deutschland",
                      address_line1: clientDoc.addressLine1,
                      postal_code: clientDoc.postalCode,
                      created_at: new Date(clientDoc.$createdAt).getTime(),
                      updated_at: new Date(clientDoc.$updatedAt).getTime(),
                  }
                : undefined,
            items: itemsRes.documents.map((item) => ({
                id: item.$id,
                recurring_invoice_id: item.recurringInvoiceId,
                product_id: item.productId ?? undefined,
                description: item.description,
                quantity: item.quantity,
                unit_of_measure: item.unitOfMeasure || "Stück",
                price: item.price,
                tax_rate_percent: item.taxRatePercent ?? 19,
                discount_percent: item.discountPercent ?? 0,
                subtotal: item.subtotal ?? 0,
                tax_amount: item.taxAmount ?? 0,
                total: item.total ?? 0,
            })),
        };

        return NextResponse.json(template);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
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
        const user = await account.get();
        const body = await request.json();

        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.RECURRING_INVOICES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updates: Record<string, unknown> = {};
        if (typeof body.is_active === "boolean")
            updates.isActive = body.is_active;
        if (body.notes !== undefined) updates.notes = body.notes;
        if (body.payment_terms !== undefined)
            updates.paymentTerms = body.payment_terms;
        if (body.next_due_date !== undefined)
            updates.nextDueDate = body.next_due_date;
        if (body.end_date !== undefined) updates.endDate = body.end_date;

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.RECURRING_INVOICES,
            id,
            updates,
        );
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to update" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
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
        const user = await account.get();

        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.RECURRING_INVOICES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const itemsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.RECURRING_INVOICE_ITEMS,
            [Query.equal("recurringInvoiceId", id), Query.limit(200)],
        );
        for (const item of itemsRes.documents) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.RECURRING_INVOICE_ITEMS,
                item.$id,
            );
        }
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.RECURRING_INVOICES,
            id,
        );

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete" },
            { status: 500 },
        );
    }
}
