import { NextRequest, NextResponse } from "next/server";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

export async function POST(
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
        const { invoiceId } = body;

        if (!invoiceId) {
            return NextResponse.json(
                { error: "invoiceId required" },
                { status: 400 },
            );
        }

        const tx = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.BANK_TRANSACTIONS,
            id,
        );
        if (tx.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Verify invoice belongs to user
        const invoice = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            invoiceId,
        );
        if (invoice.userId !== user.$id) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 },
            );
        }

        // Update transaction as matched
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.BANK_TRANSACTIONS,
            id,
            {
                status: "matched",
                matchedInvoiceId: invoiceId,
            },
        );

        // Mark invoice as paid
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            invoiceId,
            {
                status: "paid",
            },
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Match error:", error);
        return NextResponse.json(
            { error: "Failed to match transaction" },
            { status: 500 },
        );
    }
}
