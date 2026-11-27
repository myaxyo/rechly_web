"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import SlotPicker, { bookingWhen, type BookingSlot } from "./SlotPicker";
interface ManagedAppointment {
    serviceName: string;
    startUtc: string;
    endUtc: string;
    timezone: string;
    durationMinutes: number;
    status: string;
    businessName: string;
    slug: string;
    canCancel: boolean;
    canReschedule: boolean;
    cancelBefore: string;
    rescheduleBefore: string;
    maxHorizonDays: number;
    contactEmail?: string;
    contactPhone?: string;
}
const labels: Record<string, string> = {
    PENDING: "Wartet auf Bestätigung",
    CONFIRMED: "Bestätigt",
    COMPLETED: "Abgeschlossen",
    CANCELLED_BY_CUSTOMER: "Storniert",
    CANCELLED_BY_BUSINESS: "Vom Unternehmen storniert",
    NO_SHOW: "Nicht erschienen",
};
export default function ManageBooking({ token }: { token: string }) {
    const [appt, setAppt] = useState<ManagedAppointment | null>(null),
        [loading, setLoading] = useState(true),
        [error, setError] = useState(""),
        [actionError, setActionError] = useState(""),
        [success, setSuccess] = useState("");
    const [action, setAction] = useState<"cancel" | "reschedule" | null>(null),
        [busy, setBusy] = useState(false),
        [slot, setSlot] = useState<BookingSlot | null>(null),
        [revision, setRevision] = useState(0);
    const base = `/api/termine/manage/${token}`;
    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const r = await fetch(base, { cache: "no-store" }),
                data = await r.json();
            if (!r.ok) throw new Error(data.error || "Buchung konnte nicht geladen werden.");
            setAppt(data.appointment);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [base]);
    useEffect(() => {
        void load();
    }, [load]);
    async function change() {
        if (!action || (action === "reschedule" && !slot)) return;
        setBusy(true);
        setActionError("");
        try {
            const r = await fetch(base + "/" + action, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    ...(action === "reschedule"
                        ? { body: JSON.stringify({ newStartUtc: slot!.startUtc }) }
                        : {}),
                }),
                data = await r.json();
            if (!r.ok) {
                if (r.status === 409) {
                    setSlot(null);
                    setRevision((v) => v + 1);
                }
                throw new Error(data.error || "Änderung fehlgeschlagen.");
            }
            setSuccess(action === "cancel" ? "Ihr Termin wurde storniert." : "Ihr Termin wurde verschoben.");
            setAction(null);
            setSlot(null);
            await load();
        } catch (e) {
            setActionError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    const cancelled = appt?.status.startsWith("CANCELLED"),
        active = appt && ["PENDING", "CONFIRMED"].includes(appt.status);
    return (
        <div className="buchen-page">
            <header className="buchen-hero">
                <div className="buchen-hero-inner">
                    <div className="buchen-eyebrow">Ihre Buchung</div>
                    <h1>{appt?.businessName || "Termin verwalten"}</h1>
                    <p>Alle Details und Änderungen an einem Ort. Bewahren Sie diesen privaten Link auf.</p>
                </div>
            </header>
            <main className="buchen-main booking-manage">
                {loading ? (
                    <Card>
                        <CardContent className="flex flex-col gap-3">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-8 w-2/3" />
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                    </Card>
                ) : error || !appt ? (
                    <Alert variant="destructive">
                        <XCircle />
                        <AlertTitle>{error || "Buchung nicht gefunden."}</AlertTitle>
                        <AlertDescription>
                            <span>Prüfen Sie Ihren Link oder kontaktieren Sie das Unternehmen.</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => void load()}
                            >
                                Erneut versuchen
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Card className="buchen-card">
                        <CardContent>
                            {success && (
                                <Alert className="mb-6">
                                    <CheckCircle2 />
                                    <AlertTitle>{success}</AlertTitle>
                                </Alert>
                            )}
                            <Badge
                                variant={
                                    cancelled
                                        ? "destructive"
                                        : appt.status === "CONFIRMED"
                                          ? "default"
                                          : "secondary"
                                }
                            >
                                {labels[appt.status] || appt.status}
                            </Badge>
                            <h2 className="text-2xl font-semibold">{appt.serviceName}</h2>
                            <p className="font-semibold">{bookingWhen(appt.startUtc, appt.timezone)}</p>
                            <p className="booking-muted">
                                {appt.durationMinutes} Minuten · {appt.timezone}
                            </p>
                            {appt.status === "PENDING" && (
                                <Alert className="mb-6">
                                    <Info />
                                    <AlertTitle>Ihre Anfrage wird geprüft.</AlertTitle>
                                    <AlertDescription>
                                        Der Termin ist erst nach Bestätigung durch das Unternehmen verbindlich.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {active && (
                                <>
                                    <div className="booking-policy">
                                        <strong>Ihre Änderungsfristen</strong>
                                        <p>Stornieren bis {bookingWhen(appt.cancelBefore, appt.timezone)}.</p>
                                        <p>Umbuchen bis {bookingWhen(appt.rescheduleBefore, appt.timezone)}.</p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            disabled={!appt.canReschedule}
                                            onClick={() => {
                                                setAction("reschedule");
                                                setActionError("");
                                                setSlot(null);
                                            }}
                                        >
                                            Termin verschieben
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={!appt.canCancel}
                                            onClick={() => {
                                                setAction("cancel");
                                                setActionError("");
                                            }}
                                        >
                                            Termin stornieren
                                        </Button>
                                        {appt.status === "CONFIRMED" && (
                                            <Button type="button" variant="outline" asChild>
                                                <a href={base + "/calendar"}>Zum Kalender hinzufügen</a>
                                            </Button>
                                        )}
                                    </div>
                                    {(!appt.canCancel || !appt.canReschedule) && (
                                        <p className="booking-muted">
                                            Für Änderungen nach Ablauf der Frist kontaktieren Sie bitte das
                                            Unternehmen direkt.
                                        </p>
                                    )}
                                </>
                            )}
                            {!active && (
                                <Alert className="mt-5">
                                    <Info />
                                    <AlertTitle>{labels[appt.status] || appt.status}</AlertTitle>
                                    <AlertDescription>
                                        Dieser Termin kann nicht mehr online geändert werden.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="booking-actions">
                                <Button type="button" variant="outline" asChild>
                                    <a href={"/buchen/" + appt.slug}>Weiteren Termin buchen</a>
                                </Button>
                                <div className="flex flex-wrap gap-2">
                                    {appt.contactPhone && (
                                        <a href={"tel:" + appt.contactPhone}>{appt.contactPhone}</a>
                                    )}
                                    {appt.contactEmail && (
                                        <a href={"mailto:" + appt.contactEmail}>{appt.contactEmail}</a>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <Dialog
                    open={!!action}
                    onOpenChange={(open) => {
                        if (!open && !busy) setAction(null);
                    }}
                >
                    <DialogContent
                        className={action === "reschedule" ? "sm:max-w-[850px]" : "sm:max-w-[480px]"}
                        showCloseButton={!busy}
                        onEscapeKeyDown={(e) => {
                            if (busy) e.preventDefault();
                        }}
                        onInteractOutside={(e) => {
                            if (busy) e.preventDefault();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {action === "cancel" ? "Termin wirklich stornieren?" : "Neuen Termin auswählen"}
                            </DialogTitle>
                        </DialogHeader>
                        <div>
                            {actionError && (
                                <Alert variant="destructive" className="mb-4">
                                    <XCircle />
                                    <AlertTitle>{actionError}</AlertTitle>
                                </Alert>
                            )}
                            {appt && (
                                <p>
                                    Ihr bisheriger Termin:{" "}
                                    <strong>{bookingWhen(appt.startUtc, appt.timezone)}</strong>.
                                    {action === "reschedule" &&
                                        " Er bleibt reserviert, bis die Umbuchung erfolgreich ist."}
                                </p>
                            )}
                            {action === "reschedule" && appt && (
                                <SlotPicker
                                    key={revision}
                                    endpoint={base + "/availability"}
                                    timezone={appt.timezone}
                                    maxHorizonDays={appt.maxHorizonDays}
                                    value={slot}
                                    onChange={setSlot}
                                    disabled={busy}
                                />
                            )}
                            {slot && action === "reschedule" && appt && (
                                <Alert className="mt-4">
                                    <Info />
                                    <AlertTitle>
                                        {"Neuer Termin: " + bookingWhen(slot.startUtc, appt.timezone)}
                                    </AlertTitle>
                                </Alert>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={busy}
                                onClick={() => setAction(null)}
                            >
                                Bisherigen Termin behalten
                            </Button>
                            <Button
                                type="button"
                                variant={action === "cancel" ? "destructive" : "default"}
                                disabled={busy || (action === "reschedule" && !slot)}
                                onClick={() => void change()}
                            >
                                {busy && <Loader2 className="animate-spin" />}
                                {action === "cancel" ? "Ja, Termin stornieren" : "Umbuchung bestätigen"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
