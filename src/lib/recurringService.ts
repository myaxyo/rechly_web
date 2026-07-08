import type { RecurringFormData, RecurringInvoiceWithDetails } from "@/types";

export async function getAllRecurring(): Promise<
    RecurringInvoiceWithDetails[]
> {
    const res = await fetch("/api/recurring");
    if (!res.ok) throw new Error("Failed to fetch recurring invoices");
    return res.json();
}

export async function getRecurringById(
    id: string,
): Promise<RecurringInvoiceWithDetails | null> {
    const res = await fetch(`/api/recurring/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch recurring invoice");
    return res.json();
}

export async function createRecurring(
    data: RecurringFormData,
): Promise<string> {
    const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create recurring invoice");
    const json = await res.json();
    return json.id;
}

export async function updateRecurring(
    id: string,
    updates: Partial<{ is_active: boolean; notes: string }>,
): Promise<void> {
    const res = await fetch(`/api/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update recurring invoice");
}

export async function deleteRecurring(id: string): Promise<void> {
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete recurring invoice");
}

export async function generateNextInvoice(id: string): Promise<string> {
    const res = await fetch(`/api/recurring/${id}/generate`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to generate invoice");
    const json = await res.json();
    return json.invoiceId;
}

export async function toggleRecurringActive(
    id: string,
    isActive: boolean,
): Promise<void> {
    const res = await fetch(`/api/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Failed to toggle recurring invoice");
}
