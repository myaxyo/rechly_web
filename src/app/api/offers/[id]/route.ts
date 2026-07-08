import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
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
            COLLECTIONS.OFFERS,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const itemsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OFFER_ITEMS,
            [Query.equal("offerId", id), Query.limit(200)],
        );

        let client = undefined;
        if (doc.clientId) {
            try {
                const clientDoc = await databases.getDocument(
                    DATABASE_ID,
                    COLLECTIONS.CLIENTS,
                    doc.clientId,
                );
                client = {
                    id: clientDoc.$id,
                    name: clientDoc.name,
                    contact_person: clientDoc.contactPerson ?? undefined,
                    address_line1: clientDoc.addressLine1,
                    address_line2: clientDoc.addressLine2 ?? undefined,
                    postal_code: clientDoc.postalCode,
                    city: clientDoc.city,
                    country: clientDoc.country || "Deutschland",
                    email: clientDoc.email ?? undefined,
                    phone: clientDoc.phone ?? undefined,
                    vat_id: clientDoc.vatId ?? undefined,
                    tax_number: clientDoc.taxNumber ?? undefined,
                    leitweg_id: clientDoc.leitwegId ?? undefined,
                    created_at: new Date(clientDoc.$createdAt).getTime(),
                    updated_at: new Date(clientDoc.$updatedAt).getTime(),
                };
            } catch {
                // client not found
            }
        }

        const offer = {
            id: doc.$id,
            client_id: doc.clientId,
            offer_number: doc.offerNumber,
            issue_date: doc.issueDate,
            valid_until: doc.validUntil ?? undefined,
            subtotal: doc.subtotal ?? 0,
            total_vat: doc.totalVat ?? 0,
            total_gross: doc.totalGross ?? 0,
            status: doc.status || "draft",
            notes: doc.notes ?? undefined,
            purchase_order_ref: doc.purchaseOrderRef ?? undefined,
            payment_terms: doc.paymentTerms ?? undefined,
            converted_invoice_id: doc.convertedInvoiceId ?? null,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
            client,
            items: itemsRes.documents.map((item) => ({
                id: item.$id,
                offer_id: item.offerId,
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

        return NextResponse.json(offer);
    } catch (error) {
        console.error("Error fetching offer:", error);
        return NextResponse.json(
            { error: "Failed to fetch offer" },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
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
            COLLECTIONS.OFFERS,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await databases.updateDocument(DATABASE_ID, COLLECTIONS.OFFERS, id, {
            status: body.status,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error updating offer:", error);
        return NextResponse.json(
            { error: "Failed to update offer" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
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
            COLLECTIONS.OFFERS,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Cascade delete items
        const itemsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OFFER_ITEMS,
            [Query.equal("offerId", id), Query.limit(200)],
        );
        for (const item of itemsRes.documents) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.OFFER_ITEMS,
                item.$id,
            );
        }

        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.OFFERS, id);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting offer:", error);
        return NextResponse.json(
            { error: "Failed to delete offer" },
            { status: 500 },
        );
    }
}
