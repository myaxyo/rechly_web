import type { BankTransaction } from "@/types";
import { ApiError, apiGet, apiPost } from "./apiClient";
import { logger } from "./logger";

export async function getAllBankTransactions(status?: string): Promise<BankTransaction[]> {
    const url = status ? `/api/bank-transactions?status=${status}` : "/api/bank-transactions";
    try {
        return await apiGet<BankTransaction[]>(url, "Failed to fetch bank transactions");
    } catch (error) {
        logger.error("Error fetching bank transactions:", error);
        throw error;
    }
}

export async function importBankTransactions(
    csvText: string,
    format: string,
    camtFile?: File,
): Promise<{ imported: number; duplicates: number; skippedPending?: number }> {
    try {
        if (format === "camt") {
            // Send the raw .xml/.zip as multipart FormData and let the
            // server inflate it: posting the decompressed XML as JSON
            // (up to ~25 MB) is rejected by common reverse-proxy body
            // limits with 413 before Next.js ever sees the request.
            if (!camtFile) throw new Error("CAMT file required");
            const formData = new FormData();
            formData.append("format", format);
            formData.append("file", camtFile);
            const res = await fetch("/api/bank-transactions/import", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                let message = "Failed to import bank transactions";
                try {
                    const data = await res.json();
                    if (typeof data?.error === "string" && data.error)
                        message = data.error;
                } catch {
                    // keep the fallback message
                }
                throw new ApiError(message, res.status);
            }
            return await res.json();
        }
        return await apiPost(
            "/api/bank-transactions/import",
            { csvText, format },
            "Failed to import bank transactions",
        );
    } catch (error) {
        logger.error("Error importing bank transactions:", error);
        throw error;
    }
}

export async function matchTransaction(
    transactionId: string,
    invoiceId: string,
): Promise<void> {
    try {
        await apiPost(
            `/api/bank-transactions/${transactionId}/match`,
            { invoiceId },
            "Failed to match transaction",
        );
    } catch (error) {
        logger.error("Error matching transaction:", error);
        throw error;
    }
}

export async function ignoreTransaction(transactionId: string): Promise<void> {
    try {
        await apiPost(
            `/api/bank-transactions/${transactionId}/ignore`,
            {},
            "Failed to ignore transaction",
        );
    } catch (error) {
        logger.error("Error ignoring transaction:", error);
        throw error;
    }
}
