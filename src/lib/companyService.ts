import { Query } from "appwrite";
import {
    databases,
    DATABASE_ID,
    COLLECTIONS,
    generateId,
    getCurrentUserId,
    getUserPermissions,
} from "./appwrite";
import type { UserCompany } from "@/types";

/**
 * Company Service - CRUD operations for Appwrite
 * Uses camelCase field names to match Appwrite schema
 * Filters by userId for data isolation between users
 */

/**
 * Get company info for current user
 */
export const getCompanyInfo = async (): Promise<UserCompany | null> => {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.log("No user logged in, returning null company info");
            return null;
        }

        // Try to filter by userId if the field exists in Appwrite schema
        let response;
        try {
            response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USER_COMPANY,
                [Query.equal("userId", userId), Query.limit(1)]
            );
        } catch (error: unknown) {
            // If userId attribute doesn't exist, fall back to no filter
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === 400
            ) {
                console.log(
                    "userId attribute not found in user_company schema, relying on document permissions"
                );
                response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.USER_COMPANY,
                    [Query.limit(1)]
                );
            } else {
                throw error;
            }
        }

        if (response.documents.length === 0) {
            return null;
        }

        const doc = response.documents[0];

        return {
            id: doc.$id,
            name: doc.name,
            legal_form: doc.legalForm,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country || "Deutschland",
            vat_id: doc.vatId,
            tax_number: doc.taxNumber,
            commercial_register_number: doc.commercialRegisterNumber,
            registry_court: doc.registryCourt,
            managing_directors: doc.managingDirectors,
            bank_name: doc.bankName,
            bank_iban: doc.bankIban,
            bank_bic: doc.bankBic,
            payment_terms_default:
                doc.paymentTermsDefault || "Zahlbar innerhalb 14 Tagen netto",
            email: doc.email,
            phone: doc.phone,
            website: doc.website,
            logo_base64: doc.logoBase64,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
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
        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("Must be logged in to save company info");
        }

        // Check if company info already exists
        const existing = await getCompanyInfo();

        const companyData = {
            name: data.name,
            legalForm: data.legal_form || null,
            addressLine1: data.address_line1,
            addressLine2: data.address_line2 || null,
            postalCode: data.postal_code,
            city: data.city,
            country: data.country || "Deutschland",
            vatId: data.vat_id || null,
            taxNumber: data.tax_number || null,
            commercialRegisterNumber: data.commercial_register_number || null,
            registryCourt: data.registry_court || null,
            managingDirectors: data.managing_directors || null,
            bankName: data.bank_name || null,
            bankIban: data.bank_iban,
            bankBic: data.bank_bic || null,
            paymentTermsDefault:
                data.payment_terms_default ||
                "Zahlbar innerhalb 14 Tagen netto",
            email: data.email,
            phone: data.phone || null,
            website: data.website || null,
            logoBase64: data.logo_base64 || null,
            userId: userId, // Include for filtering (if attribute exists)
        };

        let doc;

        if (existing && existing.id) {
            // Update existing
            doc = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USER_COMPANY,
                existing.id,
                companyData
            );
        } else {
            // Create new with user permissions
            doc = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USER_COMPANY,
                generateId(),
                companyData,
                getUserPermissions(userId)
            );
        }

        return {
            id: doc.$id,
            name: doc.name,
            legal_form: doc.legalForm,
            address_line1: doc.addressLine1,
            address_line2: doc.addressLine2,
            postal_code: doc.postalCode,
            city: doc.city,
            country: doc.country,
            vat_id: doc.vatId,
            tax_number: doc.taxNumber,
            commercial_register_number: doc.commercialRegisterNumber,
            registry_court: doc.registryCourt,
            managing_directors: doc.managingDirectors,
            bank_name: doc.bankName,
            bank_iban: doc.bankIban,
            bank_bic: doc.bankBic,
            payment_terms_default: doc.paymentTermsDefault,
            email: doc.email,
            phone: doc.phone,
            website: doc.website,
            logo_base64: doc.logoBase64,
            created_at: new Date(doc.$createdAt).getTime(),
            updated_at: new Date(doc.$updatedAt).getTime(),
        };
    } catch (error) {
        console.error("Error saving company info:", error);
        throw error;
    }
};
