import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";
import {
    computeUstva,
    computeEuer,
    periodFor,
    type RevenueLineInput,
    type ExpenseInput,
} from "@/lib/taxReports";

/**
 * UStVA + EÜR figures for the authenticated user.
 * Query params: year (default current), part (1–12 or Q1–Q4, default
 * current quarter).
 */
export async function GET(request: NextRequest) {
    try {
        let account;
        try {
            const sessionClient = await createSessionClient();
            account = sessionClient.account;
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { databases } = await createAdminClient();
        const user = await account.get();

        const params = request.nextUrl.searchParams;
        const year =
            Number(params.get("year")) || new Date().getFullYear();
        const rawPart = params.get("part") || `Q${Math.floor(new Date().getMonth() / 3) + 1}`;
        const part: number | "Q1" | "Q2" | "Q3" | "Q4" = /^Q[1-4]$/.test(
            rawPart
        )
            ? (rawPart as "Q1" | "Q2" | "Q3" | "Q4")
            : Math.min(12, Math.max(1, Number(rawPart) || 1));

        // Invoices of this user → id lookup for their items
        const invoicesRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.INVOICES,
            [Query.equal("userId", user.$id), Query.limit(1000)]
        );
        const invoiceMeta = new Map(
            invoicesRes.documents.map((doc) => [
                doc.$id,
                { issue_date: doc.issueDate, status: doc.status },
            ])
        );

        // Items fetched in invoice-id chunks (Query.equal supports arrays)
        const lines: RevenueLineInput[] = [];
        const ids = [...invoiceMeta.keys()];
        for (let i = 0; i < ids.length; i += 100) {
            const chunk = ids.slice(i, i + 100);
            const itemsRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.INVOICE_ITEMS,
                [Query.equal("invoiceId", chunk), Query.limit(5000)]
            );
            for (const item of itemsRes.documents) {
                const meta = invoiceMeta.get(item.invoiceId);
                if (!meta) continue;
                lines.push({
                    issue_date: meta.issue_date,
                    status: meta.status,
                    tax_rate_percent: item.taxRatePercent ?? 19,
                    net: item.subtotal ?? 0,
                    tax: item.taxAmount ?? 0,
                });
            }
        }

        const expensesRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
            [Query.equal("userId", user.$id), Query.limit(2000)]
        );
        const expenses: ExpenseInput[] = expensesRes.documents.map((doc) => ({
            date: doc.date,
            vat_rate_percent: doc.vatRatePercent ?? 0,
            amount_net: doc.amountNet ?? 0,
            vat_amount: doc.vatAmount ?? 0,
            amount_gross: doc.amountGross ?? 0,
            category: doc.category || "other",
        }));

        return NextResponse.json({
            ustva: computeUstva(lines, expenses, periodFor(year, part)),
            euer: computeEuer(lines, expenses, year),
        });
    } catch (error) {
        console.error("Error computing tax reports:", error);
        return NextResponse.json(
            { error: "Failed to compute tax reports" },
            { status: 500 }
        );
    }
}
