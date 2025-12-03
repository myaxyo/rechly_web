import { Query } from "appwrite";
import {
    databases,
    DATABASE_ID,
    COLLECTIONS,
    generateId,
    getCurrentUserId,
    getUserPermissions,
} from "./appwrite";
import type { Product, ProductFormData } from "@/types";

/**
 * Product Service - CRUD operations for Appwrite
 * Uses camelCase field names to match Appwrite schema
 * Filters by userId for data isolation between users
 */

/**
 * Get all products for the current user
 * Filters by userId attribute in Appwrite schema
 */
export const getAllProducts = async (): Promise<Product[]> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.log("No user logged in, returning empty products");
            return [];
        }

        // Query with userId filter for data isolation
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            [
                Query.equal("userId", userId),
                Query.orderDesc("$createdAt"),
                Query.limit(1000),
            ]
        );
        return mapDocumentsToProducts(response.documents);
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

/**
 * Map Appwrite documents to Product type
 */
const mapDocumentsToProducts = (
    documents: Array<Record<string, unknown>>
): Product[] => {
    return documents.map((doc) => ({
        id: doc.$id as string,
        name: doc.name as string,
        description: (doc.description as string | null) ?? undefined,
        price: doc.price as number,
        tax_rate_percent: (doc.taxRatePercent as number) ?? 19,
        unit_of_measure: (doc.unitOfMeasure as string) || "Stück",
        created_at: new Date(doc.$createdAt as string).getTime(),
        updated_at: new Date(doc.$updatedAt as string).getTime(),
    }));
};

/**
 * Get product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            id
        );

        return {
            id: doc.$id,
            name: doc.name,
            description: doc.description,
            price: doc.price,
            tax_rate_percent: doc.taxRatePercent ?? 19,
            unit_of_measure: doc.unitOfMeasure || "Stück",
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
};

/**
 * Create new product with user-specific permissions
 */
export const createProduct = async (
    data: ProductFormData
): Promise<Product> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("Must be logged in to create products");
        }

        const productId = generateId();

        // Prepare document data with userId for Appwrite schema
        const docData: Record<string, unknown> = {
            userId: userId,
            name: data.name,
            description: data.description || null,
            price: data.price,
            taxRatePercent: data.tax_rate_percent,
            unitOfMeasure: data.unit_of_measure,
        };

        // Create with user-specific permissions for Document Security
        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            productId,
            docData,
            getUserPermissions(userId)
        );

        return {
            id: doc.$id,
            name: doc.name,
            description: doc.description,
            price: doc.price,
            tax_rate_percent: doc.taxRatePercent,
            unit_of_measure: doc.unitOfMeasure,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
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
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description || null;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.tax_rate_percent !== undefined)
            updateData.taxRatePercent = data.tax_rate_percent;
        if (data.unit_of_measure !== undefined)
            updateData.unitOfMeasure = data.unit_of_measure;

        const doc = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            id,
            updateData
        );

        return {
            id: doc.$id,
            name: doc.name,
            description: doc.description,
            price: doc.price,
            tax_rate_percent: doc.taxRatePercent,
            unit_of_measure: doc.unitOfMeasure,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
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
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};
