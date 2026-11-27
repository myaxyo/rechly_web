"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeftRight,
    Calendar,
    CheckCircle2,
    FileText,
    Loader2,
    SquareCheckBig,
    User,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import dayjs, { type Dayjs } from "dayjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { patch, post } from "@/lib/termine/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface UnifiedBookingRecord {
    id: string;
    serviceId: string;
    staffId: string;
    staffName?: string;
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerNote?: string;
    internalNote?: string;
    startUtc: string;
    endUtc: string;
    businessTimezone: string;
    durationMinutes: number;
    status: string;
    serviceNameSnapshot: string;
    servicePriceCents: number;
    currency: string;
    source?: string;
    linkedInvoiceId?: string;
}

export interface SimpleStaffOption {
    id: string;
    name: string;
}

export interface SimpleServiceOption {
    id: string;
    name: string;
    durationMinutes?: number;
    priceCents?: number;
    currency?: string;
}

interface ClientLookup {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

/** Badge className strings per booking status (semantic colors). */
export const BOOKING_STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
    CONFIRMED: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-300",
    COMPLETED: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300",
    CANCELLED_BY_CUSTOMER: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300",
    CANCELLED_BY_BUSINESS: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300",
    NO_SHOW: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
};

export function bookingStatusLabel(status: string, language: string): string {
    const de: Record<string, string> = {
        PENDING: "Anfrage offen",
        CONFIRMED: "Bestätigt",
        COMPLETED: "Abgeschlossen",
        CANCELLED_BY_CUSTOMER: "Vom Kunden storniert",
        CANCELLED_BY_BUSINESS: "Storniert",
        NO_SHOW: "Nicht erschienen",
    };
    const en: Record<string, string> = {
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        COMPLETED: "Completed",
        CANCELLED_BY_CUSTOMER: "Cancelled by customer",
        CANCELLED_BY_BUSINESS: "Cancelled",
        NO_SHOW: "No-show",
    };
    return (language === "de" ? de[status] : en[status]) ?? status;
}

function DateTimeField({
    value,
    onChange,
}: {
    value: Dayjs | null;
    onChange: (v: Dayjs | null) => void;
}) {
    return (
        <div className="flex gap-2">
            <div className="flex-1">
                <DatePicker
                    value={value}
                    format="DD.MM.YYYY"
                    onChange={(d) => {
                        if (!d) {
                            onChange(null);
                            return;
                        }
                        onChange(
                            value
                                ? d.hour(value.hour()).minute(value.minute()).second(0)
                                : d.hour(9).minute(0).second(0),
                        );
                    }}
                />
            </div>
            <Input
                type="time"
                step={900}
                className="w-32 shrink-0"
                value={value ? value.format("HH:mm") : ""}
                onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    if (Number.isNaN(h)) return;
                    const base = value ?? dayjs().startOf("day");
                    onChange(base.hour(h).minute(m || 0).second(0));
                }}
            />
        </div>
    );
}

