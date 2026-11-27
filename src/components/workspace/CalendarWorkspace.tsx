"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DecimalInput from "@/components/DecimalInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { CalendarEvent, Occurrence } from "@/lib/workspace/calendar";
import type { CalendarBlockItem, CalendarBookingItem } from "@/lib/workspace/calendar-service";
import { useAuth } from "@/contexts/AuthContext";
import {
    BlockTimeModal,
    BookingDetailDrawer,
    bookingStatusLabel,
    ManualBookingModal,
    type SimpleServiceOption,
    type SimpleStaffOption,
    type UnifiedBookingRecord,
} from "@/components/termine/BookingDrawerAndModals";
import { addDays, localDay, useResource, useWords, WorkspaceFrame } from "./common";
import styles from "./calendar.module.css";

interface Deadline {
    id: string;
    date: string;
    title: string;
    href: string;
    kind: string;
}

export interface CalendarSnapshot {
    events: CalendarEvent[];
    items: Occurrence[];
    deadlines: Deadline[];
    bookings?: CalendarBookingItem[];
    blocks?: CalendarBlockItem[];
    staff?: Array<SimpleStaffOption & { color?: string; active: boolean; bookable: boolean; serviceIds: string[] }>;
    services?: Array<SimpleServiceOption & { active: boolean; staffIds: string[] }>;
    termineConfigured?: boolean;
    termineTimezone?: string;
}

type EventValues = { title: string; start: string; end: string; allDay: boolean; category: string; location: string; notes: string; repeat: string; interval: number | null; until: string; reminder: number };
const emptyEvent: EventValues = { title: "", start: "", end: "", allDay: false, category: "work", location: "", notes: "", repeat: "none", interval: 1, until: "", reminder: -1 };

function weekStart(day: string) {
    return addDays(day, -((new Date(day + "T12:00").getDay() + 6) % 7));
}

