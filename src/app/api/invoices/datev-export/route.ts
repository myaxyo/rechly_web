import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";
import { generateDATEVCSV } from "@/lib/datevExport";

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

        const { startDate, endDate, statuses, chartOfAccounts } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "startDate and endDate required" },
                { status: 400 },
            );
        }

        const filters: string[] = [
            Query.equal("userId", user.$id),
            Query.greaterThanEqual("issueDate", startDate),
            Query.lessThanEqual("issueDate", endDate),
            Query.limit(1000),
        ];

        if (statuses && statuses.length > 0) {
            filters.push(Query.equal("status", statuses));
        }

        const [invoicesRes, clientsRes, companyRes] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, filters),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENTS, [
                Query.equal("userId", user.$id),
                Query.limit(1000),
            ]),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.COMPANY_INFO, [
                Query.equal("userId", user.$id),
                Query.limit(1),
            ]),
        ]);

        const clientsMap = new Map(
            clientsRes.documents.map((c) => [
                c.$id,
                {
                    id: c.$id,
                    name: c.name,
                    address_line1: c.addressLine1 || "",
                    address_line2: c.addressLine2 ?? undefined,
                    postal_code: c.postalCode || "",
                    city: c.city || "",
                    country: c.country || "DE",
                    email: c.email ?? undefined,
                    phone: c.phone ?? undefined,
                    vat_id: c.vatId ?? undefined,
                    tax_number: c.taxNumber ?? undefined,
                    leitweg_id: c.leitwegId ?? undefined,
                    created_at: 0,
                    updated_at: 0,
                },
            ]),
        );

        const companyDoc = companyRes.documents[0];

        const invoices = invoicesRes.documents.map((doc) => ({
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
            created_at: 0,
            updated_at: 0,
            client: clientsMap.get(doc.clientId),
        }));

        const csv = generateDATEVCSV(invoices, {
            chartOfAccounts:
                chartOfAccounts || companyDoc?.datevChartOfAccounts || "SKR03",
            consultantNumber: companyDoc?.datevConsultantNumber || undefined,
            clientNumber: companyDoc?.datevClientNumber || undefined,
            startDate,
            endDate,
        });

        const filename = `datev-buchungsstapel-${startDate}-${endDate}.csv`;

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("DATEV export error:", error);
        return NextResponse.json(
            { error: "Failed to generate DATEV export" },
            { status: 500 },
        );
    }
}
