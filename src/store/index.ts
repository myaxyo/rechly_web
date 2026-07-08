import { useClientStore } from "./clientStore";
import { useProductStore } from "./productStore";
import { useInvoiceStore } from "./invoiceStore";
import { useOfferStore } from "./offerStore";
import { useRecurringStore } from "./recurringStore";
import { useExpenseStore } from "./expenseStore";
import { useBankStore } from "./bankStore";

export {
    useClientStore,
    useProductStore,
    useInvoiceStore,
    useOfferStore,
    useRecurringStore,
    useExpenseStore,
    useBankStore,
};

// Helper to clear all caches (e.g., on logout)
export const clearAllCaches = () => {
    useClientStore.getState().clearCache();
    useProductStore.getState().clearCache();
    useInvoiceStore.getState().clearCache();
    useOfferStore.getState().clearCache();
    useRecurringStore.getState().clearCache();
    useExpenseStore.getState().clearCache();
    useBankStore.getState().clearCache();
};
