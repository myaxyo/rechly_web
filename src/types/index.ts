// Database entity types - Shared with mobile app

export interface UserCompany {
    id?: string;
    name: string;
    legal_form?: string;
    address_line1: string;
    address_line2?: string;
    postal_code: string;
    city: string;
    country: string;
    vat_id?: string;
    tax_number?: string;
    commercial_register_number?: string;
    registry_court?: string;
    managing_directors?: string;
    bank_name?: string;
    bank_iban: string;
    bank_bic?: string;
    payment_terms_default: string;
    email: string;
    phone?: string;
    website?: string;
    logo_base64?: string;
    created_at: number;
    updated_at: number;
}

export interface Client {
    id?: string;
    name: string;
    contact_person?: string;
    address_line1: string;
    address_line2?: string;
    postal_code: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
    vat_id?: string;
    tax_number?: string;
    leitweg_id?: string;
    created_at: number;
    updated_at: number;
}

export interface Product {
    id?: string;
    name: string;
    description?: string;
    price: number;
    tax_rate_percent: number;
    unit_of_measure: string;
    created_at: number;
    updated_at: number;
}

export interface Invoice {
    id?: string;
    client_id: string;
    invoice_number: string;
    issue_date: string; // YYYY-MM-DD
    due_date?: string; // YYYY-MM-DD
    subtotal: number;
    total_vat: number;
    total_gross: number;
    status: "draft" | "sent" | "paid" | "cancelled";
    notes?: string;
    purchase_order_ref?: string;
    delivery_date?: string;
    payment_terms?: string;
    created_at: number;
    updated_at: number;
}

export interface InvoiceItem {
    id?: string;
    invoice_id: string;
    product_id?: string;
    description: string;
    quantity: number;
    unit_of_measure: string;
    price: number;
    tax_rate_percent: number;
    discount_percent: number;
    subtotal: number;
    tax_amount: number;
    total: number;
}

// Extended types with joined data
export interface InvoiceWithClient extends Invoice {
    client?: Client;
}

export interface InvoiceWithDetails extends Invoice {
    client?: Client;
    items: InvoiceItem[];
}

// Form input types
export interface ClientFormData {
    name: string;
    contact_person?: string;
    address_line1: string;
    address_line2?: string;
    postal_code: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
    vat_id?: string;
    tax_number?: string;
    leitweg_id?: string;
}

export interface ProductFormData {
    name: string;
    description?: string;
    price: number;
    tax_rate_percent: number;
    unit_of_measure: string;
}

export interface ProductCsvPreviewRow {
    row: number;
    name: string;
    description?: string;
    price: number;
    tax_rate_percent: number;
    unit_of_measure: string;
    errors: string[];
}

export interface ProductBulkUploadResult {
    processedRows: number;
    insertedRows: number;
    failedRows: number;
    errors: Array<{
        row: number;
        message: string;
    }>;
    mlTrigger?: {
        attempted: boolean;
        success: boolean;
        details?: string;
    };
}

export interface InvoiceItemFormData {
    product_id?: string;
    description: string;
    quantity: number;
    unit_of_measure: string;
    price: number;
    tax_rate_percent: number;
    discount_percent: number;
}

export interface InvoiceFormData {
    client_id: string;
    invoice_number: string;
    issue_date: string;
    due_date?: string;
    notes?: string;
    purchase_order_ref?: string;
    delivery_date?: string;
    payment_terms?: string;
    items: InvoiceItemFormData[];
}

export interface RevenueForecast {
    next30Days: number;
    next90Days: number;
    confidence: number;
}

export interface ClientRiskScore {
    clientId: string;
    clientName: string;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    lateRate: number;
    averageDaysLate: number;
    overdueOpenInvoices: number;
}

export interface CustomerSegment {
    clientId: string;
    clientName: string;
    recencyDays: number;
    frequency: number;
    monetary: number;
    segment: "champions" | "loyal" | "at_risk" | "new" | "needs_attention";
}

export interface AnalyticsAnomaly {
    type: "amount_outlier" | "client_dropoff" | "duplicate_pattern";
    severity: "low" | "medium" | "high";
    message: string;
    invoiceId?: string;
    clientId?: string;
}

export interface KPIInsight {
    key: string;
    value: string;
    importance: "low" | "medium" | "high";
}

export interface DashboardAnalytics {
    forecast: RevenueForecast;
    latePaymentRisk: ClientRiskScore[];
    customerSegments: CustomerSegment[];
    anomalies: AnalyticsAnomaly[];
    kpiInsights: KPIInsight[];
    generatedAt: string;
}

export type AIProvider = "openai" | "anthropic" | "openrouter";

export interface AISettings {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key_configured: boolean;
}

export interface AISettingsUpdate {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key?: string;
}

export interface AIChatRequest {
    prompt: string;
}

export interface AIChatResponse {
    content: string;
    provider: AIProvider;
    model: string;
}