export default function CalendarWorkspace() {
    const { l, language } = useWords(),
        { user } = useAuth();
    const [cursor, setCursor] = useState(localDay),
        [mode, setMode] = useState("month"),
        [search, setSearch] = useState("");
    const [categories, setCategories] = useState(["work", "personal", "deadline"]),
        [deadlines, setDeadlines] = useState(true),
        [showBookings, setShowBookings] = useState(true),
        [staffFilter, setStaffFilter] = useState<string>("");
    const [editing, setEditing] = useState<Partial<CalendarEvent> | null>(null),
        [occurrence, setOccurrence] = useState("");
    const [selectedBooking, setSelectedBooking] = useState<UnifiedBookingRecord | null>(null);
    const [manualBookingOpen, setManualBookingOpen] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);
    const [dirty, setDirty] = useState(false),
        [error, setError] = useState("");
    const [values, setValues] = useState<EventValues>(emptyEvent);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [discardOpen, setDiscardOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<"series" | "occurrence" | null>(null);
    const [source, setSource] = useState(""),
        [preview, setPreview] = useState<{ count: number; skipped: number; titles: string[] } | null>(null),
        [importing, setImporting] = useState(false),
        [importMessage, setImportMessage] = useState("");
    const [reminders, setReminders] = useState(false),
        [zone, setZone] = useState("");
    const file = useRef<HTMLInputElement>(null);
    const allDay = values.allDay,
        repeat = values.repeat;
    const set = (patch: Partial<EventValues>) => { setValues(v => ({ ...v, ...patch })); setDirty(true); };
    const start = mode === "month" ? weekStart(cursor.slice(0, 7) + "-01") : mode === "week" ? weekStart(cursor) : cursor;
    const count = mode === "month" ? 42 : mode === "week" ? 7 : mode === "agenda" ? 30 : 1;
    const days = Array.from({ length: count }, (_, i) => addDays(start, i));
    const resource = useResource<CalendarSnapshot>(
            `/api/workspace/calendar?from=${start}T00:00&to=${addDays(start, count)}T00:00`,
        ),
        { data, busy } = resource;

    const labels: Record<string, string> = {
        work: l("Geschäftlich", "Work"),
        personal: l("Privat", "Personal"),
        deadline: l("Fristen", "Deadlines"),
        none: l("Keine", "None"),
        daily: l("Täglich", "Daily"),
        weekly: l("Wöchentlich", "Weekly"),
        monthly: l("Monatlich", "Monthly"),
        yearly: l("Jährlich", "Yearly"),
    };
    const reqMsg = l("Bitte ausfüllen.", "Required.");

    useEffect(() => {
        setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        setReminders(localStorage.getItem(`rechly-reminders:${user?.$id}`) === "1");
        const requested = new URLSearchParams(window.location.search).get("date");
        if (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && !Number.isNaN(Date.parse(requested)))
            setCursor(requested);
    }, [user?.$id]);

    useEffect(() => {
        if (!dirty) return;
        const prevent = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", prevent);
        return () => window.removeEventListener("beforeunload", prevent);
    }, [dirty]);

    function changeDate(direction: number) {
        if (mode === "month") {
            const d = new Date(cursor.slice(0, 7) + "-01T12:00");
            d.setMonth(d.getMonth() + direction);
            setCursor(localDay(d));
        } else setCursor(addDays(cursor, direction * (mode === "week" ? 7 : mode === "agenda" ? 30 : 1)));
    }

    function open(event?: CalendarEvent, day = cursor, occurrenceDate = "") {
        setError("");
        setDirty(false);
        setFieldErrors({});
        setEditing(event || {});
        setOccurrence(occurrenceDate);
        setValues(
            event
                ? {
                      title: event.title, category: event.category, location: event.location, notes: event.notes, repeat: event.repeat, interval: event.interval, until: event.until, reminder: event.reminder, allDay: event.allDay,
                      start: event.allDay ? event.start.slice(0, 10) : event.start,
                      end: event.allDay ? addDays(event.end.slice(0, 10), -1) : event.end,
                  }
                : {
                      ...emptyEvent,
                      title: "",
                      start: day + "T09:00",
                      end: day + "T10:00",
                      allDay: false,
                      category: "work",
                      location: "",
                      notes: "",
                      repeat: "none",
                      interval: 1,
                      until: "",
                      reminder: -1,
                  },
        );
    }

    function close() {
        if (busy) return;
        if (dirty) setDiscardOpen(true);
        else setEditing(null);
    }

    function validate() { const e: Record<string, string> = {}; if (!values.title.trim()) e.title = reqMsg; if (!values.start) e.start = reqMsg; if (!values.end) e.end = reqMsg; if (!values.category) e.category = reqMsg; if (values.interval === null || values.interval === undefined) e.interval = reqMsg; setFieldErrors(e); return !Object.keys(e).length; }

    async function save() {
        if (!validate()) return;
        const vals: Record<string, unknown> = { ...values };
        try {
            const startVal = String(vals.start),
                endVal = String(vals.end);
            if (!vals.allDay) {
                for (const value of [startVal, endVal]) {
                    const d = new Date(value);
                    const roundtrip =
                        localDay(d) +
                        `T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                    if (roundtrip !== value)
                        throw new Error(
                            l(
                                "Diese lokale Uhrzeit existiert wegen der Zeitumstellung nicht.",
                                "This local time does not exist due to a daylight-saving transition.",
                            ),
                        );
                }
            }
            await resource.mutate({
                ...vals,
                start: vals.allDay ? startVal.slice(0, 10) + "T00:00" : startVal,
                end: vals.allDay ? addDays(endVal.slice(0, 10), 1) + "T00:00" : endVal,
                action: "save",
                ...(editing?.id ? { id: editing.id, updated_at: editing.updated_at } : {}),
            });
            setEditing(null);
            setDirty(false);
        } catch (error) {
            setError((error as Error).message);
        }
    }

    async function remove(one = false) {
        try {
            await resource.mutate({
                action: "delete",
                id: editing!.id,
                updated_at: editing!.updated_at,
                ...(one ? { occurrence } : {}),
            });
            setEditing(null);
            setDirty(false);
        } catch (error) {
            setError((error as Error).message);
        }
    }

    const q = search.toLocaleLowerCase();
    const matches = (e: Occurrence) =>
        categories.includes(e.category) && [e.title, e.location, e.notes].join(" ").toLocaleLowerCase().includes(q);
    const matchesBooking = (b: CalendarBookingItem) =>
        showBookings &&
        (!staffFilter || b.staffId === staffFilter) &&
        [b.customerName, b.customerEmail, b.serviceNameSnapshot, b.staffName].join(" ").toLocaleLowerCase().includes(q);
    const matchesBlock = (b: CalendarBlockItem) =>
        showBookings &&
        (!staffFilter || !b.staffId || b.staffId === staffFilter) &&
        [b.reason || "", b.staffName || ""].join(" ").toLocaleLowerCase().includes(q);

    function events(day: string) {
        return (data?.items || []).filter(
            (e) => matches(e) && e.occurrenceStart < addDays(day, 1) + "T00:00" && e.occurrenceEnd > day + "T00:00",
        );
    }
    function dayBookings(day: string) {
        return (data?.bookings || []).filter(
            (b) => matchesBooking(b) && b.wallStart < addDays(day, 1) + "T00:00" && b.wallEnd > day + "T00:00",
        );
    }
    function dayBlocks(day: string) {
        return (data?.blocks || []).filter(
            (b) => matchesBlock(b) && b.wallStart < addDays(day, 1) + "T00:00" && b.wallEnd > day + "T00:00",
        );
    }
    function due(day: string) {
        return deadlines && categories.includes("deadline")
            ? (data?.deadlines || []).filter((d) => d.date === day && d.title.toLocaleLowerCase().includes(q))
            : [];
    }

    function eventButton(event: Occurrence) {
        return (
            <button
                key={event.id + event.occurrenceStart}
                className={`${styles.event} ${styles[event.category] || ""}`}
                title={`${event.title} · ${event.location}`}
                onClick={() =>
                    open(
                        data?.events.find((e) => e.id === event.id),
                        event.occurrenceStart.slice(0, 10),
                        event.occurrenceStart.slice(0, 10),
                    )
                }
            >
                {!event.allDay && `${event.occurrenceStart.slice(11)} `}
                {event.title}
                {event.repeat !== "none" && " ↻"}
            </button>
        );
    }

    function bookingButton(booking: CalendarBookingItem) {
        const isPending = booking.status === "PENDING";
        return (
            <button
                key={"booking:" + booking.id}
                className={`${styles.event} ${isPending ? styles.bookingPending : styles.booking}`}
                style={booking.staffColor ? { borderLeftColor: booking.staffColor } : undefined}
                title={`${booking.wallStart.slice(11)} · ${booking.customerName} (${booking.serviceNameSnapshot}) · ${bookingStatusLabel(booking.status, language)}`}
                onClick={() => setSelectedBooking(booking)}
            >
                {booking.wallStart.slice(11)} {booking.customerName} · {booking.serviceNameSnapshot}
                {booking.staffName ? ` (${booking.staffName})` : ""}
            </button>
        );
    }

    function blockChip(block: CalendarBlockItem) {
        return (
            <div
                key={"block:" + block.id}
                className={`${styles.event} ${styles.block}`}
                title={`${l("Gesperrt", "Blocked")}: ${block.reason || l("Sperrzeit", "Blocked time")}`}
            >
                ⊘ {block.wallStart.slice(11)}–{block.wallEnd.slice(11)}{" "}
                {block.reason || l("Sperrzeit", "Blocked")}
                {block.staffName ? ` (${block.staffName})` : ""}
            </div>
        );
    }

    function links(day: string) {
        return due(day).map((d) => (
            <Link className={`${styles.event} ${styles.deadline}`} key={d.id} href={d.href}>
                {d.kind === "invoice" ? l("Rechnung: ", "Invoice: ") : "☑ "}
                {d.title}
            </Link>
        ));
    }

    const dateLabel = (day: string) =>
        new Date(day + "T12:00").toLocaleDateString(language === "de" ? "de-DE" : "en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });

    async function chooseFile(selected?: File) {
        if (!selected) return;
        setImportMessage("");
        setImporting(true);
        try {
            if (selected.size > 5 * 1024 * 1024) throw new Error(l("Maximal 5 MB.", "Maximum 5 MB."));
            const textSource = await selected.text();
            const response = await fetch("/api/workspace/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "preview", source: textSource, timeZone: zone }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setSource(textSource);
            setPreview(result.result);
        } catch (error) {
            setImportMessage((error as Error).message);
        } finally {
            setImporting(false);
            if (file.current) file.current.value = "";
        }
    }

    async function toggleReminders() {
        const next = !reminders;
        if (next && "Notification" in window && Notification.permission === "default")
            await Notification.requestPermission();
        localStorage.setItem(`rechly-reminders:${user?.$id}`, next ? "1" : "0");
        setReminders(next);
        window.dispatchEvent(new Event("rechly-workspace-change"));
    }

    const activeServices = (data?.services || []).filter((s) => s.active);
    const activeStaff = (data?.staff || []).filter((s) => s.active);
    const pendingBookingsCount = (data?.bookings || []).filter((b) => b.status === "PENDING").length;
    const modeOptions = [
        { value: "month", label: l("Monat", "Month") },
        { value: "week", label: l("Woche", "Week") },
        { value: "day", label: l("Tag", "Day") },
        { value: "agenda", label: "Agenda" },
    ];

    return (
        <WorkspaceFrame
            title={l("Kalender & Termine", "Calendar & Scheduling")}
            description={
                l(
                    "Alle Termine, Online-Kundenbuchungen, Sperrzeiten, Aufgabenfristen und fälligen Rechnungen in einem zentralen Kalender.",
                    "All events, online customer bookings, blocked times, task deadlines and invoice due dates in one unified calendar.",
                ) + (zone ? ` (${zone})` : "")
            }
            error={resource.error}
            retry={resource.load}
        >
            <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{l("Änderungen verwerfen?", "Discard changes?")}</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{l("Weiter bearbeiten", "Keep editing")}</AlertDialogCancel><AlertDialogAction onClick={() => { setDiscardOpen(false); setEditing(null); setDirty(false); }}>{l("Verwerfen", "Discard")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{deleteTarget === "occurrence" ? l("Nur dieses Vorkommen löschen?", "Delete this occurrence only?") : l("Termin / gesamte Serie löschen?", "Delete event / entire series?")}</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{l("Abbrechen", "Cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => { const t = deleteTarget; setDeleteTarget(null); void remove(t === "occurrence"); }}>{l("Löschen", "Delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <input ref={file} type="file" accept=".ics,text/calendar" hidden onChange={(e) => chooseFile(e.target.files?.[0])} />
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button disabled={!data || busy} onClick={() => open()}>
                    {l("Termin anlegen", "New event")}
                </Button>
                {data?.termineConfigured && activeServices.length > 0 && (
                    <Button variant="outline" disabled={busy} onClick={() => setManualBookingOpen(true)}>
                        {l("Kundentermin buchen", "Book customer appointment")}
                    </Button>
                )}
                {data?.termineConfigured && (
                    <Button variant="outline" disabled={busy} onClick={() => setBlockOpen(true)}>
                        {l("Sperrzeit eintragen", "Block time")}
                    </Button>
                )}
                <Button variant="outline" onClick={() => file.current?.click()} disabled={importing || busy}>
                    {importing && <Loader2 className="animate-spin" />}{l("ICS importieren", "Import ICS")}
                </Button>
                <Button asChild variant="outline"><a href="/api/workspace/calendar?export=1" aria-disabled={!data}>{l("ICS exportieren", "Export ICS")}</a></Button>
                <Button variant="outline" onClick={toggleReminders}>
                    {reminders ? l("Erinnerungen ausschalten", "Turn reminders off") : l("Erinnerungen einschalten", "Enable reminders")}
                </Button>
                <Link href="/dashboard/termine/buchungen" className="text-primary hover:underline">
                    {l("Buchungen & Arbeitszeiten →", "Bookings & hours →")}
                </Link>
                {pendingBookingsCount > 0 && (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        {pendingBookingsCount} {l("offene Buchungsanfrage(n)", "pending booking request(s)")}
                    </Badge>
                )}
            </div>
            {reminders && (
                <Alert className="mb-4">
                    <AlertTitle>{l(
                        "Erinnerungen erscheinen, solange Rechly in diesem Browser geöffnet ist. Systemmeldungen benötigen zusätzlich die Browser-Erlaubnis.",
                        "Reminders appear while Rechly is open in this browser. System notifications also require browser permission.",
                    )}</AlertTitle>
                </Alert>
            )}
            {importMessage && (
                <Alert className="mb-4">
                    <AlertTitle>{importMessage}</AlertTitle>
                    <button type="button" aria-label="×" className="absolute top-2 right-2 text-muted-foreground" onClick={() => setImportMessage("")}>×</button>
                </Alert>
            )}
            <Card><CardContent className="p-4">
                {resource.loading && !data ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Button variant="outline" aria-label={l("Vorheriger Zeitraum", "Previous period")} onClick={() => changeDate(-1)}>
                        ←
                    </Button>
                    <Button variant="outline" onClick={() => setCursor(localDay())}>{l("Heute", "Today")}</Button>
                    <Button variant="outline" aria-label={l("Nächster Zeitraum", "Next period")} onClick={() => changeDate(1)}>
                        →
                    </Button>
                    <Input
                        type="date"
                        aria-label={l("Kalenderdatum", "Calendar date")}
                        value={cursor}
                        onChange={(e) => e.target.value && setCursor(e.target.value)}
                        style={{ width: 150 }}
                    />
                    <div className="inline-flex rounded-md bg-muted p-1">{modeOptions.map(o => <button key={o.value} type="button" aria-pressed={mode === o.value} className={mode === o.value ? "rounded-sm bg-background px-3 py-1 text-sm shadow" : "px-3 py-1 text-sm"} onClick={() => setMode(o.value)}>{o.label}</button>)}</div>
                </div>
                <div className="mb-5 flex flex-wrap items-center gap-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={l("Termine suchen", "Search events")}
                        aria-label={l("Termine suchen", "Search events")}
                        style={{ width: 220 }}
                    />
                    <div className="flex flex-wrap items-center gap-3">{["work", "personal", "deadline"].map((value) => <span key={value} className="flex items-center gap-1.5"><Checkbox id={`cat-${value}`} checked={categories.includes(value)} onCheckedChange={(checked) => setCategories(checked ? [...categories, value] : categories.filter(c => c !== value))} /><Label htmlFor={`cat-${value}`}>{labels[value]}</Label></span>)}</div>
                    <span className="flex items-center gap-1.5"><Checkbox id="show-bookings" checked={showBookings} onCheckedChange={(c) => setShowBookings(c === true)} /><Label htmlFor="show-bookings">{l("Kundenbuchungen", "Customer bookings")}</Label></span>
                    <span className="flex items-center gap-1.5"><Checkbox id="show-deadlines" checked={deadlines} onCheckedChange={(c) => setDeadlines(c === true)} /><Label htmlFor="show-deadlines">{l("Aufgaben & Rechnungen", "Tasks & invoices")}</Label></span>
                    {activeStaff.length > 0 && (
                        <Select
                            value={staffFilter || "__all"}
                            onValueChange={(v) => setStaffFilter(v === "__all" ? "" : v)}
                        ><SelectTrigger style={{ minWidth: 160 }}><SelectValue placeholder={l("Alle Mitarbeiter", "All staff")} /></SelectTrigger><SelectContent><SelectItem value="__all">{l("Alle Mitarbeiter", "All staff")}</SelectItem>{activeStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                    )}
                </div>
                {mode === "month" ? (
                    <div className={styles.month}>
                        {Array.from({ length: 7 }, (_, i) => (
                            <div key={i} className={styles.weekday}>
                                {new Date(addDays("2026-11-02", i) + "T12:00").toLocaleDateString(
                                    language === "de" ? "de-DE" : "en-GB",
                                    { weekday: "short" },
                                )}
                            </div>
                        ))}
                        {days.map((day) => {
                            const evList = events(day);
                            const bkList = dayBookings(day);
                            const blList = dayBlocks(day);
                            const totalItems = evList.length + bkList.length + blList.length;
                            const combinedNodes = [
                                ...bkList.map(bookingButton),
                                ...evList.map(eventButton),
                                ...blList.map(blockChip),
                            ];
                            return (
                                <div
                                    key={day}
                                    className={`${styles.day} ${day.slice(0, 7) !== cursor.slice(0, 7) ? styles.muted : ""}`}
                                >
                                    <button
                                        className={`${styles.date} ${day === localDay() ? styles.today : ""}`}
                                        aria-label={dateLabel(day)}
                                        onClick={() => {
                                            setCursor(day);
                                            setMode("day");
                                        }}
                                    >
                                        {Number(day.slice(-2))}
                                    </button>
                                    {combinedNodes.slice(0, 3)}
                                    {links(day)}
                                    {totalItems > 3 && (
                                        <button
                                            className={styles.event}
                                            onClick={() => {
                                                setCursor(day);
                                                setMode("day");
                                            }}
                                        >
                                            +{totalItems - 3}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <div className={mode === "week" ? styles.week : styles.agenda}>
                            {days
                                .filter(
                                    (day) =>
                                        mode !== "agenda" ||
                                        events(day).length ||
                                        dayBookings(day).length ||
                                        dayBlocks(day).length ||
                                        due(day).length,
                                )
                                .map((day) => {
                                    const evs = events(day);
                                    const bks = dayBookings(day);
                                    const bls = dayBlocks(day);
                                    const dues = due(day);
                                    return (
                                        <section className={styles.agendaDay} key={day}>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold">{dateLabel(day)}</span>
                                                <Button
                                                    size="sm" variant="outline"
                                                    aria-label={`${l("Termin anlegen", "New event")} ${day}`}
                                                    onClick={() => open(undefined, day)}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            {bks.map(bookingButton)}
                                            {evs.map(eventButton)}
                                            {bls.map(blockChip)}
                                            {links(day)}
                                            {!evs.length && !bks.length && !bls.length && !dues.length && (
                                                <p className="text-sm text-muted-foreground">
                                                    {l("Keine Termine", "No events")}
                                                </p>
                                            )}
                                        </section>
                                    );
                                })}
                            {mode === "agenda" &&
                                !days.some(
                                    (day) =>
                                        events(day).length ||
                                        dayBookings(day).length ||
                                        dayBlocks(day).length ||
                                        due(day).length,
                                ) && <div className="py-8 text-center text-sm text-muted-foreground">{l("Keine passenden Termine.", "No matching events.")}</div>}
                        </div>
                    </div>
                )}
                </>}
            </CardContent></Card>
            <Dialog open={!!editing} onOpenChange={o => { if (!o) close(); }}><DialogContent showCloseButton={!busy} onInteractOutside={e => e.preventDefault()} className="sm:max-w-[700px]"><DialogHeader><DialogTitle>{editing?.id ? l("Termin / Serie bearbeiten", "Edit event / series") : l("Neuer Termin", "New event")}</DialogTitle></DialogHeader>
                {error && <Alert variant="destructive"><AlertTitle>{error}</AlertTitle></Alert>}
                {editing?.repeat && editing.repeat !== "none" && (
                    <Alert>
                        <AlertTitle>{l(
                            "Änderungen gelten für die gesamte Serie. Einzelne Vorkommen können gelöscht werden.",
                            "Edits apply to the whole series. Individual occurrences can be deleted.",
                        )}</AlertTitle>
                    </Alert>
                )}
                <form onSubmit={e => { e.preventDefault(); void save(); }}>
                    <fieldset disabled={busy} className="flex flex-col gap-4">
                    <div><Label>{l("Titel", "Title")}</Label><Input maxLength={200} value={values.title} onChange={e => set({ title: e.target.value })} />{fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}</div>
                    <div className="flex items-center gap-2"><Checkbox id="allday" checked={values.allDay} onCheckedChange={(checked) => {
                                const isDay = checked === true;
                                set(isDay
                                        ? {
                                              allDay: true,
                                              start: String(values.start).slice(0, 10),
                                              end: String(values.end).slice(0, 10),
                                          }
                                        : {
                                              allDay: false,
                                              start: String(values.start).slice(0, 10) + "T09:00",
                                              end: String(values.end).slice(0, 10) + "T10:00",
                                          });
                            }} /><Label htmlFor="allday">{l("Ganztägig", "All day")}</Label></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div><Label>{l("Beginn", "Start")}</Label><Input type={allDay ? "date" : "datetime-local"} value={values.start} onChange={e => set({ start: e.target.value })} />{fieldErrors.start && <p className="text-sm text-destructive">{fieldErrors.start}</p>}</div>
                        <div><Label>{allDay ? l("Letzter Tag (einschließlich)", "Last day (inclusive)") : l("Ende", "End")}</Label><Input type={allDay ? "date" : "datetime-local"} value={values.end} onChange={e => set({ end: e.target.value })} />{fieldErrors.end && <p className="text-sm text-destructive">{fieldErrors.end}</p>}</div>
                    </div>
                    <div><Label>{l("Kategorie", "Category")}</Label><Select value={values.category || undefined} onValueChange={v => set({ category: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["work", "personal", "deadline"].map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select>{fieldErrors.category && <p className="text-sm text-destructive">{fieldErrors.category}</p>}</div>
                    <div><Label>{l("Ort", "Location")}</Label><Input maxLength={1000} value={values.location} onChange={e => set({ location: e.target.value })} /></div>
                    <div><Label>{l("Notizen", "Notes")}</Label><Textarea maxLength={20000} rows={3} value={values.notes} onChange={e => set({ notes: e.target.value })} /></div>
                    <div><Label>{l("Wiederholung", "Repeat")}</Label><Select value={values.repeat || undefined} onValueChange={v => set({ repeat: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["none", "daily", "weekly", "monthly", "yearly"].map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-2 gap-3" style={{ display: repeat === "none" ? "none" : undefined }}>
                        <div><Label>{l("Intervall", "Interval")}</Label><DecimalInput min={1} max={30} precision={0} value={values.interval} onChange={v => set({ interval: v })} />{fieldErrors.interval && <p className="text-sm text-destructive">{fieldErrors.interval}</p>}</div>
                        <div><Label>{l("Bis (optional)", "Until (optional)")}</Label><Input type="date" value={values.until} onChange={e => set({ until: e.target.value })} /></div>
                    </div>
                    <div><Label>{l("Erinnerung", "Reminder")}</Label><Select value={String(values.reminder)} onValueChange={v => set({ reminder: Number(v) })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{[-1, 0, 5, 10, 15, 30, 60, 1440].map((value) => <SelectItem key={value} value={String(value)}>{value < 0 ? l("Keine", "None") : value === 0 ? l("Bei Beginn", "At start") : `${value} ${l("Minuten vorher", "minutes before")}`}</SelectItem>)}</SelectContent></Select></div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{l("Speichern", "Save")}</Button>
                        <Button type="button" variant="outline" onClick={close}>{l("Abbrechen", "Cancel")}</Button>
                        {editing?.id && (
                            <Button type="button" variant="destructive" onClick={() => setDeleteTarget("series")}>{l("Serie / Termin löschen", "Delete event / series")}</Button>
                        )}
                        {editing?.id && editing.repeat !== "none" && occurrence && (
                            <Button type="button" variant="destructive" onClick={() => setDeleteTarget("occurrence")}>{l("Dieses Vorkommen löschen", "Delete this occurrence")}</Button>
                        )}
                    </div>
                    </fieldset>
                </form>
            </DialogContent></Dialog>

            <Dialog open={!!preview} onOpenChange={o => { if (!o && !busy && !importing) setPreview(null); }}><DialogContent showCloseButton={!busy && !importing} className="sm:max-w-lg"><DialogHeader><DialogTitle>{l("Kalenderimport prüfen", "Review calendar import")}</DialogTitle></DialogHeader>
                <p className="text-sm">
                    {preview?.count} {l("neue Termine", "new events")} · {preview?.skipped}{" "}
                    {l("bereits vorhanden", "already present")}
                </p>
                {preview?.titles.map((title, i) => <p key={i} className="text-sm">{title}</p>)}
                <DialogFooter>
                    <Button variant="outline" disabled={importing} onClick={() => setPreview(null)}>{l("Abbrechen", "Cancel")}</Button>
                    <Button disabled={!preview?.count || busy || importing} onClick={async () => {
                    setImporting(true);
                    let imported = 0;
                    try {
                        for (let batch = 0; batch < 50; batch++) {
                            const result = await resource.mutate({ action: "import", source, timeZone: zone });
                            imported += result.imported;
                            setImportMessage(
                                `${imported} ${l("importiert", "imported")}, ${preview?.skipped || 0} ${l("bereits vorhanden", "already present")}. ${result.error || ""}`,
                            );
                            if (result.error || !result.remaining) {
                                setPreview(null);
                                break;
                            }
                        }
                    } catch (error) {
                        setImportMessage(
                            `${imported} ${l("importiert. Erneutes Importieren überspringt vorhandene Termine.", "imported. Re-importing skips existing events.")} ${(error as Error).message}`,
                        );
                    } finally {
                        setImporting(false);
                    }
                }}>{(busy || importing) && <Loader2 className="animate-spin" />}{l("Termine importieren", "Import events")}</Button>
                </DialogFooter>
            </DialogContent></Dialog>

            <BookingDetailDrawer
                booking={selectedBooking}
                staff={activeStaff}
                onClose={() => setSelectedBooking(null)}
                onChanged={resource.load}
            />
            <ManualBookingModal
                open={manualBookingOpen}
                services={activeServices}
                staff={activeStaff}
                initialDate={cursor}
                onCancel={() => setManualBookingOpen(false)}
                onCreated={resource.load}
            />
            <BlockTimeModal
                open={blockOpen}
                staff={activeStaff}
                initialDate={cursor}
                onCancel={() => setBlockOpen(false)}
                onCreated={resource.load}
            />
        </WorkspaceFrame>
    );
}
