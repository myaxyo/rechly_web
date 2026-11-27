"use client";
import HelpLink from "@/components/dashboard/HelpLink";

import DecimalInput from "@/components/DecimalInput";
import { InvoiceIdentifierEditor } from "@/components/dashboard/EInvoiceFields";
import { type EInvoiceData } from "@/lib/eRechnung/identifiers";
import {
    buildInvoiceFormData,
    resolveSubmittedInvoiceNumber,
    summarizeServicePeriod,
    validateInvoiceDraft,
    type InvoiceLineItem as LineItem,
} from "@/lib/invoiceForm";
import {
    createInvoiceTemplate,
    getAllInvoiceTemplates,
    type InvoiceTemplate,
} from "@/lib/invoiceTemplateService";
import { defaultVatRate, VAT_RATE_OPTIONS } from "@/lib/vatDefaults";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Bot, Check, CircleCheck, Copy, FileText, Loader2, Plus,
    RefreshCw, Save, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { Steps } from "@/components/ui/steps";
import dayjs, { type Dayjs } from "dayjs";
import { getAllClients, createClient } from "@/lib/clientService";
import { getAllProducts, createProduct } from "@/lib/productService";
import { createInvoice, getInvoiceById, getNextInvoiceNumber, updateDraftInvoice } from "@/lib/invoiceService";
import { getCompanyInfo } from "@/lib/companyService";
import { euCountryOptions } from "@/lib/euCountries";
import { runInvoiceAssistant, parseInvoiceDraftWithAI } from "@/lib/aiService";
import {
    formatCurrency,
    calculateInvoiceTotals,
    type InvoiceTotals,
} from "@/lib/currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
    Client,
    Product,
    UserCompany,
} from "@/types";

