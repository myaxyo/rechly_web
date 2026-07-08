import type {
    OfferFormData,
    OfferWithClient,
    OfferWithDetails,
    OfferStatus,
} from "@/types";

export async function getAllOffers(): Promise<OfferWithClient[]> {
    const res = await fetch("/api/offers");
    if (!res.ok) throw new Error("Failed to fetch offers");
    return res.json();
}

export async function getOfferById(
    id: string,
): Promise<OfferWithDetails | null> {
    const res = await fetch(`/api/offers/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch offer");
    return res.json();
}

export async function createOffer(data: OfferFormData): Promise<string> {
    const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create offer");
    const json = await res.json();
    return json.id;
}

export async function updateOfferStatus(
    id: string,
    status: OfferStatus,
): Promise<void> {
    const res = await fetch(`/api/offers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update offer status");
}

export async function deleteOffer(id: string): Promise<void> {
    const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete offer");
}

export async function convertOfferToInvoice(id: string): Promise<string> {
    const res = await fetch(`/api/offers/${id}/convert`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to convert offer to invoice");
    const json = await res.json();
    return json.invoiceId;
}
