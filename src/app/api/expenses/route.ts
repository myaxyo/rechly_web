import { NextRequest, NextResponse } from "next/server";
import { Query, ID, Permission, Role } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

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
        const user = await account.get();

        const res = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
            [
                Query.equal("userId", user.$id),
                Query.orderDesc("date"),
                Query.limit(1000),
            ],
        );

        const expenses = res.documents.map((doc) => ({
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
        }));

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { error: "Failed to fetch expenses" },
            { status: 500 },
        );
    }
}

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
        const user = await account.get();
        const body = await request.json();

        const amountNet = Number(body.amount_net) || 0;
        const vatRatePercent = Number(body.vat_rate_percent) ?? 19;
        const vatAmount =
            Number(body.vat_amount) ?? (amountNet * vatRatePercent) / 100;
        const amountGross = Number(body.amount_gross) ?? amountNet + vatAmount;

        const expenseId = ID.unique();
        const permissions = [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
        ];

        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
            expenseId,
            {
                userId: user.$id,
                date: body.date,
                vendorName: body.vendor_name,
                description: body.description || null,
                amountNet,
                vatAmount,
                amountGross,
                vatRatePercent,
                category: body.category || "other",
                paymentMethod: body.payment_method || "bank_transfer",
                receiptFileId: body.receipt_file_id || null,
                status: "pending",
            },
            permissions,
        );

        return NextResponse.json({ id: expenseId });
    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { error: "Failed to create expense" },
            { status: 500 },
        );
    }
}
