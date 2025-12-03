import { create } from "zustand";
import type { Client } from "@/types";
import {
    getAllClients as fetchAllClients,
    getClientById as fetchClientById,
    createClient as apiCreateClient,
    updateClient as apiUpdateClient,
    deleteClient as apiDeleteClient,
} from "@/lib/clientService";
import type { ClientFormData } from "@/types";

interface ClientStore {
    clients: Client[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchClients: (force?: boolean) => Promise<void>;
    getClient: (id: string) => Promise<Client | null>;
    addClient: (data: ClientFormData) => Promise<Client>;
    editClient: (id: string, data: Partial<ClientFormData>) => Promise<Client>;
    removeClient: (id: string) => Promise<void>;
    clearCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useClientStore = create<ClientStore>((set, get) => ({
    clients: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchClients: async (force = false) => {
        const { lastFetched, loading } = get();

        // Skip if already loading
        if (loading) return;

        // Skip if cache is still valid (unless forced)
        if (
            !force &&
            lastFetched &&
            Date.now() - lastFetched < CACHE_DURATION
        ) {
            return;
        }

        set({ loading: true, error: null });
        try {
            const clients = await fetchAllClients();
            set({ clients, loading: false, lastFetched: Date.now() });
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch clients",
                loading: false,
            });
        }
    },

    getClient: async (id: string) => {
        const { clients } = get();
        // Try to find in cache first
        const cached = clients.find((c) => c.id === id);
        if (cached) return cached;

        // Fetch from API if not in cache
        return await fetchClientById(id);
    },

    addClient: async (data: ClientFormData) => {
        const newClient = await apiCreateClient(data);
        set((state) => ({
            clients: [...state.clients, newClient],
        }));
        return newClient;
    },

    editClient: async (id: string, data: Partial<ClientFormData>) => {
        const updatedClient = await apiUpdateClient(id, data);
        set((state) => ({
            clients: state.clients.map((c) =>
                c.id === id ? updatedClient : c
            ),
        }));
        return updatedClient;
    },

    removeClient: async (id: string) => {
        await apiDeleteClient(id);
        set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
        }));
    },

    clearCache: () => {
        set({ clients: [], lastFetched: null });
    },
}));
