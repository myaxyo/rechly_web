import { Query } from "appwrite";
import {
    databases,
    DATABASE_ID,
    COLLECTIONS,
    generateId,
    getCurrentUserId,
    getUserPermissions,
} from "./appwrite";
import type { Client, ClientFormData } from "@/types";

/**
 * Client Service - CRUD operations for Appwrite
 * Uses camelCase field names to match Appwrite schema
 * Filters by userId for data isolation between users
 */

/**
 * Map Appwrite documents to Client type
 */
const mapDocumentsToClients = (
    documents: Array<Record<string, unknown>>
): Client[] => {
    return documents.map((doc) => ({
        id: doc.$id as string,
        name: doc.name as string,
        contact_person: (doc.contactPerson as string | null) ?? undefined,
        address_line1: doc.addressLine1 as string,
        address_line2: (doc.addressLine2 as string | null) ?? undefined,
        postal_code: doc.postalCode as string,
        city: doc.city as string,
        country: (doc.country as string) || "Deutschland",
        email: (doc.email as string | null) ?? undefined,
        phone: (doc.phone as string | null) ?? undefined,
        vat_id: (doc.vatId as string | null) ?? undefined,
        tax_number: (doc.taxNumber as string | null) ?? undefined,
        leitweg_id: (doc.leitwegId as string | null) ?? undefined,
        created_at: new Date(doc.$createdAt as string).getTime(),
        updated_at: new Date(doc.$updatedAt as string).getTime(),
    }));
};

/**
 * Get all clients for the current user
 * Filters by userId attribute in Appwrite schema
 */
export const getAllClients = async (): Promise<Client[]> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.log("No user logged in, returning empty clients");
            return [];
        }

        // Query with userId filter for data isolation
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            [
                Query.equal("userId", userId),
                Query.orderDesc("$createdAt"),
                Query.limit(1000),
            ]
        );
        return mapDocumentsToClients(response.documents);
    } catch (error) {
        console.error("Error fetching clients:", error);
        throw error;
    }
};

/**
 * Get client by ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
    try {
        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            id
        );

        return {
            id: doc.$id,
            name: doc.name,
            contact_person: doc.contactPerson,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country || "Deutschland",
            email: doc.email,
            phone: doc.phone,
            vat_id: doc.vatId,
            tax_number: doc.taxNumber,
            leitweg_id: doc.leitwegId,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
    } catch (error) {
        console.error("Error fetching client:", error);
        return null;
    }
};

/**
 * Create new client with user-specific permissions
 */
export const createClient = async (data: ClientFormData): Promise<Client> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("Must be logged in to create clients");
        }

        const clientId = generateId();

        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            clientId,
            {
                userId: userId,
                name: data.name,
                contactPerson: data.contact_person || null,
                addressLine1: data.address_line1,
                addressLine2: data.address_line2 || null,
                postalCode: data.postal_code,
                city: data.city,
                country: data.country || "Deutschland",
                email: data.email || null,
                phone: data.phone || null,
                vatId: data.vat_id || null,
                taxNumber: data.tax_number || null,
                leitwegId: data.leitweg_id || null,
                registrationDate: new Date().toISOString(),
                status: "active",
            },
            getUserPermissions(userId)
        );

        return {
            id: doc.$id,
            name: doc.name,
            contact_person: doc.contactPerson,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country,
            email: doc.email,
            phone: doc.phone,
            vat_id: doc.vatId,
            tax_number: doc.taxNumber,
            leitweg_id: doc.leitwegId,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
};

/**
 * Update existing client
 */
export const updateClient = async (
    id: string,
    data: Partial<ClientFormData>
): Promise<Client> => {
    try {
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.contact_person !== undefined)
            updateData.contactPerson = data.contact_person || null;
        if (data.address_line1 !== undefined)
            updateData.addressLine1 = data.address_line1;
        if (data.address_line2 !== undefined)
            updateData.addressLine2 = data.address_line2 || null;
        if (data.postal_code !== undefined)
            updateData.postalCode = data.postal_code;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.country !== undefined) updateData.country = data.country;
        if (data.email !== undefined) updateData.email = data.email || null;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.vat_id !== undefined) updateData.vatId = data.vat_id || null;
        if (data.tax_number !== undefined)
            updateData.taxNumber = data.tax_number || null;
        if (data.leitweg_id !== undefined)
            updateData.leitwegId = data.leitweg_id || null;

        const doc = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTS,
            id,
            updateData
        );

        return {
            id: doc.$id,
            name: doc.name,
            contact_person: doc.contactPerson,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country,
            email: doc.email,
            phone: doc.phone,
            vat_id: doc.vatId,
            tax_number: doc.taxNumber,
            leitweg_id: doc.leitwegId,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
    } catch (error) {
        console.error("Error updating client:", error);
        throw error;
    }
};

/**
 * Delete client
 */
export const deleteClient = async (id: string): Promise<void> => {
    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CLIENTS, id);
    } catch (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
};
