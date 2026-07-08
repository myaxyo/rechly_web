import { NextRequest, NextResponse } from "next/server";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
    STORAGE,
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
            COLLECTIONS.EXPENSES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: doc.$id,
            date: doc.date,
            vendor_name: doc.vendorName,
            description: doc.description ?? undefined,
            amount_net: doc.amountNet ?? 0,
            vat_amount: doc.vatAmount ?? 0,
            amount_gross: doc.amountGross ?? 0,
            vat_rate_percent: doc.vatRatePercent ?? 19,
            category: doc.category || "other",
            payment_method: doc.paymentMethod || "bank_transfer",
            receipt_file_id: doc.receiptFileId ?? undefined,
            status: doc.status || "pending",
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        });
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
            COLLECTIONS.EXPENSES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updates: Record<string, unknown> = {};
        if (body.date !== undefined) updates.date = body.date;
        if (body.vendor_name !== undefined)
            updates.vendorName = body.vendor_name;
        if (body.description !== undefined)
            updates.description = body.description;
        if (body.amount_net !== undefined)
            updates.amountNet = Number(body.amount_net);
        if (body.vat_amount !== undefined)
            updates.vatAmount = Number(body.vat_amount);
        if (body.amount_gross !== undefined)
            updates.amountGross = Number(body.amount_gross);
        if (body.vat_rate_percent !== undefined)
            updates.vatRatePercent = Number(body.vat_rate_percent);
        if (body.category !== undefined) updates.category = body.category;
        if (body.payment_method !== undefined)
            updates.paymentMethod = body.payment_method;
        if (body.receipt_file_id !== undefined)
            updates.receiptFileId = body.receipt_file_id;
        if (body.status !== undefined) updates.status = body.status;

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
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

        const { databases, storage } = await createAdminClient();
        const user = await account.get();

        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Delete receipt from storage if present
        if (doc.receiptFileId) {
            try {
                await storage.deleteFile(STORAGE.RECEIPTS, doc.receiptFileId);
            } catch {
                // File may already be deleted
            }
        }

        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EXPENSES, id);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to delete" },
            { status: 500 },
        );
    }
}
