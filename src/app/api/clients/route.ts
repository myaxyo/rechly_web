import { NextRequest, NextResponse } from "next/server";
import { Query, Permission, Role } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
} from "@/lib/appwrite-server";

// GET all clients
export async function GET() {
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

        // Get current user
        const user = await account.get();
        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get clients filtered by userId
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
        );

        // Map documents to client format
        const clients = response.documents.map((doc) => ({
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
        }));

        return NextResponse.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        return NextResponse.json(
            { error: "Failed to fetch clients" },
            { status: 500 }
        );
    }
}

// POST create new client
export async function POST(request: NextRequest) {
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

        // Create document with userId and user permissions
        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            ID.unique(),
            {
                userId: user.$id,
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
                registrationDate:
                    body.registration_date ||
                    new Date().toISOString().split("T")[0],
                status: body.status || "active",
            },
            [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]
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
        console.error("Error creating client:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to create client", details: errorMessage },
            { status: 500 }
        );
    }
}
