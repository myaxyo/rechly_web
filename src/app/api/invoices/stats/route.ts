import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

// GET invoice stats
export async function GET() {
    try {
        const { account } = await createSessionClient();
        const { databases } = await createAdminClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get all invoices
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            [Query.equal("userId", user.$id), Query.limit(1000)]
        );

        const stats = {
            total: response.documents.length,
            draft: 0,
            sent: 0,
            paid: 0,
            cancelled: 0,
            paidAmount: 0,
            unpaidAmount: 0,
        };

        for (const doc of response.documents) {
            const totalGross = doc.totalGross ?? 0;

            switch (doc.status) {
                case "draft":
                    stats.draft++;
                    stats.unpaidAmount += totalGross;
                    break;
                case "sent":
                    stats.sent++;
                    stats.unpaidAmount += totalGross;
                    break;
                case "paid":
                    stats.paid++;
                    stats.paidAmount += totalGross;
                    break;
                case "cancelled":
                    stats.cancelled++;
                    break;
            }
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching invoice stats:", error);
        return NextResponse.json(
            {
                total: 0,
                draft: 0,
                sent: 0,
                paid: 0,
                cancelled: 0,
                paidAmount: 0,
                unpaidAmount: 0,
            },
            { status: 200 }
        );
    }
}
