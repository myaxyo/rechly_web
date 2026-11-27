"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft, Bot, CheckCircle2, Clock, Copy, Download, FileDown, FileText, Loader2,
    Mail, Pencil, Printer, QrCode, RotateCcw, Save, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
    getInvoiceById,
    updateInvoiceStatus,
    deleteInvoice,
} from "@/lib/invoiceService";
import { createInvoiceTemplate } from "@/lib/invoiceTemplateService";
import { getCompanyInfo } from "@/lib/companyService";
import DunningCard from "@/components/DunningCard";
import { ComplianceReportCard } from "@/components/dashboard/ComplianceReportCard";
import { runInvoiceAssistant } from "@/lib/aiService";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import { formatServicePeriod } from "@/lib/invoiceForm";
import { useLanguage } from "@/contexts/LanguageContext";
import QRCode from "qrcode";
import { buildGirocodePayload } from "@/lib/girocode";
import { downloadInvoiceWithFeedback } from "@/components/dashboard/eInvoiceDownloadModal";
import type { EInvoiceFormat } from "@/lib/eRechnung/downloadClient";
import type { InvoiceWithDetails, UserCompany } from "@/types";

export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;
    const { language, t } = useLanguage();

    const statusConfig: Record<
        string,
        { badgeClass: string; label: string; icon: React.ReactNode }
    > = {
        draft: { badgeClass: "bg-secondary text-secondary-foreground", label: t("status.draft"), icon: <Pencil className="size-3" /> },
        sent: { badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", label: t("status.sent"), icon: <Mail className="size-3" /> },
        paid: { badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", label: t("status.paid"), icon: <CheckCircle2 className="size-3" /> },
        cancelled: {
            badgeClass: "bg-secondary text-secondary-foreground",
            label: t("status.cancelled"),
            icon: <Clock className="size-3" />,
        },
    };

    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
    const [company, setCompany] = useState<UserCompany | null>(null);
    const [girocodeUrl, setGirocodeUrl] = useState<string | null>(null);
    const [draftingReminder, setDraftingReminder] = useState(false);
    const [reminderDraft, setReminderDraft] = useState("");
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateSaving, setTemplateSaving] = useState(false);
    const [downloadingFormat, setDownloadingFormat] =
        useState<EInvoiceFormat | null>(null);

    const handleDownloadEInvoice = async (format: EInvoiceFormat) => {
        if (!invoice?.id) return;
        setDownloadingFormat(format);
        try {
            await downloadInvoiceWithFeedback({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                format,
                t,
                onNavigate: (path) => router.push(path),
            });
        } finally {
            setDownloadingFormat(null);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!invoice) return;
        const name = templateName.trim();
        if (!name) {
            toast.warning(t("invoiceCreate.templateNameRequired"));
            return;
        }
        setTemplateSaving(true);
        try {
            await createInvoiceTemplate({
                name: name.slice(0, 120),
                payload: {
                    ...(invoice.client_id ? { clientId: invoice.client_id } : {}),
                    ...(invoice.notes?.trim() ? { notes: invoice.notes.trim() } : {}),
                    ...(invoice.payment_terms?.trim() ? { paymentTerms: invoice.payment_terms.trim() } : {}),
                    ...(invoice.delivery_date_start ? { deliveryDateStart: invoice.delivery_date_start } : {}),
                    ...(invoice.delivery_date_end ? { deliveryDateEnd: invoice.delivery_date_end } : {}),
                    items: invoice.items.map((item) => ({
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
            setTemplateModalOpen(false);
            setTemplateName("");
            toast.success(t("invoiceCreate.templateSaved"));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("invoiceCreate.createError"));
        } finally {
            setTemplateSaving(false);
        }
    };

    useEffect(() => {
        if (invoiceId) {
            loadInvoice();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const [data, companyData] = await Promise.all([
                getInvoiceById(invoiceId),
                getCompanyInfo(),
            ]);
            setInvoice(data);
            setCompany(companyData);

            if (
                data &&
                companyData?.bank_iban &&
                !data.correction_type &&
                data.total_gross > 0
            ) {
                const refPrefix = language === "en" ? "Invoice" : "Rechnung";
                const payload = buildGirocodePayload({
                    name: companyData.name,
                    iban: companyData.bank_iban,
                    bic: companyData.bank_bic,
                    amount: data.total_gross,
                    reference: `${refPrefix} ${data.invoice_number}`,
                });
                if (payload) {
                    try {
                        const url = await QRCode.toDataURL(payload, {
                            errorCorrectionLevel: "M",
                            margin: 1,
                            width: 200,
                        });
                        setGirocodeUrl(url);
                    } catch (err) {
                        console.error("GiroCode error:", err);
                        setGirocodeUrl(null);
                    }
                } else {
                    setGirocodeUrl(null);
                }
            } else {
                setGirocodeUrl(null);
            }
        } catch (error) {
            console.error("Error loading invoice:", error);
            toast.error(t("invoiceDetail.notFound"));
            router.push("/dashboard/invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleDraftReminder = async () => {
        if (!invoice) {
            return;
        }

        setDraftingReminder(true);
        try {
            const result = await runInvoiceAssistant({
                action: "payment_reminder",
                companyName: company?.name,
                clientName: invoice.client?.name,
                clientEmail: invoice.client?.email,
                invoiceNumber: invoice.invoice_number,
                issueDate: invoice.issue_date,
                dueDate: invoice.due_date,
                totalGross: invoice.total_gross,
                currency: "EUR",
                notes: invoice.notes,
                paymentTerms: invoice.payment_terms,
                lineItems: invoice.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_of_measure: item.unit_of_measure,
                    price: item.price,
                })),
            });
            setReminderDraft(result.content);
            setReminderModalOpen(true);
            toast.success(t("invoiceDetail.reminderCreated"));
        } catch (error) {
            console.error("Error drafting payment reminder:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("invoiceDetail.reminderError"),
            );
        } finally {
            setDraftingReminder(false);
        }
    };

    const handleShareInvoice = async () => {
        if (!invoice?.id) return;
        setShareLoading(true);
        try {
            const res = await fetch(`/api/invoices/${invoice.id}/share`, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Share failed");
            await navigator.clipboard.writeText(data.url);
            setInvoice({ ...invoice, share_token: data.token });
            toast.success(
                language === "de"
                    ? "Link kopiert: Kunde kann Rechnung ansehen und per GiroCode zahlen."
                    : "Link copied: your client can view the invoice and pay via GiroCode.",
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Share failed");
        } finally {
            setShareLoading(false);
        }
    };

    const handleRevokeShare = async () => {
        if (!invoice?.id) return;
        setShareLoading(true);
        try {
            await fetch(`/api/invoices/${invoice.id}/share`, { method: "DELETE" });
            setInvoice({ ...invoice, share_token: undefined });
            toast.success(language === "de" ? "Öffentlicher Link deaktiviert." : "Public link disabled.");
        } catch {
            toast.error("Revoke failed");
        } finally {
            setShareLoading(false);
        }
    };

    const copyReminderDraft = async () => {
        try {
            await navigator.clipboard.writeText(reminderDraft);
            toast.success(t("invoiceDetail.draftCopied"));
        } catch (error) {
            console.error("Error copying reminder draft:", error);
            toast.error(t("invoiceDetail.copyFailed"));
        }
    };

    const openReminderAsEmail = () => {
        if (!invoice?.client?.email || !reminderDraft) {
            toast.warning(t("invoiceDetail.noEmailOrDraft"));
            return;
        }

        const lines = reminderDraft.split("\n");
        const subjectLine = lines.find((line) =>
            line.toLowerCase().startsWith("betreff:"),
        );
        const subject = subjectLine
            ? subjectLine.replace(/^Betreff:\s*/i, "").trim()
            : `${t("invoiceDetail.reminderSubject")} ${invoice.invoice_number}`;
        const body = reminderDraft.replace(/^Betreff:\s*.*$/im, "").trim();

        window.open(
            `mailto:${invoice.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            "_blank",
        );
    };

    const handleStatusChange = async (
        newStatus: "draft" | "sent" | "paid" | "cancelled",
    ) => {
        if (!invoice || !invoice.id) return;

        try {
            await updateInvoiceStatus(invoice.id, newStatus);
            setInvoice({ ...invoice, status: newStatus });
            toast.success(t("invoiceDetail.statusUpdated"));
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(t("invoiceDetail.statusError"));
        }
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const handleDelete = () => setDeleteConfirmOpen(true);
    const confirmDelete = async () => {
        try {
            await deleteInvoice(invoiceId);
            toast.success(t("invoiceDetail.deleted"));
            router.push("/dashboard/invoices");
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error(t("invoiceDetail.deleteError"));
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    const [correctionLoading, setCorrectionLoading] = useState(false);
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [correctionType, setCorrectionType] = useState<
        "credit_note" | "correction"
    >("credit_note");

    const handleCreateCorrection = async () => {
        setCorrectionLoading(true);
        try {
            const res = await fetch(`/api/invoices/${invoiceId}/correction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: correctionType }),
            });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            toast.success(t("invoiceDetail.correctionCreated"));
            setCorrectionModalOpen(false);
            router.push(`/dashboard/invoices/${data.invoiceId}`);
        } catch {
            toast.error(t("invoiceDetail.correctionError"));
        } finally {
            setCorrectionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!invoice) {
        return null;
    }

    const config = statusConfig[invoice.status] || statusConfig.draft;
    const clientAddress = invoice.client
        ? `${invoice.client.address_line1}\n${invoice.client.postal_code} ${invoice.client.city}`
        : "";

    const CopyValue = ({ value, strong = false }: { value: string; strong?: boolean }) => (
        <span className="inline-flex items-center gap-1">
            <span className={strong ? "font-semibold" : undefined}>{value}</span>
            <button type="button" className="inline-flex text-muted-foreground hover:text-foreground" aria-label="Copy"
                onClick={() => void navigator.clipboard.writeText(value)}>
                <Copy className="size-3.5" />
            </button>
        </span>
    );

    const detailRows: Array<{ label: string; value: React.ReactNode }> = [
        { label: t("invoiceDetail.invoiceNumber"), value: <span className="font-semibold">{invoice.invoice_number}</span> },
        { label: t("invoiceDetail.invoiceDate"), value: formatDateGerman(invoice.issue_date) },
        { label: t("invoiceDetail.dueDate"), value: invoice.due_date ? formatDateGerman(invoice.due_date) : "-" },
        ...((invoice.delivery_date_start || invoice.delivery_date_end || invoice.delivery_date)
            ? [{ label: t("invoiceDetail.servicePeriod"), value: formatServicePeriod(invoice.delivery_date_start, invoice.delivery_date_end, invoice.delivery_date) }]
            : []),
        { label: t("invoiceDetail.currency"), value: "EUR" },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push("/dashboard/invoices")}>
                        <ArrowLeft />
                        {t("invoiceDetail.back")}
                    </Button>
                    <h2 className="text-xl font-semibold">{invoice.invoice_number}</h2>
                    <Badge className={cn("gap-1", config.badgeClass)}>
                        {config.icon}
                        {config.label}
                    </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline">{t("invoiceDetail.changeStatus")}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => void handleStatusChange("draft")}>{t("invoiceDetail.markDraft")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleStatusChange("sent")}>{t("invoiceDetail.markSent")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleStatusChange("paid")}>{t("invoiceDetail.markPaid")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleStatusChange("cancelled")}>{t("invoiceDetail.markCancelled")}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {invoice.status === "draft" && (
                        <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}>
                            <Pencil />
                            {t("invoices.edit")}
                        </Button>
                    )}
                    <Button type="button" onClick={() => router.push(`/dashboard/invoices/${invoice.id}/pdf`)}>
                        <FileDown />
                        PDF
                    </Button>
                    <Button type="button" variant="outline" disabled={downloadingFormat === "zugferd"}
                        onClick={() => void handleDownloadEInvoice("zugferd")} title={t("erechnung.zugferdTooltip")}>
                        {downloadingFormat === "zugferd" ? <Loader2 className="animate-spin" /> : <FileDown />}
                        {t("erechnung.downloadZUGFeRDBtn")}
                    </Button>
                    <Button type="button" variant="outline" disabled={downloadingFormat === "xrechnung"}
                        onClick={() => void handleDownloadEInvoice("xrechnung")} title={t("erechnung.xrechnungTooltip")}>
                        {downloadingFormat === "xrechnung" ? <Loader2 className="animate-spin" /> : <FileText />}
                        {t("erechnung.downloadXRechnungBtn")}
                    </Button>
                    <Button type="button" variant="outline"
                        onClick={() => router.push(`/dashboard/invoices/create?duplicate=${invoice.id}`)}>
                        <Copy />
                        {t("invoiceDetail.duplicateInvoice")}
                    </Button>
                    {invoice.status !== "draft" && invoice.status !== "cancelled" && (
                        invoice.share_token ? (
                            <Button type="button" variant="outline" disabled={shareLoading} onClick={() => void handleRevokeShare()}>
                                {shareLoading && <Loader2 className="animate-spin" />}
                                {language === "de" ? "Link deaktivieren" : "Disable link"}
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" disabled={shareLoading} onClick={() => void handleShareInvoice()}>
                                {shareLoading && <Loader2 className="animate-spin" />}
                                {language === "de" ? "Link teilen" : "Share link"}
                            </Button>
                        )
                    )}
                    <Button type="button" variant="outline"
                        onClick={() => {
                            setTemplateName(invoice.invoice_number);
                            setTemplateModalOpen(true);
                        }}>
                        <Save />
                        {t("invoiceDetail.saveAsTemplate")}
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleDelete}>
                        <Trash2 />
                        {t("invoiceDetail.delete")}
                    </Button>
                </div>
            </div>

            {/* Invoice Info */}
            <Card>
                <CardContent className="flex flex-wrap gap-8">
                    <div className="min-w-[250px] flex-1">
                        <p className="text-sm text-muted-foreground">{t("invoiceDetail.recipient")}</p>
                        <h3 className="mt-2 text-base font-semibold">
                            {invoice.client?.name || t("invoiceDetail.unknownClient")}
                        </h3>
                        <p className="text-sm whitespace-pre-line">{clientAddress}</p>
                        {invoice.client?.email && (
                            <p className="mt-1 text-sm text-muted-foreground">{invoice.client.email}</p>
                        )}
                    </div>
                    <div className="min-w-[250px] flex-1">
                        <dl className="flex flex-col">
                            {detailRows.map((row) => (
                                <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
                                    <dt className="text-muted-foreground">{row.label}</dt>
                                    <dd>{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
                <CardHeader><CardTitle>{t("invoiceDetail.positions")}</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("invoiceDetail.description")}</TableHead>
                                    <TableHead className="w-[100px] text-right">{t("invoiceDetail.quantity")}</TableHead>
                                    <TableHead className="w-[100px]">{t("invoiceDetail.unit")}</TableHead>
                                    <TableHead className="w-[120px] text-right">{t("invoiceDetail.unitPrice")}</TableHead>
                                    <TableHead className="w-[80px] text-right">{t("invoiceDetail.vat")}</TableHead>
                                    <TableHead className="w-[120px] text-right">{t("invoiceDetail.total")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(invoice.items || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            {t("invoiceDetail.noPositions")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (invoice.items || []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.description}
                                                {formatServicePeriod(item.service_date_start, item.service_date_end) && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {t("invoiceDetail.servicePeriod")}: {formatServicePeriod(item.service_date_start, item.service_date_end)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell>{item.unit_of_measure}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-right">{item.tax_rate_percent}%</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Separator />
                    <div className="flex flex-col items-end gap-2 text-sm">
                        <div className="flex gap-4">
                            <span className="text-muted-foreground">{t("invoiceDetail.subtotal")}:</span>
                            <span className="min-w-[100px] text-right">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-muted-foreground">{t("invoiceDetail.vat")}:</span>
                            <span className="min-w-[100px] text-right">{formatCurrency(invoice.total_vat)}</span>
                        </div>
                        <Separator className="my-1 w-56" />
                        <div className="flex gap-4 text-lg font-semibold">
                            <span>{t("invoiceDetail.totalLabel")}:</span>
                            <span className="min-w-[100px] text-right">{formatCurrency(invoice.total_gross)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
                <Card>
                    <CardHeader><CardTitle>{t("invoiceDetail.notes")}</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
                    </CardContent>
                </Card>
            )}

            {invoice.payment_terms && (
                <Card>
                    <CardHeader><CardTitle>{t("invoiceDetail.paymentTerms")}</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-line">{invoice.payment_terms}</p>
                    </CardContent>
                </Card>
            )}

            {/* Payment & GiroCode Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="size-5" />
                        {language === "en" ? "Payment Details & GiroCode" : "Zahlungsinformationen & GiroCode"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {company?.bank_iban ? (
                        <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="min-w-[260px] flex-1">
                                <dl className="flex flex-col">
                                    {company.bank_name && (
                                        <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm">
                                            <dt className="text-muted-foreground">Bank</dt>
                                            <dd><span className="font-semibold">{company.bank_name}</span></dd>
                                        </div>
                                    )}
                                    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm">
                                        <dt className="text-muted-foreground">IBAN</dt>
                                        <dd><CopyValue value={company.bank_iban} strong /></dd>
                                    </div>
                                    {company.bank_bic && (
                                        <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm">
                                            <dt className="text-muted-foreground">BIC</dt>
                                            <dd><CopyValue value={company.bank_bic} /></dd>
                                        </div>
                                    )}
                                    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm">
                                        <dt className="text-muted-foreground">{language === "en" ? "Reference" : "Verwendungszweck"}</dt>
                                        <dd><CopyValue value={language === "en" ? `Invoice ${invoice.invoice_number}` : `Rechnung ${invoice.invoice_number}`} /></dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
                                        <dt className="text-muted-foreground">{language === "en" ? "Amount" : "Betrag"}</dt>
                                        <dd className="text-base font-semibold text-primary">{formatCurrency(invoice.total_gross)}</dd>
                                    </div>
                                </dl>
                            </div>

                            {girocodeUrl && (
                                <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={girocodeUrl} alt="SEPA GiroCode" className="mx-auto mb-2 block size-[140px]" />
                                    <p className="mx-auto mb-2.5 block max-w-[180px] text-[11px] text-muted-foreground">
                                        {language === "en"
                                            ? "Scan with your banking app to prefill transfer"
                                            : "Mit Banking-App scannen & sofort überweisen"}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const a = document.createElement("a");
                                            a.href = girocodeUrl;
                                            a.download = `GiroCode_${invoice.invoice_number}.png`;
                                            a.click();
                                        }}
                                    >
                                        <Download />
                                        {language === "en" ? "Download QR" : "QR herunterladen"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Alert>
                            <AlertTitle>{language === "en" ? "No IBAN configured" : "Keine IBAN hinterlegt"}</AlertTitle>
                            <AlertDescription>
                                <span className="flex flex-col items-start gap-3">
                                    <span>
                                        {language === "en"
                                            ? "To automatically generate a GiroCode (SEPA payment QR code) on your invoices, please enter your IBAN under Settings > Bank Details."
                                            : "Um automatisch einen GiroCode (SEPA-Zahlungs-QR-Code) für diese Rechnung zu erzeugen, hinterlegen Sie bitte Ihre IBAN in den Unternehmenseinstellungen unter Bankverbindung."}
                                    </span>
                                    <Button type="button" size="sm" onClick={() => router.push("/dashboard/settings")}>
                                        {language === "en" ? "Configure IBAN" : "IBAN hinterlegen"}
                                    </Button>
                                </span>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <ComplianceReportCard
                invoiceNumber={invoice.invoice_number}
                issueDate={invoice.issue_date}
                sellerName={company?.name}
                sellerAddress={[company?.address_line1, company?.postal_code, company?.city].filter(Boolean).join(", ")}
                buyerName={invoice.client?.name}
                buyerAddress={[invoice.client?.address_line1, invoice.client?.postal_code, invoice.client?.city].filter(Boolean).join(", ")}
                sellerTaxId={company?.tax_number}
                sellerVatId={company?.vat_id}
                iban={company?.bank_iban}
                currency="EUR"
                totalGross={invoice.total_gross}
                lineCount={invoice.items?.length ?? 0}
                isSmallBusiness={Boolean(company?.is_small_business)}
                hasServicePeriod={Boolean(invoice.delivery_date || invoice.delivery_date_start || invoice.delivery_date_end)}
                hasBuyerLeitwegOrVat={Boolean(invoice.client?.leitweg_id || invoice.client?.vat_id)}
            />

            {/* Actions */}
            <Card>
                <CardHeader><CardTitle>{t("invoiceDetail.actions")}</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/invoices/${invoice.id}/pdf`)}>
                            <FileDown />
                            {t("invoiceDetail.viewPdf")}
                        </Button>
                        <Button type="button" variant="outline"
                            onClick={() => router.push(`/dashboard/invoices/${invoice.id}/pdf?print=true`)}>
                            <Printer />
                            {t("invoiceDetail.print")}
                        </Button>
                        <Button type="button" variant="outline" disabled={downloadingFormat === "zugferd"}
                            onClick={() => void handleDownloadEInvoice("zugferd")} title={t("erechnung.zugferdTooltip")}>
                            {downloadingFormat === "zugferd" ? <Loader2 className="animate-spin" /> : <FileDown />}
                            {t("erechnung.downloadZUGFeRDBtn")}
                        </Button>
                        <Button type="button" variant="outline" disabled={downloadingFormat === "xrechnung"}
                            onClick={() => void handleDownloadEInvoice("xrechnung")} title={t("erechnung.xrechnungTooltip")}>
                            {downloadingFormat === "xrechnung" ? <Loader2 className="animate-spin" /> : <FileText />}
                            {t("erechnung.downloadXRechnungBtn")}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setCorrectionModalOpen(true)} disabled={invoice.status === "draft"}>
                            <RotateCcw />
                            {t("invoiceDetail.cancelCorrection")}
                        </Button>
                        <Button type="button" variant="outline" disabled={draftingReminder} onClick={() => void handleDraftReminder()}>
                            {draftingReminder ? <Loader2 className="animate-spin" /> : <Bot />}
                            {t("invoiceDetail.aiReminder")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (invoice.client?.email) {
                                    window.open(
                                        `mailto:${invoice.client.email}?subject=${t("invoiceDetail.invoiceSubject")} ${invoice.invoice_number}`,
                                        "_blank",
                                    );
                                } else {
                                    toast.warning(t("invoiceDetail.noEmail"));
                                }
                            }}
                        >
                            <Mail />
                            {t("invoiceDetail.sendEmail")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <DunningCard invoice={invoice} company={company} />

            {/* Correction dialog */}
            <Dialog open={correctionModalOpen} onOpenChange={setCorrectionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("invoiceDetail.correctionTitle")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm">{t("invoiceDetail.correctionPrompt")}</p>
                    <RadioGroup value={correctionType} onValueChange={(v) => setCorrectionType(v as "credit_note" | "correction")} className="gap-3">
                        <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <RadioGroupItem value="credit_note" className="mt-0.5" />
                            <span><strong>{t("invoiceDetail.creditNote")}</strong> — {t("invoiceDetail.creditNoteDesc")}</span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <RadioGroupItem value="correction" className="mt-0.5" />
                            <span><strong>{t("invoiceDetail.correctionInvoice")}</strong> — {t("invoiceDetail.correctionInvoiceDesc")}</span>
                        </label>
                    </RadioGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCorrectionModalOpen(false)}>
                            {t("invoiceDetail.correctionCancel")}
                        </Button>
                        <Button type="button" disabled={correctionLoading} onClick={() => void handleCreateCorrection()}>
                            {correctionLoading && <Loader2 className="animate-spin" />}
                            {t("invoiceDetail.correctionOk")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI reminder dialog */}
            <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t("invoiceDetail.aiReminderTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap">{reminderDraft}</div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => void copyReminderDraft()}>
                            <Copy />
                            {t("invoiceDetail.copy")}
                        </Button>
                        <Button type="button" onClick={openReminderAsEmail} disabled={!invoice.client?.email}>
                            <Mail />
                            {t("invoiceDetail.openAsEmail")}
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
                        <DialogTitle>{t("invoiceDetail.saveAsTemplateTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="template-name">{t("invoiceCreate.templateNamePlaceholder")}</Label>
                        <Input
                            id="template-name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder={t("invoiceCreate.templateNamePlaceholder")}
                            maxLength={120}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") void handleSaveAsTemplate();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setTemplateModalOpen(false);
                                setTemplateName("");
                            }}
                        >
                            {t("clients.cancel")}
                        </Button>
                        <Button type="button" disabled={templateSaving} onClick={() => void handleSaveAsTemplate()}>
                            {templateSaving && <Loader2 className="animate-spin" />}
                            {t("invoiceCreate.saveAsTemplate")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("invoiceDetail.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("invoiceDetail.deleteContent")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("invoiceDetail.deleteCancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
                            {t("invoiceDetail.deleteOk")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
