import { create } from "zustand";
import type {
    InvoiceWithClient,
    InvoiceWithDetails,
    InvoiceFormData,
} from "@/types";
import {
    getAllInvoices as fetchAllInvoices,
    getInvoiceById as fetchInvoiceById,
    createInvoice as apiCreateInvoice,
    updateInvoiceStatus as apiUpdateInvoiceStatus,
    deleteInvoice as apiDeleteInvoice,
    getInvoiceStats as fetchInvoiceStats,
    type InvoiceStats,
} from "@/lib/invoiceService";

interface InvoiceStore {
    invoices: InvoiceWithClient[];
    stats: InvoiceStats | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchInvoices: (force?: boolean) => Promise<void>;
    fetchStats: (force?: boolean) => Promise<void>;
    getInvoice: (id: string) => Promise<InvoiceWithDetails | null>;
    addInvoice: (data: InvoiceFormData) => Promise<string>;
    updateStatus: (id: string, status: string) => Promise<void>;
    removeInvoice: (id: string) => Promise<void>;
    clearCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
    invoices: [],
    stats: null,
    loading: false,
    error: null,
    lastFetched: null,

    fetchInvoices: async (force = false) => {
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
            const invoices = await fetchAllInvoices();
            set({ invoices, loading: false, lastFetched: Date.now() });
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch invoices",
                loading: false,
            });
        }
    },

    fetchStats: async (force = false) => {
        const { stats, lastFetched } = get();

        // Skip if cache is still valid (unless forced)
        if (
            !force &&
            stats &&
            lastFetched &&
            Date.now() - lastFetched < CACHE_DURATION
        ) {
            return;
        }

        try {
            const newStats = await fetchInvoiceStats();
            set({ stats: newStats });
        } catch (error) {
            console.error("Failed to fetch invoice stats:", error);
        }
    },

    getInvoice: async (id: string) => {
        // Always fetch fresh details since it includes items
        return await fetchInvoiceById(id);
    },

    addInvoice: async (data: InvoiceFormData) => {
        const invoiceId = await apiCreateInvoice(data);
        // Invalidate cache to refetch with new invoice
        set({ lastFetched: null, stats: null });
        return invoiceId;
    },

    updateStatus: async (id: string, status: string) => {
        await apiUpdateInvoiceStatus(id, status);
        set((state) => ({
            invoices: state.invoices.map((inv) =>
                inv.id === id
                    ? {
                          ...inv,
                          status: status as
                              | "draft"
                              | "sent"
                              | "paid"
                              | "cancelled",
                      }
                    : inv
            ),
            stats: null, // Invalidate stats cache
        }));
    },

    removeInvoice: async (id: string) => {
        await apiDeleteInvoice(id);
        set((state) => ({
            invoices: state.invoices.filter((inv) => inv.id !== id),
            stats: null, // Invalidate stats cache
        }));
    },

    clearCache: () => {
        set({ invoices: [], stats: null, lastFetched: null });
    },
}));
