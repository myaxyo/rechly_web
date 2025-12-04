import { create } from "zustand";
import type { Product, ProductFormData } from "@/types";

interface ProductStore {
    products: Product[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchProducts: (force?: boolean) => Promise<void>;
    getProduct: (id: string) => Promise<Product | null>;
    addProduct: (data: ProductFormData) => Promise<Product>;
    editProduct: (
        id: string,
        data: Partial<ProductFormData>
    ) => Promise<Product>;
    removeProduct: (id: string) => Promise<void>;
    clearCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API helper functions that use server-side routes
const apiGetProducts = async (): Promise<Product[]> => {
    const res = await fetch("/api/products");
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch products");
    }
    return res.json();
};

const apiGetProduct = async (id: string): Promise<Product | null> => {
    const res = await fetch(`/api/products/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch product");
    }
    return res.json();
};

const apiCreateProduct = async (data: ProductFormData): Promise<Product> => {
    const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create product");
    }
    return res.json();
};

const apiUpdateProduct = async (
    id: string,
    data: Partial<ProductFormData>
): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product");
    }
    return res.json();
};

const apiDeleteProduct = async (id: string): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete product");
    }
};

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchProducts: async (force = false) => {
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
            const products = await apiGetProducts();
            set({ products, loading: false, lastFetched: Date.now() });
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch products",
                loading: false,
            });
        }
    },

    getProduct: async (id: string) => {
        const { products } = get();
        // Try to find in cache first
        const cached = products.find((p) => p.id === id);
        if (cached) return cached;

        // Fetch from API if not in cache
        return await apiGetProduct(id);
    },

    addProduct: async (data: ProductFormData) => {
        const newProduct = await apiCreateProduct(data);
        set((state) => ({
            products: [...state.products, newProduct],
        }));
        return newProduct;
    },

    editProduct: async (id: string, data: Partial<ProductFormData>) => {
        const updatedProduct = await apiUpdateProduct(id, data);
        set((state) => ({
            products: state.products.map((p) =>
                p.id === id ? updatedProduct : p
            ),
        }));
        return updatedProduct;
    },

    removeProduct: async (id: string) => {
        await apiDeleteProduct(id);
        set((state) => ({
            products: state.products.filter((p) => p.id !== id),
        }));
    },

    clearCache: () => {
        set({ products: [], lastFetched: null });
    },
}));
