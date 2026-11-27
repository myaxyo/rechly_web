"use client";
import HelpLink from "@/components/dashboard/HelpLink";
import { EInvoiceFieldsControlled } from "@/components/dashboard/EInvoiceFields";

import { useEffect, useState } from "react";
import {
    Bot, CalendarDays, Copy, EllipsisVertical, FileText, FolderKanban, Loader2, Mail,
    Pencil, Plus, Search, ArrowLeftRight, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useClientStore } from "@/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllInvoices } from "@/lib/invoiceService";
import { splitVatId } from "@/lib/validation";
import { getCompanyInfo } from "@/lib/companyService";
import { euCountryOptions } from "@/lib/euCountries";
import { runInvoiceAssistant } from "@/lib/aiService";
import { formatCurrency } from "@/lib/currencyUtils";
import { bookingStatusLabel } from "@/components/termine/BookingDrawerAndModals";
import type {
    Client,
    ClientFormData,
    InvoiceWithClient,
    UserCompany,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const bookingBadgeClass: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    CANCELLED_BY_CUSTOMER: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    CANCELLED_BY_BUSINESS: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    NO_SHOW: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const emptyForm: ClientFormData = {
    client_type: "company",
    name: "",
    contact_person: "",
    address_line1: "",
    address_line2: "",
    postal_code: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
    vat_id: "",
    tax_number: "",
    leitweg_id: "",
};

export default function ClientsPage() {
    const { t, language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [vatCheck, setVatCheck] = useState<{
        status: "idle" | "checking" | "valid" | "invalid" | "error";
        name?: string;
    }>({ status: "idle" });
    const [values, setValues] = useState<ClientFormData>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
    const set = (patch: Partial<ClientFormData>) => setValues((v) => ({ ...v, ...patch }));

    const checkVatId = async () => {
        const vatId = values.vat_id;
        if (!vatId || !splitVatId(vatId)) {
            setVatCheck({ status: "invalid" });
            return;
        }
        try {
            setVatCheck({ status: "checking" });
            const res = await fetch("/api/validate/vat-id", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vat_id: vatId }),
            });
            if (!res.ok) throw new Error("vies_unavailable");
            const result = await res.json();
            setVatCheck({
                status: result.valid ? "valid" : "invalid",
                name: result.name,
            });
        } catch {
            setVatCheck({ status: "error" });
        }
    };
    const [searchText, setSearchText] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
    const [company, setCompany] = useState<UserCompany | null>(null);
    const [draftingClientId, setDraftingClientId] = useState<string | null>(
        null,
    );
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyDraft, setReplyDraft] = useState("");
    const [replyClient, setReplyClient] = useState<Client | null>(null);
    const [detailClientId, setDetailClientId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [clientBookings, setClientBookings] = useState<
        Array<{
            $id: string;
            customerId?: string;
            customerEmail: string;
            serviceNameSnapshot: string;
            startUtc: string;
            status: string;
            linkedInvoiceId?: string;
        }>
    >([]);
    const [clientProjects, setClientProjects] = useState<
        Array<{ id: string; name: string; client_id: string; status: string; budget: number }>
    >([]);

    // Zustand store
    const {
        clients,
        loading,
        fetchClients,
        addClient,
        editClient,
        removeClient,
    } = useClientStore();

    // Filter clients based on search
    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchText.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchText.toLowerCase()) ||
            client.city?.toLowerCase().includes(searchText.toLowerCase()),
    );

    useEffect(() => {
        const paramId = new URLSearchParams(window.location.search).get("client");
        if (paramId) setDetailClientId(paramId);
        fetchClients();
        loadReplyContext();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadReplyContext = async () => {
        try {
            const [invoiceData, companyData] = await Promise.all([
                getAllInvoices(),
                getCompanyInfo(),
            ]);
            setInvoices(invoiceData);
            setCompany(companyData);
        } catch (error) {
            console.error("Error loading client reply context:", error);
        }
        // Load bookings and projects non-blockingly for unified Client 360° view
        void fetch("/api/termine/appointments", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d?.appointments) setClientBookings(d.appointments);
            })
            .catch(() => {});
        void fetch("/api/workspace", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d?.data?.projects) setClientProjects(d.data.projects);
            })
            .catch(() => {});
    };

    const getBookingsForClient = (client: Client) => {
        const email = client.email?.trim().toLowerCase();
        return clientBookings.filter(
            (b) =>
                (client.id && b.customerId === client.id) ||
                (email && b.customerEmail?.toLowerCase() === email),
        );
    };

    const getProjectsForClient = (clientId?: string) => {
        if (!clientId) return [];
        return clientProjects.filter((p) => p.client_id === clientId);
    };

    const getInvoicesForClient = (clientId?: string) => {
        if (!clientId) return [];
        return invoices.filter((i) => i.client_id === clientId);
    };

    const getOverdueInvoicesForClient = (clientId?: string) => {
        if (!clientId) return [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return invoices
            .filter((invoice) => {
                if (invoice.client_id !== clientId || !invoice.due_date) {
                    return false;
                }

                if (
                    invoice.status === "paid" ||
                    invoice.status === "cancelled"
                ) {
                    return false;
                }

                const dueDate = new Date(invoice.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < now;
            })
            .sort((left, right) => {
                const leftDue = left.due_date
                    ? new Date(left.due_date).getTime()
                    : 0;
                const rightDue = right.due_date
                    ? new Date(right.due_date).getTime()
                    : 0;
                return leftDue - rightDue;
            });
    };

    const handleDraftOverdueReply = async (client: Client) => {
        const overdueInvoices = getOverdueInvoicesForClient(client.id);
        if (overdueInvoices.length === 0) {
            toast.warning(t("clients.aiNoOverdueInvoices"));
            return;
        }

        setDraftingClientId(client.id || null);
        try {
            const result = await runInvoiceAssistant({
                action: "overdue_client_reply",
                companyName: company?.name,
                clientName: client.name,
                clientEmail: client.email,
                currency: "EUR",
                invoices: overdueInvoices.map((invoice) => ({
                    invoiceNumber: invoice.invoice_number,
                    issueDate: invoice.issue_date,
                    dueDate: invoice.due_date,
                    totalGross: invoice.total_gross,
                    status: invoice.status,
                })),
            });
            setReplyClient(client);
            setReplyDraft(result.content);
            setReplyModalOpen(true);
            toast.success(t("clients.aiDraftSuccess"));
        } catch (error) {
            console.error("Error drafting overdue client reply:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : t("clients.aiDraftError"),
            );
        } finally {
            setDraftingClientId(null);
        }
    };

    const handleCopyReplyDraft = async () => {
        try {
            await navigator.clipboard.writeText(replyDraft);
            toast.success(t("clients.aiCopySuccess"));
        } catch (error) {
            console.error("Error copying client reply draft:", error);
            toast.error(t("clients.aiCopyError"));
        }
    };

    const handleOpenReplyEmail = () => {
        if (!replyClient?.email || !replyDraft) {
            toast.warning(t("clients.aiEmailMissing"));
            return;
        }

        const lines = replyDraft.split("\n");
        const subjectLine = lines.find((line) =>
            line.toLowerCase().startsWith("betreff:"),
        );
        const subject = subjectLine
            ? subjectLine.replace(/^Betreff:\s*/i, "").trim()
            : t("clients.aiMailSubjectFallback");
        const body = replyDraft.replace(/^Betreff:\s*.*$/im, "").trim();

        window.open(
            `mailto:${replyClient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            "_blank",
        );
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setValues(emptyForm);
        setErrors({});
        setVatCheck({ status: "idle" });
        setModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setValues({
            ...emptyForm,
            ...client,
            client_type: client.client_type || "company",
        });
        setErrors({});
        setVatCheck({ status: "idle" });
        setModalOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const nextErrors: Partial<Record<keyof ClientFormData, string>> = {};
        if (!values.name.trim()) nextErrors.name = t("clients.required");
        if (!values.address_line1.trim()) nextErrors.address_line1 = t("clients.required");
        if (!values.postal_code.trim()) nextErrors.postal_code = t("clients.required");
        if (!values.city.trim()) nextErrors.city = t("clients.required");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        setSubmitting(true);
        try {
            if (editingClient) {
                await editClient(editingClient.id!, values);
                toast.success(t("clients.updated"));
            } else {
                await addClient(values);
                toast.success(t("clients.created"));
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving client:", error);
            const errorMsg = error instanceof Error ? error.message : t("clients.saveError");
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await removeClient(id);
            toast.success(t("clients.deleted"));
        } catch (error) {
            console.error("Error deleting client:", error);
            toast.error(t("clients.deleteError"));
        }
    };

    const filteredSorted = [...filteredClients].sort((a, b) => a.name.localeCompare(b.name));
    const pageCount = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
    const safePage = Math.min(page, pageCount);
    const pageClients = filteredSorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    const fieldError = (name: keyof ClientFormData) =>
        errors[name] ? <p className="text-xs text-destructive">{errors[name]}</p> : null;

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-semibold">{t("clients.title")}</h2>
                <HelpLink href="/hilfe/erste-schritte#kunde" label="Kunden und Lieferadressen anlegen" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-md">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("clients.search")}
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                        className="pl-9"
                        aria-label={t("clients.search")}
                    />
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/migration">
                            <ArrowLeftRight />
                            {t("clients.importData")}
                        </Link>
                    </Button>
                    <Button type="button" onClick={openCreateModal}>
                        <Plus />
                        {t("clients.new")}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("clients.name")}</TableHead>
                                <TableHead className="hidden md:table-cell">{t("clients.contactPerson")}</TableHead>
                                <TableHead className="hidden sm:table-cell">{t("clients.city")}</TableHead>
                                <TableHead className="hidden lg:table-cell">{t("clients.email")}</TableHead>
                                <TableHead className="hidden xl:table-cell">{t("clients.phone")}</TableHead>
                                <TableHead className="hidden md:table-cell">{l("Aktivitäten", "Activity")}</TableHead>
                                <TableHead>{t("clients.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && pageClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        <Loader2 className="mr-2 inline size-4 animate-spin" />…
                                    </TableCell>
                                </TableRow>
                            ) : pageClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        {t("clients.title")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageClients.map((record) => {
                                    const invCount = getInvoicesForClient(record.id).length;
                                    const bkCount = getBookingsForClient(record).length;
                                    const prjCount = getProjectsForClient(record.id).length;
                                    return (
                                        <TableRow key={record.id} className="cursor-pointer" onClick={() => setDetailClientId(record.id || null)}>
                                            <TableCell className="font-medium">{record.name}</TableCell>
                                            <TableCell className="hidden md:table-cell">{record.contact_person || "—"}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{record.city || "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{record.email || "—"}</TableCell>
                                            <TableCell className="hidden xl:table-cell">{record.phone || "—"}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge className={invCount > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-secondary text-secondary-foreground"}>
                                                        <FileText className="size-3" /> {invCount}
                                                    </Badge>
                                                    {bkCount > 0 && (
                                                        <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                                                            <CalendarDays className="size-3" /> {bkCount}
                                                        </Badge>
                                                    )}
                                                    {prjCount > 0 && (
                                                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                                            <FolderKanban className="size-3" /> {prjCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-0.5">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button type="button" variant="ghost" size="icon" asChild>
                                                                <Link href={`/dashboard/termine/buchungen?clientId=${record.id}`} aria-label={l("Termin für Kunden buchen", "Book appointment for client")}>
                                                                    <CalendarDays />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{l("Termin für Kunden buchen", "Book appointment for client")}</TooltipContent>
                                                    </Tooltip>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={getOverdueInvoicesForClient(record.id).length === 0}
                                                        onClick={() => void handleDraftOverdueReply(record)}
                                                        aria-label={t("clients.aiDraftTitle")}
                                                    >
                                                        {draftingClientId === record.id ? <Loader2 className="animate-spin" /> : <Bot />}
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => openEditModal(record)} aria-label={t("clients.editTitle")}>
                                                        <Pencil />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(record.id!)}
                                                        aria-label={t("clients.delete")}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        {filteredSorted.length === 0
                            ? t("clients.pagination").replace("{0}", "0").replace("{1}", "0").replace("{2}", "0")
                            : t("clients.pagination")
                                  .replace("{0}", String((safePage - 1) * pageSize + 1))
                                  .replace("{1}", String(Math.min(safePage * pageSize, filteredSorted.length)))
                                  .replace("{2}", String(filteredSorted.length))}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((pg) => Math.max(1, pg - 1))}>‹</Button>
                        <span className="text-sm">{safePage} / {pageCount}</span>
                        <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((pg) => Math.min(pageCount, pg + 1))}>›</Button>
                    </div>
                </div>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? t("clients.editTitle") : t("clients.newTitle")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("clients.clientType")}</Label>
                            <RadioGroup
                                value={values.client_type ?? "company"}
                                onValueChange={(v) => set({ client_type: v as "company" | "person" })}
                                className="flex gap-2"
                            >
                                {([
                                    { value: "company", label: t("clients.typeCompany") },
                                    { value: "person", label: t("clients.typePerson") },
                                ] as const).map((option) => (
                                    <label
                                        key={option.value}
                                        className={cn(
                                            "flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm",
                                            (values.client_type ?? "company") === option.value && "border-primary bg-primary/5 font-medium",
                                        )}
                                    >
                                        <RadioGroupItem value={option.value} />
                                        {option.label}
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="client-name">
                                {values.client_type === "person" ? t("clients.personName") : t("clients.companyName")}
                            </Label>
                            <Input
                                id="client-name"
                                value={values.name}
                                onChange={(e) => set({ name: e.target.value })}
                                placeholder={values.client_type === "person" ? t("clients.personNamePlaceholder") : t("clients.companyName")}
                                aria-invalid={!!errors.name}
                            />
                            {fieldError("name")}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="client-contact">{t("clients.contactPerson")}</Label>
                            <Input id="client-contact" value={values.contact_person ?? ""} onChange={(e) => set({ contact_person: e.target.value })} placeholder={t("clients.contactPerson")} />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="client-address1">{t("clients.address")}</Label>
                            <Input id="client-address1" value={values.address_line1} onChange={(e) => set({ address_line1: e.target.value })} placeholder={t("clients.streetNumber")} aria-invalid={!!errors.address_line1} />
                            {fieldError("address_line1")}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="client-address2">{t("clients.addressExtra")}</Label>
                            <Input id="client-address2" value={values.address_line2 ?? ""} onChange={(e) => set({ address_line2: e.target.value })} placeholder={t("clients.addressExtra")} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client-postal">{t("clients.postalCode")}</Label>
                                <Input id="client-postal" value={values.postal_code} onChange={(e) => set({ postal_code: e.target.value })} placeholder={t("clients.postalCode")} aria-invalid={!!errors.postal_code} />
                                {fieldError("postal_code")}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client-city">{t("clients.city")}</Label>
                                <Input id="client-city" value={values.city} onChange={(e) => set({ city: e.target.value })} placeholder={t("clients.city")} aria-invalid={!!errors.city} />
                                {fieldError("city")}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>{t("clients.country")}</Label>
                            <Select value={values.country} onValueChange={(v) => set({ country: v })}>
                                <SelectTrigger aria-label={t("clients.country")}><SelectValue placeholder={t("clients.country")} /></SelectTrigger>
                                <SelectContent>
                                    {euCountryOptions(language, values.country).map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client-email">{t("clients.email")}</Label>
                                <Input id="client-email" type="email" value={values.email ?? ""} onChange={(e) => set({ email: e.target.value })} placeholder="email@example.com" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client-phone">{t("clients.phone")}</Label>
                                <Input id="client-phone" value={values.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+49 123 456789" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client-vat">{t("clients.vatId")}</Label>
                                <div className="flex gap-2">
                                    <Input id="client-vat" value={values.vat_id ?? ""} onChange={(e) => set({ vat_id: e.target.value })} placeholder="DE123456789" />
                                    <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={vatCheck.status === "checking"} onClick={() => void checkVatId()}>
                                        {vatCheck.status === "checking" && <Loader2 className="animate-spin" />}
                                        VIES
                                    </Button>
                                </div>
                                {vatCheck.status === "valid" && (
                                    <p className="text-xs text-emerald-600">✓ {t("clients.vatIdValid")}{vatCheck.name ? ` – ${vatCheck.name}` : ""}</p>
                                )}
                                {vatCheck.status === "invalid" && <p className="text-xs text-destructive">{t("clients.vatIdInvalid")}</p>}
                                {vatCheck.status === "error" && <p className="text-xs text-destructive">{t("clients.vatIdCheckFailed")}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client-tax">{t("clients.taxNumber")}</Label>
                                <Input id="client-tax" value={values.tax_number ?? ""} onChange={(e) => set({ tax_number: e.target.value })} placeholder="12/345/67890" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="client-leitweg">{t("clients.leitwegId")}</Label>
                            <Input id="client-leitweg" value={values.leitweg_id ?? ""} onChange={(e) => set({ leitweg_id: e.target.value })} placeholder={t("clients.leitwegPlaceholder")} />
                        </div>

                        <EInvoiceFieldsControlled
                            value={values.e_invoice}
                            onChange={(e_invoice) => set({ e_invoice })}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                {t("clients.cancel")}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="animate-spin" />}
                                {editingClient ? t("clients.save") : t("clients.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* AI Reply Draft Dialog */}
            <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t("clients.aiDraftTitle")}</DialogTitle>
                    </DialogHeader>
                    <Card>
                        <CardContent>
                            <p className="font-semibold">{replyClient?.name}</p>
                            <p className="text-sm text-muted-foreground">{replyClient?.email || t("clients.aiEmailMissing")}</p>
                        </CardContent>
                    </Card>
                    <div className="max-h-[50vh] overflow-y-auto text-sm whitespace-pre-wrap">{replyDraft}</div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => void handleCopyReplyDraft()}>
                            <Copy />
                            {t("clients.aiCopy")}
                        </Button>
                        <Button type="button" onClick={handleOpenReplyEmail} disabled={!replyClient?.email}>
                            <Mail />
                            {t("clients.aiOpenEmail")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("clients.deleteConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("clients.deleteDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("clients.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                if (deleteTarget) void handleDelete(deleteTarget);
                                setDeleteTarget(null);
                            }}
                        >
                            {t("clients.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Client 360° Sheet */}
            <Sheet open={!!detailClientId} onOpenChange={(open) => { if (!open) setDetailClientId(null); }}>
                <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-[520px]">
                    <SheetHeader className="p-0">
                        <SheetTitle>{l("Kundenakte 360°", "Client 360° Profile")}</SheetTitle>
                    </SheetHeader>
                    {(() => {
                        const selected = clients.find((c) => c.id === detailClientId);
                        if (!selected) return null;
                        const cInvoices = getInvoicesForClient(selected.id);
                        const cBookings = getBookingsForClient(selected);
                        const cProjects = getProjectsForClient(selected.id);
                        return (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <h3 className="text-base font-semibold">{selected.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {[selected.email, selected.phone, selected.city].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" size="sm" asChild>
                                        <Link href="/dashboard/invoices/create">
                                            <FileText />
                                            {l("Neue Rechnung", "New invoice")}
                                        </Link>
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard/termine/buchungen?clientId=${selected.id}`}>
                                            <CalendarDays />
                                            {l("Termin buchen", "Book appointment")}
                                        </Link>
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" asChild>
                                        <Link href="/dashboard/workspace">
                                            <FolderKanban />
                                            {l("Projekte & Aufgaben", "Projects & tasks")}
                                        </Link>
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(selected)}>
                                        <Pencil />
                                        {l("Stammdaten", "Edit details")}
                                    </Button>
                                </div>

                                <Separator />
                                <h4 className="text-sm font-semibold">{l("Rechnungen", "Invoices")} ({cInvoices.length})</h4>
                                {cInvoices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{l("Noch keine Rechnungen für diesen Kunden.", "No invoices for this client yet.")}</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {cInvoices.slice(0, 8).map((inv) => (
                                            <Card key={inv.id}>
                                                <CardContent className="flex items-center justify-between gap-2 py-1">
                                                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm hover:underline">
                                                        <strong>{inv.invoice_number}</strong> · {inv.issue_date}
                                                    </Link>
                                                    <span className="flex items-center gap-2">
                                                        <Badge variant="secondary">{inv.status}</Badge>
                                                        <strong className="text-sm">{formatCurrency(inv.total_gross)}</strong>
                                                    </span>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                <Separator />
                                <h4 className="text-sm font-semibold">{l("Terminbuchungen", "Appointments")} ({cBookings.length})</h4>
                                {cBookings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{l("Noch keine Terminbuchungen.", "No appointments booked yet.")}</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {cBookings.slice(0, 8).map((bk) => (
                                            <Card key={bk.$id}>
                                                <CardContent className="flex flex-wrap items-center justify-between gap-2 py-1">
                                                    <span className="text-sm">
                                                        <strong>{bk.serviceNameSnapshot}</strong> ·{" "}
                                                        {new Date(bk.startUtc).toLocaleString(language === "de" ? "de-DE" : "en-GB")}
                                                    </span>
                                                    <Badge className={bookingBadgeClass[bk.status] ?? "bg-secondary text-secondary-foreground"}>
                                                        {bookingStatusLabel(bk.status, language)}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                <Separator />
                                <h4 className="text-sm font-semibold">{l("Projekte", "Projects")} ({cProjects.length})</h4>
                                {cProjects.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{l("Noch keine Projekte zugeordnet.", "No projects assigned yet.")}</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {cProjects.map((prj) => (
                                            <Card key={prj.id}>
                                                <CardContent className="flex items-center justify-between gap-2 py-1">
                                                    <Link href="/dashboard/workspace" className="text-sm hover:underline">
                                                        <strong>{prj.name}</strong>
                                                    </Link>
                                                    <span className="flex items-center gap-2">
                                                        <Badge variant="secondary">{prj.status}</Badge>
                                                        <span className="text-sm">{formatCurrency(prj.budget)}</span>
                                                    </span>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </div>
        </TooltipProvider>
    );
}
