import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createSessionClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

// GET company info
export async function GET() {
    try {
        const { account, databases } = await createSessionClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get company info for this user
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.COMPANY_INFO,
            [Query.equal("userId", user.$id), Query.limit(1)]
        );

        if (response.documents.length === 0) {
            return NextResponse.json(null);
        }

        const doc = response.documents[0];
        const company = {
            id: doc.$id,
            name: doc.name,
            legal_form: doc.legalForm ?? undefined,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2 ?? undefined,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country || "Deutschland",
            email: doc.email,
            phone: doc.phone ?? undefined,
            website: doc.website ?? undefined,
            vat_id: doc.vatId ?? undefined,
            tax_number: doc.taxNumber ?? undefined,
            commercial_register_number:
                doc.commercialRegisterNumber ?? undefined,
            registry_court: doc.registryCourt ?? undefined,
            managing_directors: doc.managingDirectors ?? undefined,
            bank_name: doc.bankName ?? undefined,
            bank_iban: doc.bankIban,
            bank_bic: doc.bankBic ?? undefined,
            logo_base64: doc.logoBase64 ?? undefined,
            payment_terms_default: doc.paymentTermsDefault,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };

        return NextResponse.json(company);
    } catch (error) {
        console.error("Error fetching company:", error);
        return NextResponse.json(
            { error: "Failed to fetch company" },
            { status: 500 }
        );
    }
}

// POST create or update company info
export async function POST(request: NextRequest) {
    try {
        const { account, databases } = await createSessionClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ID } = await import("node-appwrite");

        // Check if company already exists
        const existing = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.COMPANY_INFO,
            [Query.equal("userId", user.$id), Query.limit(1)]
        );

        const data = {
            userId: user.$id,
            name: body.name,
            legalForm: body.legal_form || null,
            addressLine1: body.address_line1,
            addressLine2: body.address_line2 || null,
            postalCode: body.postal_code,
            city: body.city,
            country: body.country || "Deutschland",
            email: body.email,
            phone: body.phone || null,
            website: body.website || null,
            vatId: body.vat_id || null,
            taxNumber: body.tax_number || null,
            commercialRegisterNumber: body.commercial_register_number || null,
            registryCourt: body.registry_court || null,
            managingDirectors: body.managing_directors || null,
            bankName: body.bank_name || null,
            bankIban: body.bank_iban,
            bankBic: body.bank_bic || null,
            logoBase64: body.logo_base64 || null,
            paymentTermsDefault: body.payment_terms_default,
        };

        let doc;
        if (existing.documents.length > 0) {
            // Update existing
            doc = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.COMPANY_INFO,
                existing.documents[0].$id,
                data
            );
        } else {
            // Create new
            doc = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.COMPANY_INFO,
                ID.unique(),
                data
            );
        }

        const company = {
            id: doc.$id,
            name: doc.name,
            legal_form: doc.legalForm ?? undefined,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2 ?? undefined,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country || "Deutschland",
            email: doc.email,
            phone: doc.phone ?? undefined,
            website: doc.website ?? undefined,
            vat_id: doc.vatId ?? undefined,
            tax_number: doc.taxNumber ?? undefined,
            commercial_register_number:
                doc.commercialRegisterNumber ?? undefined,
            registry_court: doc.registryCourt ?? undefined,
            managing_directors: doc.managingDirectors ?? undefined,
            bank_name: doc.bankName ?? undefined,
            bank_iban: doc.bankIban,
            bank_bic: doc.bankBic ?? undefined,
            logo_base64: doc.logoBase64 ?? undefined,
            payment_terms_default: doc.paymentTermsDefault,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };

        return NextResponse.json(company);
    } catch (error) {
        console.error("Error saving company:", error);
        return NextResponse.json(
            { error: "Failed to save company" },
            { status: 500 }
        );
    }
}
