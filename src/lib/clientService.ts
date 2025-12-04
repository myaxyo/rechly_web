import type { Client, ClientFormData } from "@/types";

/**
 * Client Service - CRUD operations via API routes
 * All Appwrite calls are proxied through server-side API routes
 * to work with SSR authentication
 */

/**
 * Get all clients for the current user
 */
export const getAllClients = async (): Promise<Client[]> => {
    try {
        const res = await fetch("/api/clients");
        if (!res.ok) {
            if (res.status === 401) {
                console.log("Not authenticated, returning empty clients");
                return [];
            }
            throw new Error("Failed to fetch clients");
        }
        return res.json();
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
        const res = await fetch(`/api/clients/${id}`);
        if (res.status === 404) return null;
        if (!res.ok) {
            throw new Error("Failed to fetch client");
        }
        return res.json();
    } catch (error) {
        console.error("Error fetching client:", error);
        return null;
    }
};

/**
 * Create new client
 */
export const createClient = async (data: ClientFormData): Promise<Client> => {
    try {
        const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to create client");
        }

        return res.json();
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
        const res = await fetch(`/api/clients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to update client");
        }

        return res.json();
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
        const res = await fetch(`/api/clients/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to delete client");
        }
    } catch (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
};
