"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Calendar,
    Clock,
    FileText,
    Link2,
    Loader2,
    Pencil,
    Plus,
    Settings,
    Trash2,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import dayjs, { type Dayjs } from "dayjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { del, get, patch, post } from "@/lib/termine/client";
import {
    BlockTimeModal,
    BOOKING_STATUS_COLOR,
    BookingDetailDrawer,
    bookingStatusLabel,
    ManualBookingModal,
    type UnifiedBookingRecord,
} from "@/components/termine/BookingDrawerAndModals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AppointmentRow extends Omit<UnifiedBookingRecord, "id"> {
    $id: string;
}

interface ServiceRow {
    $id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
    active: boolean;
}

interface StaffRow {
    $id: string;
    name: string;
    description?: string;
    active: boolean;
    bookable: boolean;
    serviceIds: string[];
    color?: string;
}

interface HoursRow {
    $id: string;
    kind: string;
    day?: string;
    date?: string;
    closed: boolean;
    periods: string;
    breaks: string;
}

interface BlockRow {
    $id: string;
    staffId?: string;
    startUtc: string;
    endUtc: string;
    reason?: string;
}

interface SettingsSummary {
    slug: string;
    displayName: string;
    enabled: boolean;
    published: boolean;
}

const DOW_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parsePeriods(raw: string): Array<{ start: Dayjs | null; end: Dayjs | null }> {
    try {
        const v = JSON.parse(raw || "[]");
        if (!Array.isArray(v)) return [];
        return v.map((p: { start: string; end: string }) => ({
            start: dayjs(p.start, "HH:mm"),
            end: dayjs(p.end, "HH:mm"),
        }));
    } catch {
        return [];
    }
}

