import { NextRequest, NextResponse } from "next/server";
import { Query, ID, Permission, Role } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

/**
 * Mahnwesen: dunning notices for one invoice.
 * Level 1 = Zahlungserinnerung, 2 = 1. Mahnung, 3 = 2. Mahnung.
 */

const mapNotice = (doc: Record<string, unknown> & { $id: string; $createdAt: string; $updatedAt: string }) => ({
    id: doc.$id,
    invoice_id: doc.invoiceId,
    level: doc.level,
    notice_number: doc.noticeNumber,
    issue_date: doc.issueDate,
    fee: doc.fee ?? 0,
    days_overdue: doc.daysOverdue ?? 0,
    notes: doc.notes ?? undefined,
    created_at: new Date(doc.$createdAt).getTime(),
    updated_at: new Date(doc.$updatedAt).getTime(),
});

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        let account;
        try {
            ({ account } = await createSessionClient());
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }
        const user = await account.get();
        const { databases } = await createAdminClient();

        const res = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.DUNNING_NOTICES,
            [
                Query.equal("userId", user.$id),
                Query.equal("invoiceId", id),
                Query.orderAsc("level"),
            ]
        );
        return NextResponse.json(res.documents.map(mapNotice));
    } catch (error) {
        console.error("Error listing dunning notices:", error);
        return NextResponse.json(
            { error: "Failed to list dunning notices" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        let account;
        try {
            ({ account } = await createSessionClient());
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }
        const user = await account.get();
        const { databases } = await createAdminClient();
        const body = await request.json();

        // Verify the invoice belongs to this user and is overdue-able
        const invoice = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            id
        );
        if (invoice.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Next level = existing max + 1 (capped at 3), unless given
        const existing = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.DUNNING_NOTICES,
            [
                Query.equal("userId", user.$id),
                Query.equal("invoiceId", id),
                Query.orderDesc("level"),
                Query.limit(1),
            ]
        );
        const maxLevel = existing.documents[0]?.level ?? 0;
        const level = Math.min(3, Number(body.level) || maxLevel + 1);
        if (level <= maxLevel) {
            return NextResponse.json(
                { error: "level_already_exists" },
                { status: 409 }
            );
        }

        // Sequential MA-YYYY-NNN per user
        const year = new Date().getFullYear();
        const lastNumber = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.DUNNING_NOTICES,
            [
                Query.equal("userId", user.$id),
                Query.startsWith("noticeNumber", `MA-${year}-`),
                Query.orderDesc("$createdAt"),
                Query.limit(1),
            ]
        );
        let next = 1;
        const lastValue = lastNumber.documents[0]?.noticeNumber as
            | string
            | undefined;
        if (lastValue) {
            const match = lastValue.match(/(\d+)$/);
            if (match) next = parseInt(match[1], 10) + 1;
        }
        const noticeNumber = `MA-${year}-${String(next).padStart(3, "0")}`;

        const today = new Date().toISOString().slice(0, 10);
        const daysOverdue = invoice.dueDate
            ? Math.max(
                  0,
                  Math.round(
                      (new Date(today).getTime() -
                          new Date(invoice.dueDate).getTime()) /
                          86_400_000
                  )
              )
            : 0;

        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.DUNNING_NOTICES,
            ID.unique(),
            {
                userId: user.$id,
                invoiceId: id,
                level,
                noticeNumber,
                issueDate: today,
                fee: Number(body.fee) || 0,
                daysOverdue,
                notes: body.notes || null,
            },
            [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]
        );

        return NextResponse.json(mapNotice(doc as never));
    } catch (error) {
        console.error("Error creating dunning notice:", error);
        return NextResponse.json(
            { error: "Failed to create dunning notice" },
            { status: 500 }
        );
    }
}
