import type { Expense, ExpenseFormData, ExpenseOCRResult } from "@/types";

export async function getAllExpenses(): Promise<Expense[]> {
    const res = await fetch("/api/expenses");
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return res.json();
}

export async function getExpenseById(id: string): Promise<Expense | null> {
    const res = await fetch(`/api/expenses/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch expense");
    return res.json();
}

export async function createExpense(data: ExpenseFormData): Promise<string> {
    const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create expense");
    const json = await res.json();
    return json.id;
}

export async function updateExpense(
    id: string,
    data: Partial<ExpenseFormData>,
): Promise<void> {
    const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update expense");
}

export async function deleteExpense(id: string): Promise<void> {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete expense");
}

export async function ocrExpenseReceipt(
    imageBase64: string,
    mimeType: string,
): Promise<ExpenseOCRResult> {
    const res = await fetch("/api/expenses/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
    });
    if (!res.ok) throw new Error("OCR failed");
    return res.json();
}

export async function uploadExpenseReceipt(
    expenseId: string,
    file: File,
): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/expenses/${expenseId}/receipt`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload receipt");
    const json = await res.json();
    return json.fileId;
}