export default function TermineSchedulingHubPage() {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const dow = language === "de" ? DOW_DE : DOW_EN;
    const locale = language === "de" ? "de-DE" : "en-GB";
    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState("bookings");
    const [settings, setSettings] = useState<SettingsSummary | null>(null);
    const [rows, setRows] = useState<AppointmentRow[]>([]);
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [hours, setHours] = useState<HoursRow[]>([]);
    const [blocks, setBlocks] = useState<BlockRow[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking filters & modals
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [staffFilter, setStaffFilter] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState("");
    const [day, setDay] = useState<Dayjs | null>(null);
    const [detail, setDetail] = useState<UnifiedBookingRecord | null>(null);
    const [manualOpen, setManualOpen] = useState(false);
    const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);
    const [bookingPage, setBookingPage] = useState(1);

    // Availability state
    const [weekDay, setWeekDay] = useState("1");
    const [periods, setPeriods] = useState<Array<{ start: Dayjs | null; end: Dayjs | null }>>([
        { start: dayjs("09:00", "HH:mm"), end: dayjs("18:00", "HH:mm") },
    ]);
    const [closed, setClosed] = useState(false);
    const [overrideDate, setOverrideDate] = useState<Dayjs | null>(null);
    const [blockOpen, setBlockOpen] = useState(false);

    // Staff modal state
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
    const [staffName, setStaffName] = useState("");
    const [staffDescription, setStaffDescription] = useState("");
    const [staffServiceIds, setStaffServiceIds] = useState<string[]>([]);
    const [staffColor, setStaffColor] = useState("");
    const [staffActive, setStaffActive] = useState(true);
    const [staffBookable, setStaffBookable] = useState(true);
    const [staffNameError, setStaffNameError] = useState<string | null>(null);
    const [staffSaving, setStaffSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (statusFilter) q.set("status", statusFilter);
            if (staffFilter) q.set("staffId", staffFilter);
            if (day) {
                q.set("from", day.startOf("day").toISOString());
                q.set("to", day.add(1, "day").startOf("day").toISOString());
            }
            const [stRes, a, s, st, h, b] = await Promise.all([
                get<{ settings: SettingsSummary | null }>("/api/termine/settings"),
                get<{ appointments: AppointmentRow[] }>(`/api/termine/appointments?${q.toString()}`),
                get<{ services: ServiceRow[] }>("/api/termine/services"),
                get<{ staff: StaffRow[] }>("/api/termine/staff"),
                get<{ hours: HoursRow[] }>("/api/termine/hours"),
                get<{ blocks: BlockRow[] }>("/api/termine/blocks"),
            ]);
            setSettings(stRes.settings);
            setRows(a.appointments);
            setServices(s.services);
            setStaff(st.staff);
            setHours(h.hours);
            setBlocks(b.blocks);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Laden fehlgeschlagen.", "Failed to load scheduling data."));
        } finally {
            setLoading(false);
        }
    }, [statusFilter, staffFilter, day, language]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["bookings", "availability", "staff"].includes(tab)) {
            setActiveTab(tab);
        }
        const stParam = searchParams.get("status");
        if (stParam) setStatusFilter(stParam);
        const clientId = searchParams.get("clientId");
        if (searchParams.get("action") === "neu" || clientId) {
            if (clientId) setPreselectedClientId(clientId);
            setManualOpen(true);
        }
    }, [searchParams]);

    async function saveWeek() {
        try {
            await post("/api/termine/hours", {
                kind: "week",
                day: weekDay,
                closed,
                periods: closed
                    ? []
                    : periods
                          .filter((p) => p.start && p.end)
                          .map((p) => ({ start: p.start!.format("HH:mm"), end: p.end!.format("HH:mm") })),
                breaks: [],
            });
            toast.success(l("Arbeitszeiten gespeichert.", "Working hours saved."));
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Speichern fehlgeschlagen.", "Save failed."));
        }
    }

    async function saveOverride() {
        if (!overrideDate) {
            toast.warning(l("Bitte ein Datum wählen.", "Please choose a date."));
            return;
        }
        try {
            await post("/api/termine/hours", {
                kind: "override",
                date: overrideDate.format("YYYY-MM-DD"),
                closed,
                periods: closed
                    ? []
                    : periods
                          .filter((p) => p.start && p.end)
                          .map((p) => ({ start: p.start!.format("HH:mm"), end: p.end!.format("HH:mm") })),
                breaks: [],
            });
            toast.success(l("Ausnahme gespeichert.", "Date override saved."));
            setOverrideDate(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Speichern fehlgeschlagen.", "Save failed."));
        }
    }

    function openNewStaff() {
        setEditingStaff(null);
        setStaffName("");
        setStaffDescription("");
        setStaffServiceIds(services.map((s) => s.$id));
        setStaffColor("");
        setStaffActive(true);
        setStaffBookable(true);
        setStaffNameError(null);
        setStaffModalOpen(true);
    }

    function openEditStaff(r: StaffRow) {
        setEditingStaff(r);
        setStaffName(r.name);
        setStaffDescription(r.description ?? "");
        setStaffServiceIds(r.serviceIds ?? []);
        setStaffColor(r.color ?? "");
        setStaffActive(r.active);
        setStaffBookable(r.bookable);
        setStaffNameError(null);
        setStaffModalOpen(true);
    }

    async function saveStaff() {
        if (!staffName.trim()) {
            setStaffNameError(l("Name erforderlich.", "Name required."));
            return;
        }
        setStaffNameError(null);
        setStaffSaving(true);
        try {
            const payload = {
                name: staffName,
                description: staffDescription || undefined,
                serviceIds: staffServiceIds,
                color: staffColor || undefined,
                active: staffActive,
                bookable: staffBookable,
            };
            if (editingStaff) await patch(`/api/termine/staff/${editingStaff.$id}`, payload);
            else await post("/api/termine/staff", payload);
            toast.success(l("Mitarbeiter gespeichert.", "Staff saved."));
            setStaffModalOpen(false);
            await load();
        } catch (e) {
            if (e instanceof Error) toast.error(e.message);
        } finally {
            setStaffSaving(false);
        }
    }

    const filteredBookings = rows.filter((r) => {
        if (!searchText.trim()) return true;
        const q = searchText.toLowerCase();
        return (
            r.customerName.toLowerCase().includes(q) ||
            r.customerEmail.toLowerCase().includes(q) ||
            r.serviceNameSnapshot.toLowerCase().includes(q)
        );
    });
    const bookingPageCount = Math.max(1, Math.ceil(filteredBookings.length / 20));
    const currentBookingPage = Math.min(bookingPage, bookingPageCount);
    const pagedBookings = filteredBookings.slice((currentBookingPage - 1) * 20, currentBookingPage * 20);

    const weekRows = hours.filter((h) => h.kind === "week");
    const overrideRows = hours.filter((h) => h.kind === "override");
    const staffOptions = staff.filter((s) => s.active).map((s) => ({ id: s.$id, name: s.name }));
    const serviceOptions = services
        .filter((s) => s.active)
        .map((s) => ({
            id: s.$id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            priceCents: s.priceCents,
            currency: s.currency,
        }));

    return (
        <div className="dashboard-page">
            <section className="dashboard-welcome">
                <div>
                    <div className="dashboard-eyebrow">{l("Planung & Online-Buchung", "Scheduling & Online Booking")}</div>
                    <h1>{l("Terminbuchungen & Verfügbarkeit", "Bookings & Availability")}</h1>
                    <p>
                        {l(
                            "Kundenbuchungen verwalten, Arbeitszeiten pflegen und abgeschlossene Termine direkt als Rechnung übernehmen.",
                            "Manage customer bookings, configure working hours and turn completed appointments directly into invoices.",
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/calendar">
                            <Calendar />
                            {l("Kalender öffnen", "Open calendar")}
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/products?tab=services">{l("Buchbare Leistungen", "Bookable services")}</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/settings?tab=booking">
                            <Settings />
                            {l("Buchungs-Einstellungen", "Booking settings")}
                        </Link>
                    </Button>
                    <Button
                        disabled={!settings}
                        onClick={() => {
                            setPreselectedClientId(undefined);
                            setManualOpen(true);
                        }}
                    >
                        <Plus />
                        {l("Manuelle Buchung", "New booking")}
                    </Button>
                </div>
            </section>

            {!loading && !settings && (
                <Alert className="mb-4">
                    <AlertTitle>{l("Online-Terminbuchung noch nicht aktiviert", "Online booking not yet activated")}</AlertTitle>
                    <AlertDescription>
                        {l(
                            "Aktivieren Sie Ihre Buchungs-URL in den Einstellungen — Ihre Firmendaten werden automatisch übernommen.",
                            "Activate your booking URL in Settings — your company profile will be inherited automatically.",
                        )}
                    </AlertDescription>
                    <div className="col-start-2 mt-2">
                        <Button asChild>
                            <Link href="/dashboard/settings?tab=booking">{l("Jetzt einrichten", "Set up now")}</Link>
                        </Button>
                    </div>
                </Alert>
            )}

            {settings && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge
                        className={
                            settings.enabled && settings.published
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
                                : undefined
                        }
                        variant={settings.enabled && settings.published ? "default" : "secondary"}
                    >
                        {settings.enabled && settings.published
                            ? l("Öffentliche Buchung aktiv", "Public booking live")
                            : l("Vorschau / Nicht veröffentlicht", "Draft / Unpublished")}
                    </Badge>
                    <a href={`/buchen/${settings.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        /buchen/{settings.slug} <Link2 className="size-3.5" />
                    </a>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="bookings">
                        <Calendar /> {l("Buchungen", "Bookings")} ({rows.length})
                    </TabsTrigger>
                    <TabsTrigger value="availability">
                        <Clock /> {l("Arbeitszeiten & Sperrzeiten", "Working Hours & Blocks")}
                    </TabsTrigger>
                    <TabsTrigger value="staff">
                        <Users /> {l("Mitarbeiter", "Staff")} ({staff.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bookings">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Input
                            type="search"
                            placeholder={l("Kunde oder Leistung suchen …", "Search client or service …")}
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setBookingPage(1);
                            }}
                            className="w-60"
                        />
                        <Select
                            value={statusFilter ?? "__all__"}
                            onValueChange={(v) => {
                                setStatusFilter(v === "__all__" ? undefined : v);
                                setBookingPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[190px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">{l("Alle Status", "All statuses")}</SelectItem>
                                {[
                                    "PENDING",
                                    "CONFIRMED",
                                    "COMPLETED",
                                    "CANCELLED_BY_CUSTOMER",
                                    "CANCELLED_BY_BUSINESS",
                                    "NO_SHOW",
                                ].map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {bookingStatusLabel(s, language)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {staff.length > 0 && (
                            <Select
                                value={staffFilter ?? "__all__"}
                                onValueChange={(v) => {
                                    setStaffFilter(v === "__all__" ? undefined : v);
                                    setBookingPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder={l("Mitarbeiter", "Staff")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">{l("Alle Mitarbeiter", "All staff")}</SelectItem>
                                    {staff.map((s) => (
                                        <SelectItem key={s.$id} value={s.$id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <div className="w-44">
                            <DatePicker
                                value={day}
                                onChange={(d) => {
                                    setDay(d);
                                    setBookingPage(1);
                                }}
                                format="DD.MM.YYYY"
                                placeholder={l("Tag filtern", "Filter date")}
                                allowClear
                            />
                        </div>
                    </div>

                    <Card className="dashboard-panel">
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col gap-2" aria-label={l("Lädt …", "Loading …")}>
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{l("Termin", "Date & Time")}</TableHead>
                                                <TableHead>{l("Leistung", "Service")}</TableHead>
                                                <TableHead>{l("Kunde", "Customer")}</TableHead>
                                                <TableHead>{l("Mitarbeiter", "Staff")}</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>{l("Abrechnung", "Billing")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pagedBookings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                        {l("Keine Buchungen gefunden.", "No bookings found.")}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                pagedBookings.map((r) => (
                                                    <TableRow
                                                        key={r.$id}
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            setDetail({
                                                                ...r,
                                                                id: r.$id,
                                                                staffName: staff.find((s) => s.$id === r.staffId)?.name,
                                                            })
                                                        }
                                                    >
                                                        <TableCell>
                                                            {new Date(r.startUtc).toLocaleString(locale, {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </TableCell>
                                                        <TableCell>{r.serviceNameSnapshot}</TableCell>
                                                        <TableCell>
                                                            <span>
                                                                <strong>{r.customerName}</strong>
                                                                <br />
                                                                <small className="text-muted-foreground">{r.customerEmail}</small>
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {staff.find((s) => s.$id === r.staffId)?.name ?? "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={BOOKING_STATUS_COLOR[r.status]}>
                                                                {bookingStatusLabel(r.status, language)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.linkedInvoiceId ? (
                                                                <Link
                                                                    href={`/dashboard/invoices/${r.linkedInvoiceId}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">
                                                                        <FileText /> {l("Rechnung", "Invoice")}
                                                                    </Badge>
                                                                </Link>
                                                            ) : r.status === "COMPLETED" ? (
                                                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                                                                    {l("Abrechenbar", "Ready to bill")}
                                                                </Badge>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    {bookingPageCount > 1 && (
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                {currentBookingPage} / {bookingPageCount}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={currentBookingPage <= 1}
                                                    onClick={() => setBookingPage(currentBookingPage - 1)}
                                                >
                                                    {l("Zurück", "Previous")}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={currentBookingPage >= bookingPageCount}
                                                    onClick={() => setBookingPage(currentBookingPage + 1)}
                                                >
                                                    {l("Weiter", "Next")}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="availability">
                    <Card className="dashboard-panel">
                        <CardHeader>
                            <CardTitle>{l("Regulärer Wochenplan", "Weekly schedule")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <Select value={weekDay} onValueChange={setWeekDay}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dow.map((label, i) => (
                                            <SelectItem key={i} value={String(i)}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="week-open"
                                        checked={!closed}
                                        onCheckedChange={(v) => setClosed(!v)}
                                    />
                                    <Label htmlFor="week-open">{!closed ? l("Geöffnet", "Open") : l("Geschlossen", "Closed")}</Label>
                                </div>
                            </div>
                            {!closed &&
                                periods.map((p, i) => (
                                    <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
                                        <Input
                                            type="time"
                                            className="w-32"
                                            value={p.start ? p.start.format("HH:mm") : ""}
                                            onChange={(e) => {
                                                const v = e.target.value ? dayjs(e.target.value, "HH:mm") : null;
                                                setPeriods(periods.map((x, j) => (j === i ? { ...x, start: v } : x)));
                                            }}
                                        />
                                        <span>–</span>
                                        <Input
                                            type="time"
                                            className="w-32"
                                            value={p.end ? p.end.format("HH:mm") : ""}
                                            onChange={(e) => {
                                                const v = e.target.value ? dayjs(e.target.value, "HH:mm") : null;
                                                setPeriods(periods.map((x, j) => (j === i ? { ...x, end: v } : x)));
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setPeriods(periods.filter((_, j) => j !== i))}
                                        >
                                            {l("Entfernen", "Remove")}
                                        </Button>
                                    </div>
                                ))}
                            {!closed && (
                                <div>
                                    <Button
                                        variant="outline"
                                        className="border-dashed"
                                        onClick={() =>
                                            setPeriods([
                                                ...periods,
                                                { start: dayjs("09:00", "HH:mm"), end: dayjs("18:00", "HH:mm") },
                                            ])
                                        }
                                    >
                                        {l("Zeitraum hinzufügen", "Add time window")}
                                    </Button>
                                </div>
                            )}
                            <div className="mt-4">
                                <Button onClick={() => void saveWeek()}>
                                    {l("Wochentag speichern", "Save weekday")}
                                </Button>
                            </div>
                            <div className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{l("Tag", "Day")}</TableHead>
                                            <TableHead>{l("Zeiten", "Hours")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {weekRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                                                    {l("Noch keine Wochentage gespeichert.", "No weekly hours configured yet.")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            weekRows.map((r) => (
                                                <TableRow key={r.$id}>
                                                    <TableCell>{dow[Number(r.day)]}</TableCell>
                                                    <TableCell>
                                                        {r.closed ? (
                                                            <Badge variant="secondary">{l("Geschlossen", "Closed")}</Badge>
                                                        ) : (
                                                            parsePeriods(r.periods)
                                                                .map((p) => `${p.start?.format("HH:mm")}–${p.end?.format("HH:mm")}`)
                                                                .join(", ")
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="dashboard-panel mt-[18px]">
                        <CardHeader>
                            <CardTitle>{l("Ausnahmen (Feiertage, Sonderöffnungszeiten)", "Date overrides (holidays, special hours)")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <div className="w-44">
                                    <DatePicker value={overrideDate} onChange={setOverrideDate} format="DD.MM.YYYY" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="override-open"
                                        checked={!closed}
                                        onCheckedChange={(v) => setClosed(!v)}
                                    />
                                    <Label htmlFor="override-open">{!closed ? l("Geöffnet", "Open") : l("Geschlossen", "Closed")}</Label>
                                </div>
                                <Button onClick={() => void saveOverride()}>
                                    {l("Ausnahme speichern", "Save override")}
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{l("Datum", "Date")}</TableHead>
                                        <TableHead>{l("Zeiten", "Hours")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overrideRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                                                {l("Keine Ausnahmen.", "No date overrides.")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        overrideRows.map((r) => (
                                            <TableRow key={r.$id}>
                                                <TableCell>{r.date}</TableCell>
                                                <TableCell>
                                                    {r.closed ? (
                                                        <Badge variant="secondary">{l("Geschlossen", "Closed")}</Badge>
                                                    ) : (
                                                        parsePeriods(r.periods)
                                                            .map((p) => `${p.start?.format("HH:mm")}–${p.end?.format("HH:mm")}`)
                                                            .join(", ")
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="dashboard-panel mt-[18px]">
                        <CardHeader>
                            <CardTitle>{l("Abwesenheiten & Sperrzeiten (erscheinen auch im Kalender)", "Blocked times & absences (synced to Calendar)")}</CardTitle>
                            <CardAction>
                                <Button onClick={() => setBlockOpen(true)}>
                                    <Plus />
                                    {l("Zeitraum sperren", "Block time")}
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{l("Von", "From")}</TableHead>
                                        <TableHead>{l("Bis", "Until")}</TableHead>
                                        <TableHead>{l("Mitarbeiter", "Staff")}</TableHead>
                                        <TableHead>{l("Grund", "Reason")}</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {blocks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                                                {l("Keine Sperrzeiten.", "No blocked times.")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        blocks.map((r) => (
                                            <TableRow key={r.$id}>
                                                <TableCell>{new Date(r.startUtc).toLocaleString(locale)}</TableCell>
                                                <TableCell>{new Date(r.endUtc).toLocaleString(locale)}</TableCell>
                                                <TableCell>
                                                    {staff.find((s) => s.$id === r.staffId)?.name ?? l("Alle", "All")}
                                                </TableCell>
                                                <TableCell>{r.reason}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="icon-sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        aria-label={l("Löschen", "Delete")}
                                                        onClick={async () => {
                                                            try {
                                                                await del(`/api/termine/blocks/${r.$id}`);
                                                                await load();
                                                            } catch (e) {
                                                                toast.error(
                                                                    e instanceof Error ? e.message : l("Löschen fehlgeschlagen.", "Delete failed."),
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="staff">
                    <Card className="dashboard-panel">
                        <CardHeader>
                            <CardTitle>{l("Buchbare Mitarbeiterprofile", "Bookable staff profiles")}</CardTitle>
                            <CardAction>
                                <Button onClick={openNewStaff}>
                                    <Plus />
                                    {l("Neuer Mitarbeiter", "Add staff")}
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>{l("Zugeordnete Leistungen", "Assigned services")}</TableHead>
                                            <TableHead>{l("Aktionen", "Actions")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staff.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                                                    {l("Noch keine Mitarbeiter angelegt.", "No staff profiles created yet.")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            staff.map((r) => (
                                                <TableRow key={r.$id}>
                                                    <TableCell>
                                                        <span className="flex items-center gap-2">
                                                            {r.color && (
                                                                <span
                                                                    className="inline-block size-2.5 shrink-0 rounded-full"
                                                                    style={{ background: r.color }}
                                                                />
                                                            )}
                                                            <strong>{r.name}</strong>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="flex flex-wrap gap-1">
                                                            {r.active ? (
                                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">
                                                                    {l("Aktiv", "Active")}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary">{l("Inaktiv", "Inactive")}</Badge>
                                                            )}
                                                            {r.bookable ? null : (
                                                                <Badge variant="secondary">{l("Nur intern", "Internal only")}</Badge>
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{`${r.serviceIds.length}`}</TableCell>
                                                    <TableCell>
                                                        <span className="flex gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => openEditStaff(r)}>
                                                                <Pencil />
                                                                {l("Bearbeiten", "Edit")}
                                                            </Button>
                                                            <Button
                                                                size="icon-sm"
                                                                variant="ghost"
                                                                className="text-destructive hover:text-destructive"
                                                                aria-label={l("Löschen", "Delete")}
                                                                onClick={async () => {
                                                                    try {
                                                                        await del(`/api/termine/staff/${r.$id}`);
                                                                        toast.success(l("Gelöscht.", "Deleted."));
                                                                        await load();
                                                                    } catch (e) {
                                                                        toast.error(
                                                                            e instanceof Error ? e.message : l("Löschen fehlgeschlagen.", "Delete failed."),
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 />
                                                            </Button>
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <BookingDetailDrawer
                booking={detail}
                staff={staffOptions}
                onClose={() => setDetail(null)}
                onChanged={load}
            />
            <ManualBookingModal
                open={manualOpen}
                services={serviceOptions}
                staff={staffOptions}
                initialClientId={preselectedClientId}
                onCancel={() => setManualOpen(false)}
                onCreated={load}
            />
            <BlockTimeModal
                open={blockOpen}
                staff={staffOptions}
                onCancel={() => setBlockOpen(false)}
                onCreated={load}
            />

            <Dialog open={staffModalOpen} onOpenChange={(o) => { if (!o) setStaffModalOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingStaff ? l("Mitarbeiter bearbeiten", "Edit staff") : l("Neuer Mitarbeiter", "New staff")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="staff-name">Name</Label>
                            <Input
                                id="staff-name"
                                value={staffName}
                                onChange={(e) => setStaffName(e.target.value)}
                            />
                            {staffNameError && <p className="text-sm text-destructive">{staffNameError}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="staff-description">{l("Beschreibung / Rolle", "Description / role")}</Label>
                            <Textarea
                                id="staff-description"
                                rows={2}
                                value={staffDescription}
                                onChange={(e) => setStaffDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{l("Buchbare Leistungen", "Bookable services")}</Label>
                            <p className="text-sm text-muted-foreground">
                                {l(
                                    "Leer = alle Leistungen. Zusätzliche Mitarbeiterzuordnungen an der Leistung gelten ebenfalls.",
                                    "Empty = all services. Staff restrictions on the service also apply.",
                                )}
                            </p>
                            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto rounded-md border p-3">
                                {services.map((s) => (
                                    <label key={s.$id} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={staffServiceIds.includes(s.$id)}
                                            onCheckedChange={(checked) =>
                                                setStaffServiceIds(
                                                    checked === true
                                                        ? [...staffServiceIds, s.$id]
                                                        : staffServiceIds.filter((id) => id !== s.$id),
                                                )
                                            }
                                        />
                                        <span>{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="staff-color">{l("Kalenderfarbe", "Calendar color")}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    className="w-14 shrink-0 p-1"
                                    value={staffColor || "#000000"}
                                    onChange={(e) => setStaffColor(e.target.value)}
                                />
                                <Input
                                    id="staff-color"
                                    value={staffColor}
                                    placeholder="#000000"
                                    onChange={(e) => setStaffColor(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2">
                                <Switch id="staff-active" checked={staffActive} onCheckedChange={setStaffActive} />
                                <Label htmlFor="staff-active">{l("Aktiv", "Active")}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="staff-bookable" checked={staffBookable} onCheckedChange={setStaffBookable} />
                                <Label htmlFor="staff-bookable">{l("Online buchbar", "Bookable online")}</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStaffModalOpen(false)}>
                            {l("Abbrechen", "Cancel")}
                        </Button>
                        <Button disabled={staffSaving} onClick={() => void saveStaff()}>
                            {staffSaving && <Loader2 className="animate-spin" />}
                            {l("Speichern", "Save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}




