"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bot, CheckCircle2, ChevronLeft, ChevronRight, Copy, EllipsisVertical, Eye, FileText,
    FileDown, Loader2, Mail, Pencil, Plus, Search, Send, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useInvoiceStore } from "@/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import { runInvoiceAssistant } from "@/lib/aiService";
import { getCompanyInfo } from "@/lib/companyService";
import { downloadInvoiceWithFeedback } from "@/components/dashboard/eInvoiceDownloadModal";
import type { InvoiceWithClient, Invoice } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const statusBadgeClass: Record<string, string> = {
    draft: "bg-secondary text-secondary-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

type SortKey = "invoice_number" | "issue_date" | "total_gross";

export default function InvoicesPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [searchText, setSearchText] = useState("");
    const [companyName, setCompanyName] = useState<string | undefined>();
    const [draftingInvoiceId, setDraftingInvoiceId] = useState<string | null>(null);
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [reminderDraft, setReminderDraft] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithClient | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortKey, setSortKey] = useState<SortKey>("issue_date");
    const [sortAsc, setSortAsc] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const statusLabels: Record<string, string> = {
        draft: t("status.draft"),
        sent: t("status.sent"),
        paid: t("status.paid"),
        cancelled: t("status.cancelled"),
    };

    const {
        invoices,
        stats,
        loading,
        fetchInvoices,
        fetchStats,
        updateStatus,
        removeInvoice,
    } = useInvoiceStore();

    const filteredInvoices = useMemo(() => {
        const filtered = invoices.filter(
            (invoice) =>
                (statusFilter === "all" || invoice.status === statusFilter) &&
                (invoice.invoice_number.toLowerCase().includes(searchText.toLowerCase()) ||
                    invoice.client?.name?.toLowerCase().includes(searchText.toLowerCase())),
        );
        const sorted = [...filtered].sort((a, b) => {
            const cmp =
                sortKey === "invoice_number"
                    ? a.invoice_number.localeCompare(b.invoice_number)
                    : sortKey === "issue_date"
                      ? new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
                      : a.total_gross - b.total_gross;
            return sortAsc ? cmp : -cmp;
        });
        return sorted;
    }, [invoices, searchText, statusFilter, sortKey, sortAsc]);

    const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
    const safePage = Math.min(page, pageCount);
    const pageInvoices = filteredInvoices.slice((safePage - 1) * pageSize, safePage * pageSize);

    useEffect(() => {
        fetchInvoices();
        fetchStats();
        void loadCompanyInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCompanyInfo = async () => {
        try {
            const company = await getCompanyInfo();
            setCompanyName(company?.name);
        } catch (error) {
            console.error("Error loading company info for AI reminder:", error);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await removeInvoice(deleteTarget);
            toast.success(t("invoices.deleted"));
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error(t("invoices.deleteError"));
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleStatusChange = async (id: string, status: Invoice["status"]) => {
        try {
            await updateStatus(id, status);
            toast.success(t("invoices.statusUpdated"));
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(t("invoices.updateError"));
        }
    };

    const handleDraftReminder = async (invoice: InvoiceWithClient) => {
        setDraftingInvoiceId(invoice.id || null);
        try {
            const result = await runInvoiceAssistant({
                action: "payment_reminder",
                companyName,
                clientName: invoice.client?.name,
                clientEmail: invoice.client?.email,
                invoiceNumber: invoice.invoice_number,
                issueDate: invoice.issue_date,
                dueDate: invoice.due_date,
                totalGross: invoice.total_gross,
                currency: "EUR",
                notes: invoice.notes,
                paymentTerms: invoice.payment_terms,
            });
            setSelectedInvoice(invoice);
            setReminderDraft(result.content);
            setReminderModalOpen(true);
            toast.success(t("invoices.aiReminderSuccess"));
        } catch (error) {
            console.error("Error drafting invoice reminder:", error);
            toast.error(error instanceof Error ? error.message : t("invoices.aiReminderError"));
        } finally {
            setDraftingInvoiceId(null);
        }
    };

    const handleCopyReminderDraft = async () => {
        try {
            await navigator.clipboard.writeText(reminderDraft);
            toast.success(t("invoices.aiCopySuccess"));
        } catch (error) {
            console.error("Error copying invoice reminder draft:", error);
            toast.error(t("invoices.aiCopyError"));
        }
    };

    const handleOpenReminderEmail = () => {
        if (!selectedInvoice?.client?.email || !reminderDraft) {
            toast.warning(t("invoices.aiEmailMissing"));
            return;
        }

        const lines = reminderDraft.split("\n");
        const subjectLine = lines.find((line) => line.toLowerCase().startsWith("betreff:"));
        const subject = subjectLine
            ? subjectLine.replace(/^Betreff:\s*/i, "").trim()
            : t("invoices.aiMailSubjectFallback");
        const body = reminderDraft.replace(/^Betreff:\s*.*$/im, "").trim();

        window.open(
            `mailto:${selectedInvoice.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            "_blank",
        );
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc((v) => !v);
        else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const statCards = [
        { label: t("invoices.total"), value: String(stats?.total ?? 0), className: "" },
        { label: t("invoices.open"), value: `${(stats?.unpaidAmount ?? 0).toFixed(2)} €`, className: "text-orange-500" },
        { label: t("status.paid"), value: `${(stats?.paidAmount ?? 0).toFixed(2)} €`, className: "text-emerald-500" },
        { label: t("dashboard.drafts"), value: String(stats?.draft ?? 0), className: "" },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-1">
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className={cn("mt-1 text-2xl font-semibold", stat.className)}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-md">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("invoices.search")}
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                        className="pl-9"
                        aria-label={t("invoices.search")}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44" aria-label={t("invoices.status")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("invoices.status")}: {t("status.draft")}/{t("status.sent")}/{t("status.paid")}</SelectItem>
                        <SelectItem value="draft">{t("status.draft")}</SelectItem>
                        <SelectItem value="sent">{t("status.sent")}</SelectItem>
                        <SelectItem value="paid">{t("status.paid")}</SelectItem>
                        <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                    </SelectContent>
                </Select>
                <div className="sm:ml-auto">
                    <Button type="button" onClick={() => router.push("/dashboard/invoices/create")} className="w-full sm:w-auto">
                        <Plus />
                        {t("invoices.new")}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <button type="button" className="font-medium hover:text-foreground" onClick={() => toggleSort("invoice_number")}>
                                        {t("invoices.number")} {sortKey === "invoice_number" ? (sortAsc ? "↑" : "↓") : ""}
                                    </button>
                                </TableHead>
                                <TableHead>{t("invoices.client")}</TableHead>
                                <TableHead>
                                    <button type="button" className="font-medium hover:text-foreground" onClick={() => toggleSort("issue_date")}>
                                        {t("invoices.date")} {sortKey === "issue_date" ? (sortAsc ? "↑" : "↓") : ""}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right">
                                    <button type="button" className="font-medium hover:text-foreground" onClick={() => toggleSort("total_gross")}>
                                        {t("invoices.amount")} {sortKey === "total_gross" ? (sortAsc ? "↑" : "↓") : ""}
                                    </button>
                                </TableHead>
                                <TableHead>{t("invoices.status")}</TableHead>
                                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && pageInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                        <Loader2 className="mr-2 inline size-4 animate-spin" />
                                        {t("invoices.search")}
                                    </TableCell>
                                </TableRow>
                            ) : pageInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                        {t("dashboard.noInvoices")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageInvoices.map((record) => (
                                    <TableRow
                                        key={record.id}
                                        className="cursor-pointer"
                                        onClick={() => router.push(`/dashboard/invoices/${record.id}`)}
                                    >
                                        <TableCell className="font-medium">{record.invoice_number}</TableCell>
                                        <TableCell>{record.client?.name || "—"}</TableCell>
                                        <TableCell>{formatDateGerman(record.issue_date)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(record.total_gross)}</TableCell>
                                        <TableCell>
                                            <Badge className={statusBadgeClass[record.status]}>{statusLabels[record.status]}</Badge>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button type="button" variant="ghost" size="icon" aria-label="Actions">
                                                        {draftingInvoiceId === record.id ? <Loader2 className="animate-spin" /> : <EllipsisVertical />}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-60">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${record.id}`)}>
                                                        <Eye />{t("invoices.view")}
                                                    </DropdownMenuItem>
                                                    {record.status === "draft" && (
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${record.id}/edit`)}>
                                                            <Pencil />{t("invoices.edit")}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${record.id}/pdf`)}>
                                                        <FileDown />{t("invoices.downloadPdf")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        if (!record.id) return;
                                                        void downloadInvoiceWithFeedback({
                                                            invoiceId: record.id,
                                                            invoiceNumber: record.invoice_number,
                                                            format: "zugferd",
                                                            t,
                                                            onNavigate: (path) => router.push(path),
                                                        });
                                                    }}>
                                                        <FileDown />{t("erechnung.downloadZUGFeRDBtn")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        if (!record.id) return;
                                                        void downloadInvoiceWithFeedback({
                                                            invoiceId: record.id,
                                                            invoiceNumber: record.invoice_number,
                                                            format: "xrechnung",
                                                            t,
                                                            onNavigate: (path) => router.push(path),
                                                        });
                                                    }}>
                                                        <FileText />{t("erechnung.downloadXRechnungBtn")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled={!record.client?.email} onClick={() => void handleDraftReminder(record)}>
                                                        <Bot />{t("invoices.aiReminder")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {record.status === "draft" && (
                                                        <DropdownMenuItem onClick={() => void handleStatusChange(record.id!, "sent")}>
                                                            <Send />{t("invoices.markSent")}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {record.status === "sent" && (
                                                        <DropdownMenuItem onClick={() => void handleStatusChange(record.id!, "paid")}>
                                                            <CheckCircle2 />{t("invoices.markPaid")}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(record.id!)}>
                                                        <Trash2 />{t("invoices.delete")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Pagination */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        {filteredInvoices.length === 0
                            ? t("invoices.pagination").replace("{0}", "0").replace("{1}", "0").replace("{2}", "0")
                            : t("invoices.pagination")
                                  .replace("{0}", String((safePage - 1) * pageSize + 1))
                                  .replace("{1}", String(Math.min(safePage * pageSize, filteredInvoices.length)))
                                  .replace("{2}", String(filteredInvoices.length))}
                    </p>
                    <div className="flex items-center gap-2">
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                            <SelectTrigger className="h-8 w-[76px]" aria-label="Page size"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50].map((size) => (
                                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" className="size-8" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm">{safePage} / {pageCount}</span>
                        <Button type="button" variant="outline" size="icon" className="size-8" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} aria-label="Next page">
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* AI reminder dialog */}
            <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t("invoices.aiReminderTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap">{reminderDraft}</div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => void handleCopyReminderDraft()}>
                            <Copy />
                            {t("invoices.aiCopy")}
                        </Button>
                        <Button type="button" onClick={handleOpenReminderEmail} disabled={!selectedInvoice?.client?.email}>
                            <Mail />
                            {t("invoices.aiOpenEmail")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("invoices.deleteConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("invoices.deleteDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("invoices.cancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
                            {t("invoices.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
