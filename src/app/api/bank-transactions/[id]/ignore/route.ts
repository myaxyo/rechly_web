import { NextRequest, NextResponse } from "next/server";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

export async function POST(
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

        const tx = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.BANK_TRANSACTIONS,
            id,
        );
        if (tx.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.BANK_TRANSACTIONS,
            id,
            {
                status: "ignored",
            },
        );

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to ignore transaction" },
            { status: 500 },
        );
    }
}
