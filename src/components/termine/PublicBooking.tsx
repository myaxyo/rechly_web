"use client";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Info, Loader2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Steps } from "@/components/ui/steps";
import { Textarea } from "@/components/ui/textarea";
import SlotPicker, { bookingWhen, type BookingSlot } from "./SlotPicker";
export interface PublicService {
    id: string;
    name: string;
    description?: string;
    category?: string;
    durationMinutes: number;
    priceCents?: number;
    currency: string;
    staffIds: string[];
}
export interface PublicStaff {
    id: string;
    name: string;
    description?: string;
    color?: string;
    serviceIds: string[];
}
export interface PublicBusiness {
    slug: string;
    displayName: string;
    description?: string;
    timezone: string;
    allowAnyStaff: boolean;
    showPrices: boolean;
    currency: string;
    confirmationMode?: string;
    maxHorizonDays?: number;
    cancelNoticeMinutes?: number;
    rescheduleNoticeMinutes?: number;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    website?: string;
}
const price = (service: PublicService) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: service.currency }).format(
        (service.priceCents || 0) / 100,
    );
const ANY_STAFF = "__any__";
export default function PublicBooking({
    business,
    services,
    staff,
}: {
    business: PublicBusiness;
    services: PublicService[];
    staff: PublicStaff[];
}) {
    const [step, setStep] = useState(0),
        [serviceId, setServiceId] = useState(""),
        [staffId, setStaffId] = useState(""),
        [query, setQuery] = useState(""),
        [slot, setSlot] = useState<BookingSlot | null>(null);
    const [error, setError] = useState(""),
        [submitting, setSubmitting] = useState(false),
        [refresh, setRefresh] = useState(0);
    const [confirmed, setConfirmed] = useState<{
        manageToken: string;
        startUtc: string;
        status: string;
        delivery: string;
    } | null>(null);
    const [customerName, setCustomerName] = useState(""),
        [customerEmail, setCustomerEmail] = useState(""),
        [customerPhone, setCustomerPhone] = useState(""),
        [customerNote, setCustomerNote] = useState("");
    const [formErrors, setFormErrors] = useState<{ customerName?: string; customerEmail?: string }>({});
    const submittingRef = useRef(false),
        attempt = useRef<{ key: string; fingerprint: string } | null>(null);
    const service = services.find((s) => s.id === serviceId),
        eligible = staff.filter(
            (s) =>
                (!service?.staffIds.length || service.staffIds.includes(s.id)) &&
                (!service || !s.serviceIds?.length || s.serviceIds.includes(service.id)),
        );
    const listed = useMemo(
        () =>
            services.filter((s) =>
                [s.name, s.category, s.description]
                    .join(" ")
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()),
            ),
        [services, query],
    );
    const endpoint = `/api/termine/public/${business.slug}/availability?serviceId=${encodeURIComponent(serviceId)}${staffId ? "&staffId=" + encodeURIComponent(staffId) : ""}`;
    function chooseService(id: string) {
        setServiceId(id);
        setStaffId("");
        setSlot(null);
        setError("");
        setStep(1);
        attempt.current = null;
    }
    function validateBookingForm(): { customerName: string; customerEmail: string; customerPhone?: string; customerNote?: string } | null {
        const errors: { customerName?: string; customerEmail?: string } = {};
        if (!customerName.trim()) errors.customerName = "Bitte geben Sie Ihren Namen an.";
        if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()))
            errors.customerEmail = "Bitte geben Sie eine gültige E-Mail-Adresse an.";
        setFormErrors(errors);
        if (Object.keys(errors).length) return null;
        return {
            customerName,
            customerEmail,
            customerPhone: customerPhone || undefined,
            customerNote: customerNote || undefined,
        };
    }
    async function submit(values: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        customerNote?: string;
    }) {
        if (!service || !slot || submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        setError("");
        const fingerprint = JSON.stringify([service.id, slot, values]);
        if (attempt.current?.fingerprint !== fingerprint)
            attempt.current = { key: crypto.randomUUID(), fingerprint };
        try {
            const response = await fetch(`/api/termine/public/${business.slug}/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    serviceId: service.id,
                    staffId: slot.staffId,
                    startUtc: slot.startUtc,
                    idempotencyKey: attempt.current.key,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    setSlot(null);
                    setStep(1);
                    setRefresh((r) => r + 1);
                }
                throw new Error(data.error || "Buchung fehlgeschlagen.");
            }
            setConfirmed(data);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            setError((error as Error).message);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    }
    const summary = service && (
        <>
            <span className="booking-label">Ihre Auswahl</span>
            <h2>{service.name}</h2>
            <p>
                {service.durationMinutes} Minuten
                {business.showPrices && service.priceCents !== undefined ? " · " + price(service) : ""}
            </p>
            {slot && (
                <p>
                    <strong>{bookingWhen(slot.startUtc, business.timezone)}</strong>
                    <br />
                    <span className="booking-muted">{business.timezone}</span>
                </p>
            )}
            {slot && staff.find((s) => s.id === slot.staffId) && (
                <p>Bei {staff.find((s) => s.id === slot.staffId)?.name}</p>
            )}
            {business.address && <p>{business.address}</p>}
            <div className="booking-policy">
                <strong>Gut zu wissen</strong>
                <p>
                    {business.confirmationMode === "manual"
                        ? "Ihre Anfrage wird vom Unternehmen geprüft. Erst danach ist der Termin bestätigt."
                        : "Nach erfolgreicher Buchung ist Ihr Termin bestätigt."}
                </p>
                <p>
                    Online stornieren{" "}
                    {business.cancelNoticeMinutes
                        ? `bis ${business.cancelNoticeMinutes} Minuten vorher`
                        : "bis zum Terminbeginn"}
                    . Umbuchen{" "}
                    {business.rescheduleNoticeMinutes
                        ? `bis ${business.rescheduleNoticeMinutes} Minuten vorher`
                        : "bis zum Terminbeginn"}
                    .
                </p>
                <p>Sie benötigen kein Rechly-Konto.</p>
            </div>
        </>
    );
    return (
        <div className="buchen-page">
            <header className="buchen-hero">
                <div className="buchen-hero-inner">
                    <div className="buchen-eyebrow">Einfach online buchen</div>
                    <h1>{business.displayName}</h1>
                    {business.description && <p>{business.description}</p>}
                    <div className="buchen-meta">
                        {business.address && <span>{business.address}</span>}
                        {business.contactPhone && (
                            <a href={"tel:" + business.contactPhone}>{business.contactPhone}</a>
                        )}
                        {business.contactEmail && (
                            <a href={"mailto:" + business.contactEmail}>{business.contactEmail}</a>
                        )}
                    </div>
                </div>
            </header>
            <main className="buchen-main">
                {confirmed ? (
                    <Card className="buchen-card booking-confirmation">
                        <CardContent>
                            <div className="booking-success-icon">
                                {confirmed.status === "PENDING" ? <Clock /> : <CheckCircle2 />}
                            </div>
                            <h2 className="text-2xl font-semibold">
                                {confirmed.status === "PENDING"
                                    ? "Ihre Anfrage ist eingegangen"
                                    : "Ihr Termin ist bestätigt"}
                            </h2>
                            <p>
                                {service?.name} · {service?.durationMinutes} Minuten
                                <br />
                                {bookingWhen(confirmed.startUtc, business.timezone)} ({business.timezone})
                            </p>
                            <Alert>
                                {confirmed.status === "PENDING" ? <Clock /> : <CheckCircle2 />}
                                <AlertTitle>
                                    {confirmed.status === "PENDING"
                                        ? "Das Unternehmen prüft Ihren Wunschtermin."
                                        : "Wir freuen uns auf Ihren Besuch."}
                                </AlertTitle>
                                <AlertDescription>
                                    {confirmed.delivery === "sent"
                                        ? "Die E-Mail wurde an den Versanddienst übergeben. Prüfen Sie bei Bedarf auch Ihren Spam-Ordner."
                                        : "Die E-Mail ist zum Versand vorgemerkt. Speichern Sie Ihren Verwaltungslink, damit Sie Ihren Termin jederzeit wiederfinden."}
                                </AlertDescription>
                            </Alert>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Button type="button" size="lg" asChild>
                                    <a href={`/buchen/verwalten/${confirmed.manageToken}`}>Termin verwalten</a>
                                </Button>
                                {confirmed.status === "CONFIRMED" && (
                                    <Button type="button" variant="outline" asChild>
                                        <a href={`/api/termine/manage/${confirmed.manageToken}/calendar`}>
                                            Zum Kalender hinzufügen
                                        </a>
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(
                                                new URL(
                                                    `/buchen/verwalten/${confirmed.manageToken}`,
                                                    window.location.origin,
                                                ).toString(),
                                            );
                                            toast.success("Link kopiert.");
                                        } catch {
                                            toast.info(
                                                "Öffnen Sie „Termin verwalten“ und speichern Sie die Adresse.",
                                            );
                                        }
                                    }}
                                >
                                    Verwaltungslink kopieren
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Steps
                            current={step}
                            items={[{ title: "Leistung" }, { title: "Termin" }, { title: "Ihre Angaben" }]}
                            className="mb-7"
                        />
                        {error && (
                            <Alert variant="destructive" role="alert" className="mb-5">
                                <XCircle />
                                <AlertTitle>{error}</AlertTitle>
                            </Alert>
                        )}
                        <div className={service ? "booking-layout" : ""}>
                            <section aria-label="Buchung">
                                {step === 0 && (
                                    <>
                                        <h2 className="text-2xl font-semibold">Was dürfen wir für Sie tun?</h2>
                                        <p className="booking-muted">
                                            Wählen Sie eine Leistung. Freie Termine sehen Sie im nächsten
                                            Schritt.
                                        </p>
                                        {services.length > 5 && (
                                            <div className="relative mb-5">
                                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                                <Input
                                                    aria-label="Leistung suchen"
                                                    placeholder="Leistung oder Kategorie suchen"
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        )}
                                        <div className="buchen-service-list">
                                            {listed.map((s) => (
                                                <button
                                                    type="button"
                                                    className="buchen-service"
                                                    key={s.id}
                                                    onClick={() => chooseService(s.id)}
                                                >
                                                    {s.category && (
                                                        <span className="booking-label">{s.category}</span>
                                                    )}
                                                    <span className="buchen-service-name">{s.name}</span>
                                                    {s.description && (
                                                        <span className="buchen-service-desc">
                                                            {s.description}
                                                        </span>
                                                    )}
                                                    <span className="buchen-service-meta">
                                                        {s.durationMinutes} Minuten
                                                        {business.showPrices && s.priceCents !== undefined
                                                            ? " · " + price(s)
                                                            : ""}
                                                        <span aria-hidden="true"> →</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        {!listed.length && (
                                            <Alert>
                                                <Info />
                                                <AlertTitle>
                                                    {services.length
                                                        ? "Keine passende Leistung gefunden."
                                                        : "Zurzeit sind keine Leistungen online buchbar."}
                                                </AlertTitle>
                                            </Alert>
                                        )}
                                    </>
                                )}
                                {step === 1 && (
                                    <Card className="buchen-card">
                                        <CardContent>
                                            <h3 className="mt-0 text-xl font-semibold">Wann passt es Ihnen?</h3>
                                            {eligible.length > 1 && (
                                                <div className="booking-zone">
                                                    <Label htmlFor="public-booking-staff">Mitarbeiter</Label>
                                                    <Select
                                                        value={
                                                            business.allowAnyStaff
                                                                ? staffId || ANY_STAFF
                                                                : staffId || undefined
                                                        }
                                                        onValueChange={(v) => {
                                                            setStaffId(v === ANY_STAFF ? "" : v);
                                                            setSlot(null);
                                                        }}
                                                    >
                                                        <SelectTrigger
                                                            id="public-booking-staff"
                                                            aria-label="Mitarbeiter"
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Bitte auswählen" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {business.allowAnyStaff && (
                                                                <SelectItem value={ANY_STAFF}>
                                                                    Erste freie Person
                                                                </SelectItem>
                                                            )}
                                                            {eligible.map((s) => (
                                                                <SelectItem key={s.id} value={s.id}>
                                                                    {s.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            {(eligible.length <= 1 || staffId || business.allowAnyStaff) && (
                                                <SlotPicker
                                                    key={serviceId + staffId + refresh}
                                                    endpoint={endpoint}
                                                    timezone={business.timezone}
                                                    maxHorizonDays={business.maxHorizonDays}
                                                    value={slot}
                                                    onChange={setSlot}
                                                />
                                            )}
                                            <div className="booking-actions">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setStep(0)}
                                                >
                                                    <ArrowLeft />
                                                    Leistung ändern
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="lg"
                                                    disabled={!slot}
                                                    onClick={() => {
                                                        setStep(2);
                                                        setError("");
                                                    }}
                                                >
                                                    Weiter zu Ihren Angaben
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {step === 2 && (
                                    <Card className="buchen-card">
                                        <CardContent>
                                            <h3 className="mt-0 text-xl font-semibold">Fast geschafft</h3>
                                            <p className="booking-muted">
                                                Wir verwenden Ihre Angaben zur Organisation dieses Termins.
                                            </p>
                                            <form
                                                name="public-booking"
                                                noValidate
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (submitting) return;
                                                    const values = validateBookingForm();
                                                    if (values) void submit(values);
                                                }}
                                            >
                                                <fieldset
                                                    disabled={submitting}
                                                    className="flex flex-col gap-4 border-0 p-0"
                                                >
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="customerName">Name</Label>
                                                        <Input
                                                            id="customerName"
                                                            autoComplete="name"
                                                            maxLength={120}
                                                            value={customerName}
                                                            aria-invalid={!!formErrors.customerName}
                                                            onChange={(e) => setCustomerName(e.target.value)}
                                                        />
                                                        {formErrors.customerName && (
                                                            <p role="alert" className="text-destructive text-sm">
                                                                {formErrors.customerName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="customerEmail">E-Mail</Label>
                                                        <Input
                                                            id="customerEmail"
                                                            autoComplete="email"
                                                            inputMode="email"
                                                            maxLength={200}
                                                            value={customerEmail}
                                                            aria-invalid={!!formErrors.customerEmail}
                                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                                        />
                                                        {formErrors.customerEmail && (
                                                            <p role="alert" className="text-destructive text-sm">
                                                                {formErrors.customerEmail}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="customerPhone">Telefon (optional)</Label>
                                                        <Input
                                                            id="customerPhone"
                                                            autoComplete="tel"
                                                            inputMode="tel"
                                                            maxLength={40}
                                                            value={customerPhone}
                                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="customerNote">
                                                            Nachricht an das Unternehmen (optional)
                                                        </Label>
                                                        <Textarea
                                                            id="customerNote"
                                                            rows={3}
                                                            maxLength={500}
                                                            value={customerNote}
                                                            onChange={(e) => setCustomerNote(e.target.value)}
                                                        />
                                                        <p className="text-muted-foreground text-right text-xs">
                                                            {customerNote.length} / 500
                                                        </p>
                                                    </div>
                                                    <p className="booking-muted">
                                                        Bitte prüfen Sie den Termin und die Änderungsfristen in Ihrer
                                                        Buchungsübersicht.{" "}
                                                        <a href="/datenschutz" target="_blank" rel="noreferrer">
                                                            Datenschutz
                                                        </a>
                                                    </p>
                                                    <div className="booking-actions">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={submitting}
                                                            onClick={() => setStep(1)}
                                                        >
                                                            Termin ändern
                                                        </Button>
                                                        <Button type="submit" size="lg" disabled={submitting}>
                                                            {submitting && <Loader2 className="animate-spin" />}
                                                            {business.confirmationMode === "manual"
                                                                ? "Terminanfrage senden"
                                                                : "Verbindlich buchen"}
                                                        </Button>
                                                    </div>
                                                </fieldset>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}
                            </section>
                            {service && (
                                <aside className="booking-summary" aria-label="Buchungsübersicht">
                                    {summary}
                                </aside>
                            )}
                        </div>
                    </>
                )}
            </main>
            <footer className="buchen-footer">
                <span>{business.displayName}</span>
                {business.website && /^https?:\/\//.test(business.website) && (
                    <a href={business.website} target="_blank" rel="noreferrer">
                        Website
                    </a>
                )}
                <a href="/datenschutz" target="_blank" rel="noreferrer">
                    Datenschutz
                </a>
                <span>Terminbuchung mit Rechly</span>
            </footer>
        </div>
    );
}
