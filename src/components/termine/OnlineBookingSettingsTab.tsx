"use client";
import HelpLink from "@/components/dashboard/HelpLink";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Copy, Link2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { get, patch, post } from "@/lib/termine/client";
import { normalizeSlug } from "@/lib/termine/slug";
import BookingHealth from "./BookingHealth";

interface BookingSettings {
    slug: string;
    displayName: string;
    description?: string;
    timezone: string;
    language: string;
    slotIntervalMinutes: number;
    minNoticeMinutes: number;
    maxHorizonDays: number;
    cancelNoticeMinutes: number;
    rescheduleNoticeMinutes: number;
    confirmationMode: string;
    allowAnyStaff: boolean;
    showPrices: boolean;
    currency: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    website?: string;
    enabled: boolean;
    published: boolean;
}

interface CompanyDefaults {
    displayName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    website?: string;
}

type SettingsFormState = Partial<BookingSettings>;

export default function OnlineBookingSettingsTab() {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [settings, setSettings] = useState<BookingSettings | null>(null);
    const [values, setValues] = useState<SettingsFormState>({});
    const [defaults, setDefaults] = useState<CompanyDefaults>({});
    const [slugInput, setSlugInput] = useState("");
    const [setupName, setSetupName] = useState("");
    const [slugCheck, setSlugCheck] = useState<{
        checking: boolean;
        available?: boolean;
        reason?: string;
    }>({ checking: false });

    const setField = <K extends keyof BookingSettings>(key: K, value: BookingSettings[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await get<{ settings: BookingSettings | null; companyDefaults?: CompanyDefaults }>(
                "/api/termine/settings",
            );
            const cd = res.companyDefaults || {};
            setDefaults(cd);
            if (res.settings) {
                setSettings(res.settings);
                setSlugInput(res.settings.slug);
                setValues({
                    ...res.settings,
                    displayName: res.settings.displayName || cd.displayName || "",
                });
            } else {
                setSettings(null);
                setValues({});
                const suggested = cd.displayName || "";
                setSetupName(suggested);
                if (suggested) {
                    setSlugInput(normalizeSlug(suggested));
                }
            }
        } catch (e) {
            toast.error(
                e instanceof Error
                    ? e.message
                    : l("Online-Buchungseinstellungen konnten nicht geladen werden.", "Could not load booking settings."),
            );
        } finally {
            setLoading(false);
        }
    }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        void load();
    }, [load]);

    async function verifySlug(candidate: string) {
        const norm = normalizeSlug(candidate);
        setSlugInput(norm);
        if (!norm) {
            setSlugCheck({ checking: false });
            return;
        }
        setSlugCheck({ checking: true });
        try {
            const res = await get<{ available: boolean; reason?: string }>(
                `/api/termine/slug?slug=${encodeURIComponent(norm)}`,
            );
            setSlugCheck({ checking: false, available: res.available, reason: res.reason });
        } catch {
            setSlugCheck({ checking: false });
        }
    }

    async function handleClaimOrUpdateSlug() {
        const norm = normalizeSlug(slugInput);
        if (!norm) {
            toast.warning(l("Bitte eine gültige Buchungs-URL eingeben.", "Please enter a valid booking slug."));
            return;
        }
        setClaiming(true);
        try {
            await post("/api/termine/slug", {
                slug: norm,
                displayName: settings ? values.displayName : setupName || defaults.displayName,
            });
            toast.success(
                settings
                    ? l("Buchungs-URL aktualisiert.", "Booking URL updated.")
                    : l("Online-Buchung aktiviert!", "Online booking activated!"),
            );
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Konnte URL nicht reservieren.", "Could not reserve slug."));
        } finally {
            setClaiming(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                enabled: values.enabled,
                published: values.published,
                timezone: values.timezone,
                slotIntervalMinutes: values.slotIntervalMinutes,
                confirmationMode: values.confirmationMode,
                minNoticeMinutes: values.minNoticeMinutes,
                maxHorizonDays: values.maxHorizonDays,
                cancelNoticeMinutes: values.cancelNoticeMinutes,
                rescheduleNoticeMinutes: values.rescheduleNoticeMinutes,
                allowAnyStaff: values.allowAnyStaff,
                showPrices: values.showPrices,
                displayName: values.displayName,
                description: values.description,
                contactEmail: values.contactEmail,
                contactPhone: values.contactPhone,
                address: values.address,
                website: values.website,
            };
            await patch("/api/termine/settings", payload);
            toast.success(l("Online-Buchung gespeichert.", "Online booking settings saved."));
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Speichern fehlgeschlagen.", "Save failed."));
        } finally {
            setSaving(false);
        }
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicPath = settings ? `/buchen/${settings.slug}` : `/buchen/${slugInput || "ihr-name"}`;
    const fullPublicUrl = origin ? `${origin}${publicPath}` : publicPath;

    const numberValue = (v: number | undefined) => (v === null || v === undefined ? "" : String(v));
    const parseNumber = (raw: string): number => {
        if (raw.trim() === "") return 0;
        const n = Number(raw);
        return Number.isNaN(n) ? 0 : n;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-10 w-full max-w-xl" />
                    <Skeleton className="h-10 w-full max-w-xl" />
                    <Skeleton className="h-10 w-48" />
                </CardContent>
            </Card>
        );
    }

    if (!settings) {
        return (
            <Card>
                <CardContent>
                    <HelpLink href="/hilfe/termine" label="Terminbuchung einrichten und testen" />
                    <div className="flex w-full max-w-[640px] flex-col gap-4">
                        <h5 className="flex items-center gap-2 text-base font-semibold">
                            <Calendar className="size-5" />
                            {l("Online-Terminbuchung aktivieren", "Enable online appointment booking")}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                            {l(
                                "Lassen Sie Kunden online Termine buchen. Ihre Firmendaten (Name, Adresse, Kontakt) werden automatisch aus dem Reiter „Firma“ übernommen — keine doppelte Pflege nötig.",
                                "Let clients book appointments online. Your company details (name, address, contact) are automatically inherited from your Company tab — no duplicate entry needed.",
                            )}
                        </p>

                        {defaults.displayName && (
                            <Alert>
                                <AlertTitle>
                                    {l(
                                        `Verbunden mit Ihrem Firmenprofil: ${defaults.displayName}`,
                                        `Connected to your company profile: ${defaults.displayName}`,
                                    )}
                                </AlertTitle>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="setup-name" className="font-semibold">
                                {l("Öffentlicher Anzeigename", "Public business name")}
                            </Label>
                            <Input
                                id="setup-name"
                                value={setupName}
                                onChange={(e) => {
                                    setSetupName(e.target.value);
                                    if (!slugInput) setSlugInput(normalizeSlug(e.target.value));
                                }}
                                placeholder={defaults.displayName || l("Ihr Unternehmen", "Your business name")}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="setup-slug" className="font-semibold">
                                {l("Ihre Buchungs-URL", "Your booking URL")}
                            </Label>
                            <div className="flex w-full">
                                <Input
                                    id="setup-slug"
                                    className="rounded-r-none"
                                    value={slugInput}
                                    onChange={(e) => setSlugInput(normalizeSlug(e.target.value))}
                                    onBlur={() => void verifySlug(slugInput)}
                                    placeholder="muster-studio"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0 rounded-l-none border-l-0"
                                    disabled={slugCheck.checking}
                                    onClick={() => void verifySlug(slugInput)}
                                >
                                    {slugCheck.checking && <Loader2 className="animate-spin" />}
                                    {l("Prüfen", "Check")}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {l("Vorschau:", "Preview:")} <code>{publicPath}</code>{" "}
                                {l("sowie", "and")} <code>{slugInput || "ihr-name"}.rechly.de</code>
                            </p>
                            {slugCheck.available === true && (
                                <div>
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                                        {l("Verfügbar", "Available")}
                                    </Badge>
                                </div>
                            )}
                            {slugCheck.available === false && (
                                <div>
                                    <Badge variant="destructive">
                                        {l("Nicht verfügbar", "Unavailable")}
                                        {slugCheck.reason ? ` (${slugCheck.reason})` : ""}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <div>
                            <Button
                                type="button"
                                size="lg"
                                disabled={claiming}
                                onClick={() => void handleClaimOrUpdateSlug()}
                            >
                                {claiming ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                                {l("Online-Buchung jetzt aktivieren", "Activate online booking")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h5 className="text-base font-semibold">
                            {l("Online-Buchung & Terminregeln", "Online booking & scheduling rules")}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                            {l(
                                "Öffentliche Buchungsseite, Zeitraster und Fristen zentral verwalten.",
                                "Manage your public booking page, slot intervals and notice policies.",
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/products?tab=services">
                                {l("Buchbare Leistungen", "Bookable services")}
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/termine/buchungen?tab=availability">
                                {l("Arbeitszeiten & Sperrzeiten", "Working hours & blocks")}
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/termine/buchungen?tab=staff">
                                {l("Mitarbeiter", "Staff")}
                            </Link>
                        </Button>
                    </div>
                </div>

                <BookingHealth />
                <Card className="mb-4 py-4">
                    <CardContent>
                        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto]">
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-sm font-semibold">{l("Buchungs-Link:", "Booking link:")}</span>{" "}
                                <a
                                    href={publicPath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                    {fullPublicUrl} <Link2 className="size-3.5" />
                                </a>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    aria-label={l("Link kopieren", "Copy link")}
                                    onClick={() => {
                                        void navigator.clipboard?.writeText(fullPublicUrl);
                                        toast.success(l("Link kopiert.", "Link copied."));
                                    }}
                                >
                                    <Copy />
                                </Button>
                            </div>
                            <div className="flex w-full md:w-80">
                                <Input
                                    className="rounded-r-none"
                                    value={slugInput}
                                    onChange={(e) => setSlugInput(normalizeSlug(e.target.value))}
                                    placeholder="slug"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0 rounded-l-none border-l-0"
                                    disabled={claiming || !slugInput || slugInput === settings.slug}
                                    onClick={() => void handleClaimOrUpdateSlug()}
                                >
                                    {claiming && <Loader2 className="animate-spin" />}
                                    {l("URL ändern", "Change URL")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert className="mb-4">
                    <AlertTitle>
                        {l(
                            "Automatische Synchronisation mit Ihrem Firmenprofil",
                            "Automatic sync with your Company profile",
                        )}
                    </AlertTitle>
                    <AlertDescription>
                        {l(
                            "Name, E-Mail, Telefon, Adresse und Website werden automatisch aus dem Reiter „Firma“ übernommen. Nur wenn Sie auf der Buchungsseite abweichende Angaben zeigen möchten, tragen Sie diese unten optional ein.",
                            "Name, email, phone, address and website are automatically inherited from your Company tab. Only fill the optional fields below if you want public overrides.",
                        )}
                    </AlertDescription>
                </Alert>

                <form
                    className="flex max-w-[760px] flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSave();
                    }}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="settings-enabled"
                                checked={!!values.enabled}
                                onCheckedChange={(checked) => setField("enabled", checked)}
                            />
                            <Label htmlFor="settings-enabled">{l("Terminmodul aktiv", "Scheduling active")}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="settings-published"
                                checked={!!values.published}
                                onCheckedChange={(checked) => setField("published", checked)}
                            />
                            <Label htmlFor="settings-published">
                                {l("Öffentliche Buchungsseite sichtbar", "Public booking page live")}
                            </Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <span className="text-sm font-medium">{l("Buchungsregeln", "Booking rules")}</span>
                        <Separator className="flex-1" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-timezone">{l("Zeitzone", "Time zone")}</Label>
                            <Input
                                id="settings-timezone"
                                placeholder="Europe/Berlin"
                                value={values.timezone ?? ""}
                                onChange={(e) => setField("timezone", e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-slot">{l("Zeitraster", "Slot interval")}</Label>
                            <Select
                                value={values.slotIntervalMinutes ? String(values.slotIntervalMinutes) : undefined}
                                onValueChange={(v) => setField("slotIntervalMinutes", Number(v))}
                            >
                                <SelectTrigger id="settings-slot" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-confirmation">{l("Bestätigung", "Confirmation")}</Label>
                            <Select
                                value={values.confirmationMode || undefined}
                                onValueChange={(v) => setField("confirmationMode", v)}
                            >
                                <SelectTrigger id="settings-confirmation" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="automatic">{l("Sofort bestätigt", "Automatic")}</SelectItem>
                                    <SelectItem value="manual">{l("Manuell bestätigen", "Manual approval")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-min-notice">{l("Vorlauf (Min.)", "Lead time (min)")}</Label>
                            <Input
                                id="settings-min-notice"
                                type="number"
                                min={0}
                                max={43200}
                                value={numberValue(values.minNoticeMinutes)}
                                onChange={(e) => setField("minNoticeMinutes", parseNumber(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-horizon">{l("Horizont (Tage)", "Max horizon (days)")}</Label>
                            <Input
                                id="settings-horizon"
                                type="number"
                                min={1}
                                max={365}
                                value={numberValue(values.maxHorizonDays)}
                                onChange={(e) => setField("maxHorizonDays", parseNumber(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-cancel">{l("Stornofrist (Min.)", "Cancel notice (min)")}</Label>
                            <Input
                                id="settings-cancel"
                                type="number"
                                min={0}
                                max={43200}
                                value={numberValue(values.cancelNoticeMinutes)}
                                onChange={(e) => setField("cancelNoticeMinutes", parseNumber(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-reschedule">{l("Umbuchung (Min.)", "Reschedule notice (min)")}</Label>
                            <Input
                                id="settings-reschedule"
                                type="number"
                                min={0}
                                max={43200}
                                value={numberValue(values.rescheduleNoticeMinutes)}
                                onChange={(e) => setField("rescheduleNoticeMinutes", parseNumber(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="settings-any-staff"
                                checked={!!values.allowAnyStaff}
                                onCheckedChange={(checked) => setField("allowAnyStaff", checked)}
                            />
                            <Label htmlFor="settings-any-staff">
                                {l("„Beliebiger Mitarbeiter“ erlauben", "Allow 'Any staff' option")}
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="settings-show-prices"
                                checked={!!values.showPrices}
                                onCheckedChange={(checked) => setField("showPrices", checked)}
                            />
                            <Label htmlFor="settings-show-prices">
                                {l("Preise öffentlich anzeigen", "Show prices publicly")}
                            </Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <span className="text-sm font-medium">
                            {l("Optionale Abweichungen vom Firmenprofil", "Optional overrides from Company profile")}
                        </span>
                        <Separator className="flex-1" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="settings-display-name">{l("Öffentlicher Anzeigename", "Public display name")}</Label>
                        <Input
                            id="settings-display-name"
                            placeholder={defaults.displayName || ""}
                            value={values.displayName ?? ""}
                            onChange={(e) => setField("displayName", e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="settings-description">
                            {l("Kurzbeschreibung auf der Buchungsseite", "Public description")}
                        </Label>
                        <Textarea
                            id="settings-description"
                            rows={2}
                            value={values.description ?? ""}
                            onChange={(e) => setField("description", e.target.value)}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-email">{l("Öffentliche E-Mail (optional)", "Public email (optional)")}</Label>
                            <Input
                                id="settings-email"
                                placeholder={defaults.contactEmail || ""}
                                value={values.contactEmail ?? ""}
                                onChange={(e) => setField("contactEmail", e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-phone">{l("Öffentliches Telefon (optional)", "Public phone (optional)")}</Label>
                            <Input
                                id="settings-phone"
                                placeholder={defaults.contactPhone || ""}
                                value={values.contactPhone ?? ""}
                                onChange={(e) => setField("contactPhone", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-address">{l("Öffentliche Adresse (optional)", "Public address (optional)")}</Label>
                            <Input
                                id="settings-address"
                                placeholder={defaults.address || ""}
                                value={values.address ?? ""}
                                onChange={(e) => setField("address", e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="settings-website">{l("Website (optional)", "Website (optional)")}</Label>
                            <Input
                                id="settings-website"
                                placeholder={defaults.website || ""}
                                value={values.website ?? ""}
                                onChange={(e) => setField("website", e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin" /> : <Save />}
                            {l("Buchungseinstellungen speichern", "Save booking settings")}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