export default function InvoiceCreatePage() {
    const router = useRouter();
    const { language, t } = useLanguage();
    // Also mounted at /dashboard/invoices/[id]/edit to edit a draft invoice.
    const params = useParams<{ id?: string }>();
    const editId = typeof params?.id === "string" ? params.id : undefined;

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [eInvoice, setEInvoice] = useState<EInvoiceData | undefined>();
    const [company, setCompany] = useState<UserCompany | null>(null);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(dayjs());
    const [dueDate, setDueDate] = useState(dayjs().add(14, "day"));
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [numberTouched, setNumberTouched] = useState(false);
    const [deliveryDateStart, setDeliveryDateStart] = useState<Dayjs | null>(null);
    const [deliveryDateEnd, setDeliveryDateEnd] = useState<Dayjs | null>(null);
    const [notes, setNotes] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("");
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateSaving, setTemplateSaving] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [generatingPaymentTerms, setGeneratingPaymentTerms] = useState(false);
    const [generatingLineItemKey, setGeneratingLineItemKey] = useState<
        string | null
    >(null);
    const [aiPrompt, setAiPrompt] = useState("");
    const [parsingPrompt, setParsingPrompt] = useState(false);

    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(
        null,
    );

    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [clientSaving, setClientSaving] = useState(false);
    const [clientValues, setClientValues] = useState({ name: "", email: "", phone: "", address_line1: "", postal_code: "", city: "", country: "Deutschland" });
    const emptyClientValues = { name: "", email: "", phone: "", address_line1: "", postal_code: "", city: "", country: "Deutschland" };
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productSaving, setProductSaving] = useState(false);
    const [productValues, setProductValues] = useState<{ name: string; description: string; price: number; unit_of_measure: string; tax_rate_percent: number }>({
        name: "", description: "", price: 0, unit_of_measure: "", tax_rate_percent: 19,
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [clientsData, productsData, companyData, templatesData] =
                await Promise.all([
                    getAllClients(),
                    getAllProducts(),
                    getCompanyInfo(),
                    getAllInvoiceTemplates().catch(() => [] as InvoiceTemplate[]),
                ]);
            setClients(clientsData);
            setProducts(productsData);
            setCompany(companyData);
            setPaymentTerms(companyData?.payment_terms_default || "");
            setTemplates(templatesData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error(t("invoiceCreate.loadError"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const toLineItem = useCallback(
        (item: {
            description: string;
            quantity: number;
            unit_of_measure?: string;
            price: number;
            tax_rate_percent?: number;
            discount_percent?: number;
            product_id?: string;
            gtin?: string;
            service_date_start?: string;
            service_date_end?: string;
        }): LineItem => ({
            key: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            description: item.description,
            service_summary: item.description,
            quantity: item.quantity || 1,
            unit_of_measure: item.unit_of_measure || t("invoiceCreate.unitPiece"),
            price: item.price ?? 0,
            tax_rate_percent:
                typeof item.tax_rate_percent === "number"
                    ? item.tax_rate_percent
                    : defaultVatRate(company?.is_small_business, null, company?.is_flat_rate_farming),
            discount_percent: item.discount_percent ?? 0,
            ...(item.product_id ? { product_id: item.product_id } : {}),
            ...(item.gtin ? { gtin: item.gtin } : {}),
            ...(item.service_date_start ? { service_date_start: item.service_date_start } : {}),
            ...(item.service_date_end ? { service_date_end: item.service_date_end } : {}),
        }),
        [company, t],
    );

    /** Fill the whole form from an existing invoice or template draft. */
    const applyDraftData = useCallback(
        (draft: {
            clientId?: string;
            notes?: string;
            paymentTerms?: string;
            deliveryDateStart?: string;
            deliveryDateEnd?: string;
            items: Array<{
                description: string;
                quantity: number;
                unit_of_measure?: string;
                price: number;
                tax_rate_percent?: number;
                discount_percent?: number;
                product_id?: string;
                gtin?: string;
                service_date_start?: string;
                service_date_end?: string;
            }>;
        }) => {
            if (draft.clientId) {
                const found = clients.find((c) => c.id === draft.clientId);
                setSelectedClient(found ?? null);
            } else {
                setSelectedClient(null);
            }
            setEInvoice(undefined);
            setNotes(draft.notes ?? "");
            setPaymentTerms(draft.paymentTerms ?? company?.payment_terms_default ?? "");
            setDeliveryDateStart(draft.deliveryDateStart ? dayjs(draft.deliveryDateStart) : null);
            setDeliveryDateEnd(draft.deliveryDateEnd ? dayjs(draft.deliveryDateEnd) : null);
            setLineItems(draft.items.map((item) => toLineItem(item)));
        },
        [clients, company, toLineItem],
    );

    const applyTemplate = useCallback(
        (template: InvoiceTemplate) => {
            applyDraftData({
                clientId: template.payload.clientId,
                notes: template.payload.notes,
                paymentTerms: template.payload.paymentTerms,
                deliveryDateStart: template.payload.deliveryDateStart,
                deliveryDateEnd: template.payload.deliveryDateEnd,
                items: template.payload.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_of_measure: item.unitOfMeasure,
                    price: item.price,
                    tax_rate_percent: item.taxRatePercent,
                    discount_percent: item.discount,
                    product_id: item.productId,
                    service_date_start: item.serviceDateStart,
                    service_date_end: item.serviceDateEnd,
                })),
            });
            toast.success(t("invoiceCreate.templateApplied"));
        },
        [applyDraftData, t],
    );

    /** Edit mode: load the draft and fill the whole wizard with its data. */
    const prefillDraftForEdit = useCallback(async (id: string) => {
        const source = await getInvoiceById(id);
        if (!source) {
            toast.error(t("invoiceCreate.duplicateNotFound"));
            router.replace("/dashboard/invoices");
            return;
        }
        if (source.status !== "draft") {
            toast.warning(t("invoiceEdit.onlyDrafts"));
            router.replace(`/dashboard/invoices/${id}`);
            return;
        }
        applyDraftData({
            clientId: source.client_id,
            notes: source.notes,
            paymentTerms: source.payment_terms,
            deliveryDateStart: source.delivery_date_start,
            deliveryDateEnd: source.delivery_date_end ?? source.delivery_date,
            items: source.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit_of_measure: item.unit_of_measure,
                price: item.price,
                tax_rate_percent: item.tax_rate_percent,
                discount_percent: item.discount_percent,
                product_id: item.product_id ?? undefined,
                gtin: item.gtin,
                service_date_start: item.service_date_start,
                service_date_end: item.service_date_end,
            })),
        });
        // applyDraftData resets these for duplicates; a draft keeps its own values.
        if (source.e_invoice) setEInvoice(source.e_invoice);
        setPaymentTerms(source.payment_terms ?? "");
        setInvoiceNumber(source.invoice_number);
        setNumberTouched(true);
        setInvoiceDate(dayjs(source.issue_date));
        if (source.due_date) setDueDate(dayjs(source.due_date));
    }, [applyDraftData, router, t]);

    const suggestDuplicatePrefill = useCallback(async () => {
        try {
            if (editId) {
                await prefillDraftForEdit(editId);
                return;
            }
            const params = new URLSearchParams(window.location.search);
            const duplicateId = params.get("duplicate");
            const templateId = params.get("template");
            if (duplicateId) {
                const source = await getInvoiceById(duplicateId);
                if (!source) {
                    toast.error(t("invoiceCreate.duplicateNotFound"));
                    return;
                }
                applyDraftData({
                    clientId: source.client_id,
                    notes: source.notes,
                    paymentTerms: source.payment_terms,
                    deliveryDateStart: source.delivery_date_start,
                    deliveryDateEnd: source.delivery_date_end ?? source.delivery_date,
                    items: source.items.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unit_of_measure: item.unit_of_measure,
                        price: item.price,
                        tax_rate_percent: item.tax_rate_percent,
                        discount_percent: item.discount_percent,
                        product_id: item.product_id ?? undefined,
                        service_date_start: item.service_date_start,
                        service_date_end: item.service_date_end,
                    })),
                });
                toast.success(t("invoiceCreate.duplicatedNotice"));
            } else if (templateId) {
                const tpl = templates.find((item) => item.id === templateId);
                if (!tpl) {
                    toast.error(t("invoiceCreate.templateNotFound"));
                    return;
                }
                applyTemplate(tpl);
            }
        } catch (error) {
            console.error("Error applying prefill:", error);
        }
    }, [templates, applyDraftData, applyTemplate, editId, prefillDraftForEdit, t]);

    const generateInvoiceNumber = useCallback(async () => {
        try {
            const next = await getNextInvoiceNumber();
            if (next?.number) {
                setInvoiceNumber(next.number);
                setNumberTouched(false);
                return;
            }
        } catch (error) {
            console.error("Error fetching next invoice number:", error);
        }
        // Fallback when the numbering endpoint is unavailable.
        const year = dayjs().format("YYYY");
        const month = dayjs().format("MM");
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
        setInvoiceNumber(`RE-${year}${month}-${random}`);
        setNumberTouched(false);
    }, []);

    const [prefillDone, setPrefillDone] = useState(false);

    useEffect(() => {
        void loadData();
        if (!editId) void generateInvoiceNumber();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading && !prefillDone) {
            setPrefillDone(true);
            void suggestDuplicatePrefill();
        }
    }, [loading, prefillDone, suggestDuplicatePrefill]);

    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

    const addLineItem = () => {
        const newItem: LineItem = {
            key: Date.now().toString(),
            description: "",
            service_summary: "",
            quantity: 1,
            unit_of_measure: t("invoiceCreate.unitPiece"),
            price: 0,
            tax_rate_percent: defaultVatRate(company?.is_small_business, null, company?.is_flat_rate_farming),
            discount_percent: 0,
        };
        setLineItems([...lineItems, newItem]);
    };

    const updateLineItem = (
        key: string,
        field: keyof LineItem,
        value: unknown,
    ) => {
        setLineItems(
            lineItems.map((item) => {
                if (item.key === key) {
                    return { ...item, [field]: value };
                }
                return item;
            }),
        );
    };

    const removeLineItem = (key: string) => {
        setLineItems(lineItems.filter((item) => item.key !== key));
        setSelectedRowKeys((prev) => prev.filter((k) => k !== key));
    };

    const makeItemKey = () =>
        `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    /** Duplicate a single line item, inserted directly below the original. */
    const duplicateLineItem = (key: string) => {
        const index = lineItems.findIndex((item) => item.key === key);
        if (index === -1) return;
        const copy: LineItem = { ...lineItems[index], key: makeItemKey() };
        const next = [...lineItems];
        next.splice(index + 1, 0, copy);
        setLineItems(next);
        toast.success(t("invoiceCreate.lineItemDuplicated"));
    };

    /** Duplicate all selected line items, appended in their current order. */
    const duplicateSelectedItems = () => {
        const selected = lineItems.filter((item) =>
            selectedRowKeys.includes(item.key),
        );
        if (selected.length === 0) return;
        setLineItems([
            ...lineItems,
            ...selected.map((item) => ({ ...item, key: makeItemKey() })),
        ]);
        setSelectedRowKeys([]);
        toast.success(
            t("invoiceCreate.selectedDuplicated").replace(
                "{count}",
                String(selected.length),
            ),
        );
    };

    /** Delete all selected line items. */
    const removeSelectedItems = () => {
        const count = selectedRowKeys.length;
        if (count === 0) return;
        setLineItems(
            lineItems.filter((item) => !selectedRowKeys.includes(item.key)),
        );
        setSelectedRowKeys([]);
        toast.success(
            t("invoiceCreate.selectedDeleted").replace("{count}", String(count)),
        );
    };

    const addProductAsLineItem = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const newItem: LineItem = {
            key: Date.now().toString(),
            description: product.name,
            service_summary: product.description || product.name,
            quantity: 1,
            unit_of_measure: product.unit_of_measure || t("invoiceCreate.unitPiece"),
            price: product.price,
            tax_rate_percent: defaultVatRate(company?.is_small_business, product.tax_rate_percent, company?.is_flat_rate_farming),
            discount_percent: 0,
        };
        setLineItems([...lineItems, newItem]);
    };

    const handleCreateClient = async () => {
        const values = clientValues;
        if (!values.name.trim()) return;
        try {
            setClientSaving(true);
            const newClient = await createClient({
                name: values.name.trim(),
                email: values.email?.trim() || undefined,
                phone: values.phone?.trim() || undefined,
                address_line1: values.address_line1?.trim() || "",
                postal_code: values.postal_code?.trim() || "",
                city: values.city?.trim() || "",
                country: values.country?.trim() || "Deutschland",
            });
            setClients((prev) => [...prev, newClient]);
            setSelectedClient(newClient);
            setEInvoice(undefined);
            setClientModalOpen(false);
            setClientValues(emptyClientValues);
            toast.success(t("invoiceCreate.createdClient"));
        } catch (error) {
            if (error instanceof Error && error.message) {
                toast.error(error.message);
            }
        } finally {
            setClientSaving(false);
        }
    };

    const handleCreateProduct = async () => {
        const values = productValues;
        if (!values.name.trim()) return;
        try {
            setProductSaving(true);
            const newProduct = await createProduct({
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
                price: Number(values.price) || 0,
                tax_rate_percent: Number(values.tax_rate_percent ?? defaultVatRate(company?.is_small_business, null, company?.is_flat_rate_farming)),
                unit_of_measure: values.unit_of_measure?.trim() || t("invoiceCreate.unitPiece"),
            });
            setProducts((prev) => [...prev, newProduct]);
            setProductModalOpen(false);
            setProductValues({ name: "", description: "", price: 0, unit_of_measure: t("invoiceCreate.unitPiece"), tax_rate_percent: defaultVatRate(company?.is_small_business, null, company?.is_flat_rate_farming) });
            toast.success(t("invoiceCreate.createdProduct"));
            if (newProduct.id) {
                addProductAsLineItem(newProduct.id);
            }
        } catch (error) {
            if (error instanceof Error && error.message) {
                toast.error(error.message);
            }
        } finally {
            setProductSaving(false);
        }
    };

    const totals: InvoiceTotals = calculateInvoiceTotals(
        lineItems.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            tax_rate_percent: item.tax_rate_percent,
            discount_percent: item.discount_percent,
        })),
    );

    /** Adopt min start / max end from per-item service dates. */
    const handleAdoptServicePeriod = () => {
        const summary = summarizeServicePeriod(
            lineItems.map((item) => ({
                service_date_start: item.service_date_start,
                service_date_end: item.service_date_end,
            })),
        );
        if (!summary) {
            toast.info(t("invoiceCreate.noServiceDates"));
            return;
        }
        setDeliveryDateStart(dayjs(summary.start));
        setDeliveryDateEnd(dayjs(summary.end));
        toast.success(t("invoiceCreate.servicePeriodAdopted"));
    };

    /** Save the current draft as a reusable template. */
    const handleSaveTemplate = async () => {
        try {
            const name = templateName.trim();
            if (!name) {
                toast.warning(t("invoiceCreate.templateNameRequired"));
                return;
            }
            setTemplateSaving(true);
            const tpl = await createInvoiceTemplate({
                name: name.slice(0, 120),
                payload: {
                    ...(selectedClient?.id ? { clientId: selectedClient.id } : {}),
                    ...(notes.trim() ? { notes: notes.trim() } : {}),
                    ...(paymentTerms.trim() ? { paymentTerms: paymentTerms.trim() } : {}),
                    ...(deliveryDateStart ? { deliveryDateStart: deliveryDateStart.format("YYYY-MM-DD") } : {}),
                    ...(deliveryDateEnd ? { deliveryDateEnd: deliveryDateEnd.format("YYYY-MM-DD") } : {}),
                    items: lineItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitOfMeasure: item.unit_of_measure,
                        price: item.price,
                        taxRatePercent: item.tax_rate_percent,
                        discount: item.discount_percent,
                        ...(item.product_id ? { productId: item.product_id } : {}),
                        ...(item.service_date_start ? { serviceDateStart: item.service_date_start } : {}),
                        ...(item.service_date_end ? { serviceDateEnd: item.service_date_end } : {}),
                    })),
                },
            });
            setTemplates((prev) => [tpl, ...prev]);
            setTemplateModalOpen(false);
            setTemplateName("");
            toast.success(t("invoiceCreate.templateSaved"));
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error(error instanceof Error ? error.message : t("invoiceCreate.createError"));
        } finally {
            setTemplateSaving(false);
        }
    };

    const handleCreateInvoice = async () => {
        const draftError = validateInvoiceDraft(selectedClient?.id, lineItems.length);
        if (draftError === "missing-client") {
            toast.error(t("invoiceCreate.selectClientError"));
            return;
        }
        if (draftError === "missing-items") {
            toast.error(t("invoiceCreate.addItemsError"));
            return;
        }
        if (deliveryDateStart && deliveryDateEnd && deliveryDateStart.isAfter(deliveryDateEnd, "day")) {
            toast.error(t("invoiceCreate.servicePeriodInvalid"));
            return;
        }
        const hasInvalidItemPeriod = lineItems.some(
            (item) =>
                item.service_date_start &&
                item.service_date_end &&
                item.service_date_start > item.service_date_end,
        );
        if (hasInvalidItemPeriod) {
            toast.error(t("invoiceCreate.itemServicePeriodInvalid"));
            return;
        }

        setSaving(true);
        try {
            const invoiceData = buildInvoiceFormData({
                clientId: selectedClient!.id!,
                eInvoice,
                invoiceNumber: resolveSubmittedInvoiceNumber({
                    invoiceNumber,
                    numberTouched,
                    isEdit: Boolean(editId),
                }),
                issueDate: invoiceDate.format("YYYY-MM-DD"),
                dueDate: dueDate.format("YYYY-MM-DD"),
                notes,
                paymentTerms,
                deliveryDateStart: deliveryDateStart?.format("YYYY-MM-DD"),
                deliveryDateEnd: deliveryDateEnd?.format("YYYY-MM-DD"),
                lineItems,
            });

            if (editId) {
                await updateDraftInvoice(editId, invoiceData);
                toast.success(t("invoiceEdit.saved"));
                router.push(`/dashboard/invoices/${editId}`);
                return;
            }

            const created = await createInvoice(invoiceData);
            // Use the server-assigned number (may differ after conflict resolution).
            if (created.invoiceNumber) {
                setInvoiceNumber(created.invoiceNumber);
            }

            setCreatedInvoiceId(created.id);
            setCurrentStep(3);
            toast.success(t("invoiceCreate.created"));
        } catch (error) {
            console.error("Error creating invoice:", error);
            const status = (error as { status?: number } | null)?.status;
            // In edit mode a 409 can also mean "no longer a draft"; show the server message.
            if (status === 409 && !editId) {
                toast.error(t("invoiceCreate.numberTaken"));
            } else {
                const errorMsg = error instanceof Error ? error.message : t("invoiceCreate.createError");
                toast.error(errorMsg);
            }
        } finally {
            setSaving(false);
        }
    };

    const buildAssistantPayload = () => ({
        companyName: company?.name,
        clientName: selectedClient?.name,
        clientEmail: selectedClient?.email,
        invoiceNumber,
        issueDate: invoiceDate.format("YYYY-MM-DD"),
        dueDate: dueDate.format("YYYY-MM-DD"),
        totalGross: totals.totalGross,
        currency: "EUR",
        notes: notes || undefined,
        paymentTerms: paymentTerms || undefined,
        lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_of_measure: item.unit_of_measure,
            price: item.price,
        })),
    });

    const handleGenerateNotes = async () => {
        if (!selectedClient) {
            toast.warning(t("invoiceCreate.selectClientFirst"));
            return;
        }

        setGeneratingNotes(true);
        try {
            const result = await runInvoiceAssistant({
                action: "invoice_note",
                ...buildAssistantPayload(),
            });
            setNotes(result.content);
            toast.success(t("invoiceCreate.notesAiCreated"));
        } catch (error) {
            console.error("Error generating invoice notes:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("invoiceCreate.notesAiError"),
            );
        } finally {
            setGeneratingNotes(false);
        }
    };

    const handleGeneratePaymentTerms = async () => {
        if (!selectedClient) {
            toast.warning(t("invoiceCreate.selectClientFirst"));
            return;
        }

        setGeneratingPaymentTerms(true);
        try {
            const result = await runInvoiceAssistant({
                action: "payment_terms",
                ...buildAssistantPayload(),
            });
            setPaymentTerms(result.content);
            toast.success(t("invoiceCreate.paymentTermsAiCreated"));
        } catch (error) {
            console.error("Error generating payment terms:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("invoiceCreate.paymentTermsAiError"),
            );
        } finally {
            setGeneratingPaymentTerms(false);
        }
    };

    const handleGenerateLineItemDescription = async (item: LineItem) => {
        const serviceSummary =
            item.service_summary?.trim() || item.description.trim();
        if (!serviceSummary) {
            toast.warning(
                t("invoiceCreate.serviceSummaryHint"),
            );
            return;
        }

        setGeneratingLineItemKey(item.key);
        try {
            const result = await runInvoiceAssistant({
                action: "line_item_description",
                ...buildAssistantPayload(),
                serviceSummary,
            });
            updateLineItem(item.key, "description", result.content);
            if (!item.service_summary?.trim()) {
                updateLineItem(item.key, "service_summary", serviceSummary);
            }
            toast.success(t("invoiceCreate.lineItemAiCreated"));
        } catch (error) {
            console.error("Error generating line item description:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("invoiceCreate.lineItemAiError"),
            );
        } finally {
            setGeneratingLineItemKey(null);
        }
    };

    const handleAiQuickFill = async () => {
        if (!aiPrompt.trim()) {
            toast.warning(t("invoiceCreate.aiQuickPlaceholder"));
            return;
        }

        setParsingPrompt(true);
        try {
            const result = await parseInvoiceDraftWithAI({
                promptText: aiPrompt,
                isSmallBusiness: company?.is_small_business,
                isFlatRateFarming: company?.is_flat_rate_farming,
                availableClients: clients.map((c) => ({
                    id: c.id || "",
                    name: c.name,
                })),
            });

            const parsed = result.parsed;
            if (parsed.client_id) {
                const found = clients.find((c) => c.id === parsed.client_id);
                if (found) {
                    if (found.id !== selectedClient?.id) setEInvoice(undefined);
                    setSelectedClient(found);
                }
            } else if (parsed.client_name) {
                const found = clients.find(
                    (c) =>
                        c.name.toLowerCase() ===
                        parsed.client_name?.toLowerCase(),
                );
                if (found) {
                    if (found.id !== selectedClient?.id) setEInvoice(undefined);
                    setSelectedClient(found);
                }
            }

            if (parsed.items && parsed.items.length > 0) {
                const newItems: LineItem[] = parsed.items.map((it, idx) => ({
                    key: `${Date.now()}-${idx}`,
                    description: it.description,
                    service_summary: it.description,
                    quantity: it.quantity,
                    unit_of_measure:
                        it.unit_of_measure || t("invoiceCreate.unitPiece"),
                    price: it.price,
                    tax_rate_percent: company?.is_small_business
                        ? 0
                        : it.tax_rate_percent,
                    discount_percent: 0,
                }));
                setLineItems(newItems);
            }

            if (parsed.due_days) {
                setDueDate(dayjs().add(parsed.due_days, "day"));
            }

            if (parsed.payment_terms) {
                setPaymentTerms(parsed.payment_terms);
            }

            if (parsed.notes) {
                setNotes(parsed.notes);
            }

            toast.success(t("invoiceCreate.aiQuickSuccess"));
            if (parsed.client_id || parsed.client_name) {
                setCurrentStep(1);
            }
        } catch (error) {
            console.error("AI Quick Fill error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("invoiceCreate.aiQuickError"),
            );
        } finally {
            setParsingPrompt(false);
        }
    };

    const unitOptions = [
        t("invoiceCreate.unitPiece"),
        t("invoiceCreate.unitHour"),
        t("invoiceCreate.unitDay"),
        t("invoiceCreate.unitMonth"),
        t("invoiceCreate.unitFlatRate"),
        "m²",
        "kg",
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Card>
                        <CardHeader><CardTitle>{t("invoiceCreate.selectClientCard")}</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {templates.length > 0 && (
                                <Select
                                    value={undefined}
                                    onValueChange={(tplId) => {
                                        const tpl = templates.find((item) => item.id === tplId);
                                        if (tpl) applyTemplate(tpl);
                                    }}
                                >
                                    <SelectTrigger aria-label={t("invoiceCreate.fromTemplate")}><SelectValue placeholder={t("invoiceCreate.fromTemplate")} /></SelectTrigger>
                                    <SelectContent>
                                        {templates.map((tpl) => (
                                            <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <div className="min-w-0 flex-1 basis-52">
                                    <Select
                                        value={selectedClient?.id}
                                        onValueChange={(value) => {
                                            const client = clients.find((c) => c.id === value);
                                            setSelectedClient(client || null);
                                            setEInvoice(undefined);
                                        }}
                                    >
                                        <SelectTrigger className="h-10 w-full" aria-label={t("invoiceCreate.clientSearch")}><SelectValue placeholder={t("invoiceCreate.clientSearch")} /></SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id ?? ""}>
                                                    {`${c.name} ${c.contact_person ? `(${c.contact_person})` : ""}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" size="lg" variant="outline" onClick={() => setClientModalOpen(true)}>
                                    <Plus />
                                    {t("invoiceCreate.newClientBtn")}
                                </Button>
                            </div>
                            {selectedClient && <InvoiceIdentifierEditor key={selectedClient.id} initial={selectedClient.e_invoice} value={eInvoice} onChange={setEInvoice} />}
                            {selectedClient && (
                                <Card>
                                    <CardContent>
                                        <h3 className="text-base font-semibold">{selectedClient.name}</h3>
                                        {selectedClient.contact_person && <p className="text-sm">{selectedClient.contact_person}</p>}
                                        <p className="text-sm text-muted-foreground">
                                            {selectedClient.address_line1}
                                            <br />
                                            {selectedClient.postal_code} {selectedClient.city}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                );

            case 1:
                return (
                    <Card>
                        <CardHeader><CardTitle>{t("invoiceCreate.addPositions")}</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                <div className="w-full sm:w-[300px]">
                                    <Select value={undefined} onValueChange={addProductAsLineItem}>
                                        <SelectTrigger aria-label={t("invoiceCreate.addProduct")}><SelectValue placeholder={t("invoiceCreate.addProduct")} /></SelectTrigger>
                                        <SelectContent>
                                            {products.map((prod) => (
                                                <SelectItem key={prod.id} value={prod.id ?? ""}>
                                                    {`${prod.name} - ${formatCurrency(prod.price)}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" variant="outline" onClick={() => {
                                    setProductValues({ name: "", description: "", price: 0, unit_of_measure: t("invoiceCreate.unitPiece"), tax_rate_percent: defaultVatRate(company?.is_small_business, null, company?.is_flat_rate_farming) });
                                    setProductModalOpen(true);
                                }}>
                                    <Plus />
                                    {t("invoiceCreate.newProductBtn")}
                                </Button>
                                <Button type="button" variant="outline" onClick={addLineItem}>
                                    <Plus />
                                    {t("invoiceCreate.freePosition")}
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <Checkbox
                                                    checked={lineItems.length > 0 && selectedRowKeys.length === lineItems.length}
                                                    onCheckedChange={(checked) => setSelectedRowKeys(checked ? lineItems.map((i) => i.key) : [])}
                                                    aria-label="Select all"
                                                />
                                            </TableHead>
                                            <TableHead>{t("invoiceCreate.description")}</TableHead>
                                            <TableHead className="w-[110px]">{t("invoiceCreate.quantity")}</TableHead>
                                            <TableHead className="w-[110px]">{t("invoiceDetail.unit")}</TableHead>
                                            <TableHead className="w-[130px]">{t("invoiceCreate.unitPrice")}</TableHead>
                                            <TableHead className="w-[110px]">{t("invoiceCreate.vat")}</TableHead>
                                            <TableHead className="w-[230px]">{t("invoiceCreate.itemServicePeriod")}</TableHead>
                                            <TableHead className="w-[110px] text-right">{t("invoiceCreate.lineTotal")}</TableHead>
                                            <TableHead className="w-[96px]"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lineItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                                    {t("invoiceDetail.noPositions")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            lineItems.map((record) => (
                                                <TableRow key={record.key}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedRowKeys.includes(record.key)}
                                                            onCheckedChange={(checked) =>
                                                                setSelectedRowKeys((keys) => checked ? [...keys, record.key] : keys.filter((k) => k !== record.key))
                                                            }
                                                            aria-label="Select row"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="min-w-[220px]">
                                                        <div className="flex flex-col gap-2">
                                                            <Textarea
                                                                value={record.description}
                                                                onChange={(e) => updateLineItem(record.key, "description", e.target.value)}
                                                                placeholder={t("invoiceCreate.descriptionPlaceholder")}
                                                                rows={2}
                                                            />
                                                            <details>
                                                                <summary className="cursor-pointer text-sm">{t("einvoice.gtin")}</summary>
                                                                <Input aria-label={t("einvoice.gtin")} maxLength={14} value={record.gtin || ""}
                                                                    onChange={(e) => updateLineItem(record.key, "gtin", e.target.value)} placeholder={t("einvoice.gtinHelp")} />
                                                            </details>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={record.service_summary}
                                                                    onChange={(e) => updateLineItem(record.key, "service_summary", e.target.value)}
                                                                    placeholder={t("invoiceCreate.serviceSummaryPlaceholder")}
                                                                    className="min-w-0 flex-1"
                                                                />
                                                                <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={generatingLineItemKey === record.key}
                                                                    onClick={() => void handleGenerateLineItemDescription(record)}>
                                                                    {generatingLineItemKey === record.key ? <Loader2 className="animate-spin" /> : <Bot />}
                                                                    {t("invoiceCreate.ai")}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DecimalInput value={record.quantity} min={0}
                                                            onChange={(val) => updateLineItem(record.key, "quantity", val || 0)} style={{ width: "100%" }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select value={record.unit_of_measure} onValueChange={(val) => updateLineItem(record.key, "unit_of_measure", val)}>
                                                            <SelectTrigger aria-label={t("invoiceDetail.unit")}><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {unitOptions.map((u) => (
                                                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DecimalInput value={record.price} min={0} step={0.01} precision={2} addonAfter="€"
                                                            onChange={(val) => updateLineItem(record.key, "price", val || 0)} style={{ width: "100%" }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select value={String(record.tax_rate_percent)} onValueChange={(val) => updateLineItem(record.key, "tax_rate_percent", Number(val))}>
                                                            <SelectTrigger aria-label={t("invoiceCreate.vat")}><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {VAT_RATE_OPTIONS.map((o) => (
                                                                    <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DateRangePicker
                                                            value={[record.service_date_start ? dayjs(record.service_date_start) : null, record.service_date_end ? dayjs(record.service_date_end) : null]}
                                                            onChange={(range) => {
                                                                const [start, end] = range ?? [null, null];
                                                                updateLineItem(record.key, "service_date_start", start ? start.format("YYYY-MM-DD") : undefined);
                                                                updateLineItem(record.key, "service_date_end", end ? end.format("YYYY-MM-DD") : undefined);
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(record.quantity * record.price)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => duplicateLineItem(record.key)} aria-label={t("invoiceCreate.duplicateLineItem")}>
                                                                        <Copy />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t("invoiceCreate.duplicateLineItem")}</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeLineItem(record.key)} aria-label={t("invoiceCreate.deleteLineItem")}>
                                                                        <Trash2 />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t("invoiceCreate.deleteLineItem")}</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {selectedRowKeys.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t("invoiceCreate.selectedCount").replace("{count}", String(selectedRowKeys.length))}
                                    </span>
                                    <Button type="button" variant="outline" size="sm" onClick={duplicateSelectedItems}>
                                        <Copy />
                                        {t("invoiceCreate.duplicateSelected")}
                                    </Button>
                                    <Button type="button" variant="destructive" size="sm" onClick={removeSelectedItems}>
                                        <Trash2 />
                                        {t("invoiceCreate.deleteSelected")}
                                    </Button>
                                </div>
                            )}

                            <Separator />

                            <div className="flex flex-col items-end gap-1 text-sm">
                                <span>{t("invoiceCreate.subtotal")}: <strong>{formatCurrency(totals.netAfterDiscount)}</strong></span>
                                <span>{t("invoiceCreate.vat")}: <strong>{formatCurrency(totals.totalVAT)}</strong></span>
                                <span className="text-lg font-semibold">{t("invoiceCreate.total")}: {formatCurrency(totals.totalGross)}</span>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 2:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("invoiceCreate.invoiceDetails")}</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={() => setTemplateModalOpen(true)}>
                                <Save />
                                {t("invoiceCreate.saveAsTemplate")}
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="inv-number">{t("invoiceCreate.invoiceNumber")}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="inv-number"
                                        value={invoiceNumber}
                                        onChange={(e) => {
                                            setInvoiceNumber(e.target.value);
                                            setNumberTouched(true);
                                        }}
                                        placeholder={t("invoiceCreate.invoiceNumberPlaceholder")}
                                        className="min-w-0 flex-1"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" onClick={() => void generateInvoiceNumber()} aria-label={t("invoiceCreate.newNumberTooltip")}>
                                                <RefreshCw />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t("invoiceCreate.newNumberTooltip")}</TooltipContent>
                                    </Tooltip>
                                </div>
                                {!numberTouched && invoiceNumber && (
                                    <p className="text-xs text-muted-foreground">{t("invoiceCreate.autoNumberHint")}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>{t("invoiceCreate.deliveryPeriod")}</Label>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="min-w-0 flex-1 basis-64">
                                        <DateRangePicker
                                            value={[deliveryDateStart, deliveryDateEnd]}
                                            onChange={(range) => {
                                                const [start, end] = range ?? [null, null];
                                                setDeliveryDateStart(start);
                                                setDeliveryDateEnd(end);
                                            }}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={handleAdoptServicePeriod}>
                                        {t("invoiceCreate.deliveryPeriodAuto")}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">{t("invoiceCreate.deliveryPeriodHelp")}</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <Label>{t("invoiceCreate.invoiceDate")}</Label>
                                    <DatePicker value={invoiceDate} onChange={(date) => date && setInvoiceDate(date)} format="DD.MM.YYYY" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>{t("invoiceCreate.dueDate")}</Label>
                                    <DatePicker value={dueDate} onChange={(date) => date && setDueDate(date)} format="DD.MM.YYYY" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="inv-notes">{t("invoiceCreate.notesLabel")}</Label>
                                <div>
                                    <Button type="button" variant="outline" size="sm" disabled={generatingNotes} onClick={() => void handleGenerateNotes()}>
                                        {generatingNotes ? <Loader2 className="animate-spin" /> : <Bot />}
                                        {t("invoiceCreate.generateWithAi")}
                                    </Button>
                                </div>
                                <Textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                                    placeholder={t("invoiceCreate.notesPlaceholderLong")} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="inv-terms">{t("invoiceCreate.paymentTermsLabel")}</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" size="sm" disabled={generatingPaymentTerms} onClick={() => void handleGeneratePaymentTerms()}>
                                        {generatingPaymentTerms ? <Loader2 className="animate-spin" /> : <Bot />}
                                        {t("invoiceCreate.generateWithAi")}
                                    </Button>
                                    {company?.payment_terms_default ? (
                                        <Button type="button" variant="outline" size="sm" onClick={() => setPaymentTerms(company.payment_terms_default)}>
                                            {t("invoiceCreate.restoreDefault")}
                                        </Button>
                                    ) : null}
                                </div>
                                <Textarea id="inv-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} rows={3}
                                    placeholder={t("invoiceCreate.paymentTermsPlaceholderLong")} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Separator className="flex-1" />
                                <span className="text-sm font-medium text-muted-foreground">{t("invoiceCreate.summary")}</span>
                                <Separator className="flex-1" />
                            </div>

                            <Card className="dashboard-subpanel">
                                <CardContent className="flex flex-col gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("invoiceCreate.client")}</p>
                                        <p className="font-semibold">{selectedClient?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("invoiceCreate.positionsCount")}</p>
                                        <p className="font-semibold">{lineItems.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("invoiceCreate.totalAmount")}</p>
                                        <p className="text-xl font-semibold">{formatCurrency(totals.totalGross)}</p>
                                    </div>
                                    <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                                        {company?.bank_iban ? (
                                            <span>
                                                <span className="font-semibold text-emerald-600">✓ GiroCode: </span>
                                                {language === "en" ? "SEPA QR code will be generated on invoice" : "SEPA-QR-Code wird auf Rechnung generiert"}
                                            </span>
                                        ) : (
                                            <span>
                                                <span className="font-semibold text-amber-600">ℹ GiroCode: </span>
                                                {language === "en" ? "Add IBAN in Settings to enable payment QR code" : "IBAN in Einstellungen hinterlegen für Zahlungs-QR-Code"}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                );

            case 3:
                return (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                            <CircleCheck className="size-12 text-primary" />
                            <h3 className="text-lg font-semibold">{t("invoiceCreate.successTitle")}</h3>
                            <p className="text-sm text-muted-foreground">{`${t("invoiceCreate.successSubtitle")} ${invoiceNumber}`}</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button type="button" onClick={() => router.push(`/dashboard/invoices/${createdInvoiceId}`)}>
                                    {t("invoiceCreate.viewInvoiceBtn")}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/invoices/${createdInvoiceId}/pdf`)}>
                                    {t("invoiceCreate.createPdf")}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                                    {t("invoiceCreate.newInvoice")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return !!selectedClient;
            case 1:
                return lineItems.length > 0;
            case 2:
                // The invoice number is optional: left empty (or left at the
                // auto-filled preview), the server assigns the next free one.
                return true;
            default:
                return true;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={() => router.push(editId ? `/dashboard/invoices/${editId}` : "/dashboard/invoices")}>
                    <ArrowLeft />
                    {t("invoiceCreate.backBtn")}
                </Button>
                <h2 className="text-xl font-semibold">
                    {editId ? t("invoiceEdit.title") : t("invoiceCreate.newInvoiceTitle")}
                </h2>
                <HelpLink href="/hilfe/rechnungen-und-angebote" label="Hilfe zur Rechnungserstellung" />
            </div>

            <Steps
                current={currentStep}
                items={[
                    { title: t("invoiceCreate.stepClient") },
                    { title: t("invoiceCreate.stepPositions") },
                    { title: t("invoiceCreate.stepDetails") },
                    { title: t("invoiceCreate.stepDone") },
                ]}
            />

            {currentStep < 2 && (
                <Card className="dashboard-ai-card">
                    <CardContent className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                                <Bot className="size-[18px] text-primary" />
                                <strong className="text-sm">{t("invoiceCreate.aiQuickTitle")}</strong>
                            </span>
                            <span className="text-xs text-muted-foreground">{t("invoiceCreate.aiQuickDesc")}</span>
                        </div>
                        <div className="flex w-full items-center gap-2">
                            <Input
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") void handleAiQuickFill();
                                }}
                                placeholder={t("invoiceCreate.aiQuickPlaceholder")}
                                className="min-w-0 flex-1"
                            />
                            <Button type="button" disabled={parsingPrompt} onClick={() => void handleAiQuickFill()}>
                                {parsingPrompt ? <Loader2 className="animate-spin" /> : <Bot />}
                                {t("invoiceCreate.aiQuickBtn")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {renderStepContent()}

            {/* New client dialog */}
            <Dialog
                open={clientModalOpen}
                onOpenChange={(open) => {
                    setClientModalOpen(open);
                    if (!open) setClientValues(emptyClientValues);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("invoiceCreate.newClientTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="nc-name">{t("clients.name")}</Label>
                            <Input id="nc-name" autoFocus value={clientValues.name} onChange={(e) => setClientValues((v) => ({ ...v, name: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="nc-email">{t("clients.email")}</Label>
                            <Input id="nc-email" type="email" value={clientValues.email} onChange={(e) => setClientValues((v) => ({ ...v, email: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="nc-phone">{t("clients.phone")}</Label>
                            <Input id="nc-phone" value={clientValues.phone} onChange={(e) => setClientValues((v) => ({ ...v, phone: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="nc-address">{t("clients.address")}</Label>
                            <Input id="nc-address" value={clientValues.address_line1} onChange={(e) => setClientValues((v) => ({ ...v, address_line1: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex w-[110px] shrink-0 flex-col gap-1.5">
                                <Label htmlFor="nc-postal">{t("clients.postalCode")}</Label>
                                <Input id="nc-postal" value={clientValues.postal_code} onChange={(e) => setClientValues((v) => ({ ...v, postal_code: e.target.value }))} />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Label htmlFor="nc-city">{t("clients.city")}</Label>
                                <Input id="nc-city" value={clientValues.city} onChange={(e) => setClientValues((v) => ({ ...v, city: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("clients.country")}</Label>
                            <Select value={clientValues.country} onValueChange={(v) => setClientValues((prev) => ({ ...prev, country: v }))}>
                                <SelectTrigger aria-label={t("clients.country")}><SelectValue placeholder="Deutschland" /></SelectTrigger>
                                <SelectContent>
                                    {euCountryOptions(language, clientValues.country).map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { setClientModalOpen(false); setClientValues(emptyClientValues); }}>
                            {t("clients.cancel")}
                        </Button>
                        <Button type="button" disabled={clientSaving} onClick={() => void handleCreateClient()}>
                            {clientSaving && <Loader2 className="animate-spin" />}
                            {t("clients.create")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New product dialog */}
            <Dialog
                open={productModalOpen}
                onOpenChange={(open) => {
                    setProductModalOpen(open);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("invoiceCreate.newProductTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="np-name">{t("products.name")}</Label>
                            <Input id="np-name" autoFocus value={productValues.name} onChange={(e) => setProductValues((v) => ({ ...v, name: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="np-desc">{t("products.description")}</Label>
                            <Textarea id="np-desc" rows={2} value={productValues.description} onChange={(e) => setProductValues((v) => ({ ...v, description: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Label>{t("products.price")}</Label>
                                <DecimalInput min={0} step={0.01} precision={2} style={{ width: "100%" }} addonAfter="€" value={productValues.price}
                                    onChange={(v) => setProductValues((prev) => ({ ...prev, price: v ?? 0 }))} />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Label htmlFor="np-unit">{t("products.unit")}</Label>
                                <Input id="np-unit" value={productValues.unit_of_measure} onChange={(e) => setProductValues((v) => ({ ...v, unit_of_measure: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("products.vat")}</Label>
                            <Select value={String(productValues.tax_rate_percent)} onValueChange={(v) => setProductValues((prev) => ({ ...prev, tax_rate_percent: Number(v) }))}>
                                <SelectTrigger aria-label={t("products.vat")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {VAT_RATE_OPTIONS.map((o) => (
                                        <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
                            {t("products.cancel")}
                        </Button>
                        <Button type="button" disabled={productSaving} onClick={() => void handleCreateProduct()}>
                            {productSaving && <Loader2 className="animate-spin" />}
                            {t("products.create")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Save as template dialog */}
            <Dialog
                open={templateModalOpen}
                onOpenChange={(open) => {
                    setTemplateModalOpen(open);
                    if (!open) setTemplateName("");
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("invoiceCreate.saveAsTemplateTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="tpl-name">{t("invoiceCreate.templateName")}</Label>
                            <Input id="tpl-name" autoFocus maxLength={120} value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder={t("invoiceCreate.templateNamePlaceholder")} />
                        </div>
                        <p className="text-sm text-muted-foreground">{t("invoiceCreate.saveAsTemplateHint")}</p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { setTemplateModalOpen(false); setTemplateName(""); }}>
                            {t("clients.cancel")}
                        </Button>
                        <Button type="button" disabled={templateSaving} onClick={() => void handleSaveTemplate()}>
                            {templateSaving && <Loader2 className="animate-spin" />}
                            {t("invoiceCreate.saveAsTemplate")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {currentStep < 3 && (
                <div className="flex justify-end gap-2">
                    {currentStep > 0 && (
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                            <ArrowLeft /> {t("invoiceCreate.backBtn")}
                        </Button>
                    )}
                    {currentStep < 2 && (
                        <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                            {t("invoiceCreate.nextBtn")} <ArrowRight />
                        </Button>
                    )}
                    {currentStep === 2 && (
                        <Button type="button" onClick={() => void handleCreateInvoice()} disabled={saving || !canProceed()}>
                            {saving ? <Loader2 className="animate-spin" /> : <Check />}
                            {editId ? t("invoiceEdit.saveBtn") : t("invoiceCreate.createBtn")}
                        </Button>
                    )}
                </div>
            )}
        </div>
        </TooltipProvider>
    );
}