export function BookingDetailDrawer({
    booking,
    staff = [],
    onClose,
    onChanged,
}: {
    booking: UnifiedBookingRecord | null;
    staff?: SimpleStaffOption[];
    onClose: () => void;
    onChanged: () => Promise<void> | void;
}) {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState("");
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [rescheduleWhen, setRescheduleWhen] = useState<Dayjs | null>(null);
    const [rescheduleStaffId, setRescheduleStaffId] = useState<string | undefined>(undefined);
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);

    useEffect(() => {
        setNote(booking?.internalNote ?? "");
    }, [booking]);

    async function transition(status: string) {
        if (!booking) return;
        setBusy(true);
        try {
            if (status === "CANCELLED_BY_BUSINESS") {
                await post(`/api/termine/appointments/${booking.id}/cancel`, {});
            } else {
                await patch(`/api/termine/appointments/${booking.id}`, { status });
            }
            toast.success(l("Status aktualisiert.", "Status updated."));
            await onChanged();
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Aktualisierung fehlgeschlagen.", "Update failed."));
        } finally {
            setBusy(false);
        }
    }

    async function saveNote() {
        if (!booking) return;
        setBusy(true);
        try {
            await patch(`/api/termine/appointments/${booking.id}`, { internalNote: note });
            toast.success(l("Notiz gespeichert.", "Note saved."));
            await onChanged();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Speichern fehlgeschlagen.", "Save failed."));
        } finally {
            setBusy(false);
        }
    }

    async function createInvoiceDraft() {
        if (!booking) return;
        setBusy(true);
        try {
            const res = await post<{ invoiceId: string; existed: boolean }>(
                `/api/termine/appointments/${booking.id}/invoice-draft`,
                {},
            );
            toast.success(
                res.existed
                    ? l("Rechnungsentwurf geöffnet.", "Opening existing invoice draft.")
                    : l("Rechnungsentwurf erstellt.", "Invoice draft created."),
            );
            await onChanged();
            router.push(`/dashboard/invoices/${res.invoiceId}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Entwurf fehlgeschlagen.", "Could not create invoice draft."));
        } finally {
            setBusy(false);
        }
    }

    async function createFollowUpTask() {
        if (!booking) return;
        setBusy(true);
        try {
            const due = new Date(Date.parse(booking.startUtc) + 24 * 3600 * 1000).toISOString().slice(0, 10);
            const resp = await fetch("/api/workspace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collection: "tasks",
                    action: "save",
                    record: {
                        title: `${l("Nachbereitung", "Follow-up")}: ${booking.serviceNameSnapshot} – ${booking.customerName}`,
                        project_id: "",
                        assignee: booking.staffName ?? "",
                        status: "todo",
                        priority: "normal",
                        due_date: due,
                    },
                }),
            });
            if (!resp.ok) throw new Error(l("Aufgabe konnte nicht erstellt werden.", "Could not create task."));
            toast.success(l("Folgeaufgabe in Projekten & Aufgaben angelegt.", "Follow-up task created."));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Aufgabe fehlgeschlagen.", "Task creation failed."));
        } finally {
            setBusy(false);
        }
    }

    async function submitReschedule(e: React.FormEvent) {
        e.preventDefault();
        if (!booking) return;
        if (!rescheduleWhen) {
            setRescheduleError(l("Bitte Zeitpunkt wählen.", "Select date & time."));
            return;
        }
        setRescheduleError(null);
        setBusy(true);
        try {
            await post(`/api/termine/appointments/${booking.id}/reschedule`, {
                newStartUtc: rescheduleWhen.toISOString(),
                newStaffId: rescheduleStaffId || undefined,
            });
            toast.success(l("Termin verschoben.", "Appointment rescheduled."));
            setRescheduleOpen(false);
            onClose();
            await onChanged();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : l("Umbuchung fehlgeschlagen.", "Reschedule failed."),
            );
        } finally {
            setBusy(false);
        }
    }

    const locale = language === "de" ? "de-DE" : "en-GB";
    const resolvedStaffName =
        booking?.staffName || staff.find((s) => s.id === booking?.staffId)?.name || booking?.staffId;
    const notStarted = booking ? Date.parse(booking.startUtc) > Date.now() : false;

    return (
        <>
            <Sheet open={!!booking} onOpenChange={(o) => { if (!o) onClose(); }}>
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[460px]">
                    <SheetHeader>
                        <SheetTitle>{l("Terminbuchung verwalten", "Manage booking")}</SheetTitle>
                    </SheetHeader>
                    {booking && (
                        <div className="px-4 pb-4">
                            <dl className="divide-y rounded-md border text-sm">
                                <div className="flex flex-col gap-1 px-3 py-2">
                                    <dt className="text-muted-foreground">{l("Leistung", "Service")}</dt>
                                    <dd>
                                        <strong>{booking.serviceNameSnapshot}</strong> ({booking.durationMinutes} min ·{" "}
                                        {((booking.servicePriceCents || 0) / 100).toLocaleString(locale, {
                                            style: "currency",
                                            currency: booking.currency || "EUR",
                                        })}
                                        )
                                    </dd>
                                </div>
                                <div className="flex flex-col gap-1 px-3 py-2">
                                    <dt className="text-muted-foreground">{l("Beginn", "Start")}</dt>
                                    <dd>{new Date(booking.startUtc).toLocaleString(locale)}</dd>
                                </div>
                                <div className="flex flex-col gap-1 px-3 py-2">
                                    <dt className="text-muted-foreground">{l("Ende", "End")}</dt>
                                    <dd>{new Date(booking.endUtc).toLocaleString(locale)}</dd>
                                </div>
                                {resolvedStaffName && (
                                    <div className="flex flex-col gap-1 px-3 py-2">
                                        <dt className="text-muted-foreground">{l("Mitarbeiter", "Staff")}</dt>
                                        <dd>{resolvedStaffName}</dd>
                                    </div>
                                )}
                                <div className="flex flex-col gap-1 px-3 py-2">
                                    <dt className="text-muted-foreground">{l("Kunde", "Customer")}</dt>
                                    <dd className="flex flex-col gap-0.5">
                                        <span>
                                            <strong>{booking.customerName}</strong>
                                            {booking.customerId && (
                                                <>
                                                    {" · "}
                                                    <Link
                                                        href={`/dashboard/clients?client=${booking.customerId}`}
                                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        <User className="size-3.5" /> {l("Kundenakte", "Client profile")}
                                                    </Link>
                                                </>
                                            )}
                                        </span>
                                        <a href={`mailto:${booking.customerEmail}`} className="text-primary hover:underline">
                                            {booking.customerEmail}
                                        </a>
                                        {booking.customerPhone && (
                                            <a href={`tel:${booking.customerPhone}`} className="text-primary hover:underline">
                                                {booking.customerPhone}
                                            </a>
                                        )}
                                    </dd>
                                </div>
                                {booking.customerNote && (
                                    <div className="flex flex-col gap-1 px-3 py-2">
                                        <dt className="text-muted-foreground">{l("Kundennotiz", "Customer note")}</dt>
                                        <dd>{booking.customerNote}</dd>
                                    </div>
                                )}
                                <div className="flex flex-col gap-1 px-3 py-2">
                                    <dt className="text-muted-foreground">Status</dt>
                                    <dd>
                                        <Badge className={BOOKING_STATUS_COLOR[booking.status]}>
                                            {bookingStatusLabel(booking.status, language)}
                                        </Badge>
                                    </dd>
                                </div>
                                {booking.linkedInvoiceId && (
                                    <div className="flex flex-col gap-1 px-3 py-2">
                                        <dt className="text-muted-foreground">{l("Rechnung", "Invoice")}</dt>
                                        <dd>
                                            <Link
                                                href={`/dashboard/invoices/${booking.linkedInvoiceId}`}
                                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                            >
                                                <FileText className="size-3.5" /> {l("Rechnung öffnen →", "Open invoice →")}
                                            </Link>
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            <Separator className="my-4" />
                            <Label htmlFor="booking-internal-note" className="mb-1.5 block font-semibold">
                                {l("Interne Notiz", "Internal note")}
                            </Label>
                            <Textarea
                                id="booking-internal-note"
                                rows={2}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={l("Interne Notizen zum Termin …", "Internal notes about this appointment …")}
                            />
                            <div className="mt-2">
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => void saveNote()}>
                                    {busy && <Loader2 className="animate-spin" />}
                                    {l("Notiz speichern", "Save note")}
                                </Button>
                            </div>

                            <Separator className="my-4" />
                            <div className="flex flex-wrap gap-2">
                                {booking.status === "PENDING" && (
                                    <Button disabled={busy} onClick={() => void transition("CONFIRMED")}>
                                        {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                                        {l("Bestätigen", "Confirm")}
                                    </Button>
                                )}
                                {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                                    <>
                                        <Button
                                            variant="outline"
                                            disabled={busy || notStarted}
                                            title={l("Ab Terminbeginn verfügbar", "Available once the appointment starts")}
                                            onClick={() => void transition("COMPLETED")}
                                        >
                                            {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                                            {l("Abschließen", "Mark completed")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() => {
                                                setRescheduleWhen(dayjs(booking.startUtc));
                                                setRescheduleStaffId(booking.staffId);
                                                setRescheduleError(null);
                                                setRescheduleOpen(true);
                                            }}
                                        >
                                            <ArrowLeftRight />
                                            {l("Verschieben", "Reschedule")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={busy || notStarted}
                                            title={l("Ab Terminbeginn verfügbar", "Available once the appointment starts")}
                                            onClick={() => void transition("NO_SHOW")}
                                        >
                                            {busy && <Loader2 className="animate-spin" />}
                                            {l("Nicht erschienen", "No-show")}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" disabled={busy}>
                                                    {busy ? <Loader2 className="animate-spin" /> : <XCircle />}
                                                    {l("Stornieren", "Cancel")}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {l(
                                                            "Termin stornieren und Zeitfenster wieder freigeben?",
                                                            "Cancel appointment and release the time slot?",
                                                        )}
                                                    </AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{l("Zurück", "Keep")}</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        variant="destructive"
                                                        onClick={() => void transition("CANCELLED_BY_BUSINESS")}
                                                    >
                                                        {l("Stornieren", "Cancel booking")}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                                {booking.status === "COMPLETED" && !booking.linkedInvoiceId && (
                                    <Button disabled={busy} onClick={() => void createInvoiceDraft()}>
                                        {busy ? <Loader2 className="animate-spin" /> : <FileText />}
                                        {l("Rechnungsentwurf erstellen", "Create invoice draft")}
                                    </Button>
                                )}
                                {booking.linkedInvoiceId && (
                                    <Button onClick={() => router.push(`/dashboard/invoices/${booking.linkedInvoiceId}`)}>
                                        <FileText />
                                        {l("Rechnung öffnen", "Open invoice")}
                                    </Button>
                                )}
                                <Button variant="outline" disabled={busy} onClick={() => void createFollowUpTask()}>
                                    {busy ? <Loader2 className="animate-spin" /> : <SquareCheckBig />}
                                    {l("Folgeaufgabe", "Follow-up task")}
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <Dialog
                open={rescheduleOpen}
                onOpenChange={(o) => {
                    if (!o && !busy) setRescheduleOpen(false);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{l("Termin verschieben", "Reschedule booking")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => void submitReschedule(e)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>{l("Neuer Zeitpunkt", "New date & time")}</Label>
                            <DateTimeField value={rescheduleWhen} onChange={setRescheduleWhen} />
                            {rescheduleError && <p className="text-sm text-destructive">{rescheduleError}</p>}
                        </div>
                        {staff.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                <Label>{l("Mitarbeiter", "Staff")}</Label>
                                <Select
                                    value={rescheduleStaffId ?? "__none__"}
                                    onValueChange={(v) => setRescheduleStaffId(v === "__none__" ? undefined : v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">—</SelectItem>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button type="submit" disabled={busy} className="w-full">
                            {busy && <Loader2 className="animate-spin" />}
                            {l("Neuen Termin speichern", "Save new time")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function ManualBookingModal({
    open,
    services,
    staff,
    initialClientId,
    initialDate,
    onCancel,
    onCreated,
}: {
    open: boolean;
    services: SimpleServiceOption[];
    staff: SimpleStaffOption[];
    initialClientId?: string;
    initialDate?: string;
    onCancel: () => void;
    onCreated: () => Promise<void> | void;
}) {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [clients, setClients] = useState<ClientLookup[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [serviceId, setServiceId] = useState<string | undefined>(undefined);
    const [staffId, setStaffId] = useState<string | undefined>(undefined);
    const [when, setWhen] = useState<Dayjs | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [internalNote, setInternalNote] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) return;
        setCustomerId(undefined);
        setServiceId(undefined);
        setStaffId(undefined);
        setWhen(initialDate ? dayjs(`${initialDate}T09:00`) : null);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setInternalNote("");
        setErrors({});
        void (async () => {
            try {
                const res = await fetch("/api/clients", { cache: "no-store" });
                if (!res.ok) return;
                const list = (await res.json()) as ClientLookup[];
                if (!Array.isArray(list)) return;
                setClients(list);
                if (initialClientId) {
                    const matched = list.find((c) => c.id === initialClientId);
                    if (matched) {
                        setCustomerId(matched.id);
                        setCustomerName(matched.name);
                        setCustomerEmail(matched.email || "");
                        setCustomerPhone(matched.phone || "");
                    }
                }
            } catch {
                // Non-fatal; manual entry still works
            }
        })();
    }, [open, initialClientId, initialDate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!serviceId) errs.serviceId = l("Bitte Leistung wählen.", "Select a service.");
        if (!when) errs.when = l("Bitte Zeitpunkt wählen.", "Select date & time.");
        if (!customerName.trim()) errs.customerName = l("Name erforderlich.", "Name required.");
        if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
            errs.customerEmail = l("Gültige E-Mail erforderlich.", "Valid email required.");
        }
        setErrors(errs);
        if (Object.keys(errs).length > 0 || !serviceId || !when) return;
        setSubmitting(true);
        try {
            await post("/api/termine/appointments", {
                serviceId,
                staffId: staffId || undefined,
                customerId: customerId || undefined,
                startUtc: when.toISOString(),
                customerName,
                customerEmail,
                customerPhone: customerPhone || undefined,
                internalNote: internalNote || undefined,
            });
            toast.success(l("Termin gebucht.", "Appointment booked."));
            setCustomerId(undefined);
            setServiceId(undefined);
            setStaffId(undefined);
            setWhen(null);
            setCustomerName("");
            setCustomerEmail("");
            setCustomerPhone("");
            setInternalNote("");
            setErrors({});
            onCancel();
            await onCreated();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : l("Buchung fehlgeschlagen.", "Booking failed."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="size-5" />
                        <span>{l("Kundentermin buchen", "Book customer appointment")}</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>{l("Vorhandenen Kunden auswählen (optional)", "Select existing client (optional)")}</Label>
                        <Select
                            value={customerId ?? "__none__"}
                            onValueChange={(id) => {
                                if (id === "__none__") {
                                    setCustomerId(undefined);
                                    return;
                                }
                                setCustomerId(id);
                                const matched = clients.find((c) => c.id === id);
                                if (matched) {
                                    setCustomerName(matched.name);
                                    setCustomerEmail(matched.email || customerEmail || "");
                                    setCustomerPhone(matched.phone || customerPhone || "");
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={l("Aus Kundenstamm übernehmen …", "Pick from Clients …")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">—</SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {`${c.name}${c.email ? ` (${c.email})` : ""}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>{l("Buchbare Leistung", "Bookable service")}</Label>
                        <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {`${s.name}${s.durationMinutes ? ` (${s.durationMinutes} min)` : ""}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>{l("Mitarbeiter (optional)", "Staff (optional)")}</Label>
                        <Select
                            value={staffId ?? "__none__"}
                            onValueChange={(v) => setStaffId(v === "__none__" ? undefined : v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">—</SelectItem>
                                {staff.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>{l("Datum & Uhrzeit", "Date & time")}</Label>
                        <DateTimeField value={when} onChange={setWhen} />
                        {errors.when && <p className="text-sm text-destructive">{errors.when}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="manual-customer-name">{l("Kundenname", "Customer name")}</Label>
                        <Input
                            id="manual-customer-name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                        {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="manual-customer-email">{l("E-Mail", "Email")}</Label>
                        <Input
                            id="manual-customer-email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                        {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="manual-customer-phone">{l("Telefon (optional)", "Phone (optional)")}</Label>
                        <Input
                            id="manual-customer-phone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="manual-internal-note">{l("Interne Notiz", "Internal note")}</Label>
                        <Textarea
                            id="manual-internal-note"
                            rows={2}
                            value={internalNote}
                            onChange={(e) => setInternalNote(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting && <Loader2 className="animate-spin" />}
                        {l("Termin verbindlich buchen", "Book appointment")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function BlockTimeModal({
    open,
    staff,
    initialDate,
    onCancel,
    onCreated,
}: {
    open: boolean;
    staff: SimpleStaffOption[];
    initialDate?: string;
    onCancel: () => void;
    onCreated: () => Promise<void> | void;
}) {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [submitting, setSubmitting] = useState(false);
    const [staffId, setStaffId] = useState<string | undefined>(undefined);
    const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setStaffId(undefined);
        setRange(
            initialDate
                ? [dayjs(`${initialDate}T09:00`), dayjs(`${initialDate}T17:00`)]
                : null,
        );
        setReason("");
        setError(null);
    }, [open, initialDate]);

    function withTime(index: 0 | 1, time: string) {
        const [h, m] = time.split(":").map(Number);
        if (Number.isNaN(h)) return;
        setRange((prev) => {
            const start = prev?.[0] ?? null;
            const end = prev?.[1] ?? null;
            const base = (index === 0 ? start : end) ?? dayjs().startOf("day");
            const next = base.hour(h).minute(m || 0).second(0);
            return index === 0 ? [next, end] : [start, next];
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!range?.[0] || !range?.[1]) {
            setError(l("Bitte Zeitraum wählen.", "Select a time range."));
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await post("/api/termine/blocks", {
                staffId: staffId ?? null,
                startUtc: range[0].toISOString(),
                endUtc: range[1].toISOString(),
                reason,
            });
            toast.success(l("Sperrzeit gespeichert.", "Blocked time saved."));
            setStaffId(undefined);
            setRange(null);
            setReason("");
            onCancel();
            await onCreated();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : l("Speichern fehlgeschlagen.", "Save failed."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{l("Zeitraum für Online-Buchung sperren", "Block time for online booking")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>{l("Mitarbeiter (leer = gesamtes Unternehmen)", "Staff (empty = entire business)")}</Label>
                        <Select
                            value={staffId ?? "__none__"}
                            onValueChange={(v) => setStaffId(v === "__none__" ? undefined : v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">—</SelectItem>
                                {staff.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>{l("Zeitraum", "Time range")}</Label>
                        <DateRangePicker
                            value={range}
                            format="DD.MM.YYYY"
                            onChange={(r) => {
                                if (!r) {
                                    setRange(null);
                                    return;
                                }
                                const [s, en] = r;
                                setRange([
                                    s ? s.hour(range?.[0]?.hour() ?? 9).minute(range?.[0]?.minute() ?? 0).second(0) : null,
                                    en ? en.hour(range?.[1]?.hour() ?? 17).minute(range?.[1]?.minute() ?? 0).second(0) : null,
                                ]);
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <Input
                                type="time"
                                step={900}
                                className="w-32"
                                aria-label={l("Startzeit", "Start time")}
                                value={range?.[0] ? range[0].format("HH:mm") : ""}
                                onChange={(e) => withTime(0, e.target.value)}
                            />
                            <span>–</span>
                            <Input
                                type="time"
                                step={900}
                                className="w-32"
                                aria-label={l("Endzeit", "End time")}
                                value={range?.[1] ? range[1].format("HH:mm") : ""}
                                onChange={(e) => withTime(1, e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="block-reason">{l("Grund (z. B. Urlaub, Pause, Außentermin)", "Reason (e.g. vacation, break)")}</Label>
                        <Input
                            id="block-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting && <Loader2 className="animate-spin" />}
                        {l("Zeitraum sperren", "Block time")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}




