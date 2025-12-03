export { useClientStore } from "./clientStore";
export { useProductStore } from "./productStore";
export { useInvoiceStore } from "./invoiceStore";

// Helper to clear all caches (e.g., on logout)
export const clearAllCaches = () => {
    const { clearCache: clearClients } =
        require("./clientStore").useClientStore.getState();
    const { clearCache: clearProducts } =
        require("./productStore").useProductStore.getState();
    const { clearCache: clearInvoices } =
        require("./invoiceStore").useInvoiceStore.getState();

    clearClients();
    clearProducts();
    clearInvoices();
};
