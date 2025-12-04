import type { Product, ProductFormData } from "@/types";

/**
 * Product Service - CRUD operations via API routes
 * All Appwrite calls are proxied through server-side API routes
 * to work with SSR authentication
 */

/**
 * Get all products for the current user
 */
export const getAllProducts = async (): Promise<Product[]> => {
    try {
        const res = await fetch("/api/products");
        if (!res.ok) {
            if (res.status === 401) {
                console.log("Not authenticated, returning empty products");
                return [];
            }
            throw new Error("Failed to fetch products");
        }
        return res.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

/**
 * Get product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (res.status === 404) return null;
        if (!res.ok) {
            throw new Error("Failed to fetch product");
        }
        return res.json();
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
};

/**
 * Create new product
 */
export const createProduct = async (
    data: ProductFormData
): Promise<Product> => {
    try {
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
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

/**
 * Update existing product
 */
export const updateProduct = async (
    id: string,
    data: Partial<ProductFormData>
): Promise<Product> => {
    try {
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
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (id: string): Promise<void> => {
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to delete product");
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};
