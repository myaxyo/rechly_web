import { NextRequest, NextResponse } from "next/server";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

// GET single client
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
                { status: 401 }
            );
        }

        const { databases } = await createAdminClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            id
        );

        const client = {
            id: doc.$id,
            name: doc.name,
            contact_person: doc.contactPerson ?? undefined,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2 ?? undefined,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country || "Deutschland",
            email: doc.email ?? undefined,
            phone: doc.phone ?? undefined,
            vat_id: doc.vatId ?? undefined,
            tax_number: doc.taxNumber ?? undefined,
            leitweg_id: doc.leitwegId ?? undefined,
            registration_date: doc.registrationDate ?? undefined,
            status: doc.status || "active",
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };

        return NextResponse.json(client);
    } catch (error) {
        console.error("Error fetching client:", error);
        return NextResponse.json(
            { error: "Failed to fetch client" },
            { status: 500 }
        );
    }
}

// PUT update client
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
                { status: 401 }
            );
        }

        const { databases } = await createAdminClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Update document
        const doc = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            id,
            {
                name: body.name,
                contactPerson: body.contact_person || null,
                addressLine1: body.address_line1,
                addressLine2: body.address_line2 || null,
                postalCode: body.postal_code,
                city: body.city,
                country: body.country || "Deutschland",
                email: body.email || null,
                phone: body.phone || null,
                vatId: body.vat_id || null,
                taxNumber: body.tax_number || null,
                leitwegId: body.leitweg_id || null,
                registrationDate: body.registration_date || null,
                status: body.status || "active",
            }
        );

        const client = {
            id: doc.$id,
            name: doc.name,
            contact_person: doc.contactPerson ?? undefined,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2 ?? undefined,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country || "Deutschland",
            email: doc.email ?? undefined,
            phone: doc.phone ?? undefined,
            vat_id: doc.vatId ?? undefined,
            tax_number: doc.taxNumber ?? undefined,
            leitweg_id: doc.leitwegId ?? undefined,
            registration_date: doc.registrationDate ?? undefined,
            status: doc.status || "active",
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };

        return NextResponse.json(client);
    } catch (error) {
        console.error("Error updating client:", error);
        return NextResponse.json(
            { error: "Failed to update client" },
            { status: 500 }
        );
    }
}

// DELETE client
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
                { status: 401 }
            );
        }

        const { databases } = await createAdminClient();

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CLIENTS, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting client:", error);
        return NextResponse.json(
            { error: "Failed to delete client" },
            { status: 500 }
        );
    }
}
