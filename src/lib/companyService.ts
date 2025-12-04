import type { UserCompany } from "@/types";

/**
 * Company Service - CRUD operations via API routes
 * All Appwrite calls are proxied through server-side API routes
 * to work with SSR authentication
 */

/**
 * Get company info for current user
 */
export const getCompanyInfo = async (): Promise<UserCompany | null> => {
    try {
        const res = await fetch("/api/company");
        if (!res.ok) {
            if (res.status === 401) {
                console.log("Not authenticated, returning null company info");
                return null;
            }
            throw new Error("Failed to fetch company info");
        }
        return res.json();
    } catch (error) {
        console.error("Error fetching company info:", error);
        return null;
    }
};

/**
 * Save company info (upsert - create or update)
 */
export const saveCompanyInfo = async (
    data: Omit<UserCompany, "id" | "created_at" | "updated_at">
): Promise<UserCompany> => {
    try {
        const res = await fetch("/api/company", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to save company info");
        }

        return res.json();
    } catch (error) {
        console.error("Error saving company info:", error);
        throw error;
    }
};
