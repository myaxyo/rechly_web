"use client";
import HelpLink from "@/components/dashboard/HelpLink";
import { EInvoiceFieldsControlled } from "@/components/dashboard/EInvoiceFields";

import { useEffect, useState } from "react";
import {
    ArrowLeftRight, Bot, Building2, CalendarDays, Loader2, Save, Trash2, Upload, User,
} from "lucide-react";
import { toast } from "sonner";
import MigrationWizard from "@/components/dashboard/MigrationWizard";
import OnlineBookingSettingsTab from "@/components/termine/OnlineBookingSettingsTab";
import { isTermineEnabled } from "@/lib/features";
import { getCompanyInfo, saveCompanyInfo } from "@/lib/companyService";
import { euCountryOptions } from "@/lib/euCountries";
import { LogoError, normalizeLogoFile } from "@/lib/companyLogo";
import { getNextInvoiceNumber } from "@/lib/invoiceService";
import {
    DEFAULT_NUMBER_PATTERN,
    DEFAULT_NUMBER_PREFIX,
    formatInvoiceNumber,
    validateNumberPattern,
} from "@/lib/invoiceNumbering";
import { ApiError } from "@/lib/apiClient";
import { getAISettings, saveAISettings, testAI } from "@/lib/aiService";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AIProvider, UserCompany } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DecimalInput from "@/components/DecimalInput";

type CompanyValues = Omit<UserCompany, "id" | "created_at" | "updated_at">;

const emptyCompany: CompanyValues = {
    name: "",
    legal_form: "",
    address_line1: "",
    address_line2: "",
    postal_code: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
    website: "",
    vat_id: "",
    tax_number: "",
    commercial_register_number: "",
    registry_court: "",
    managing_directors: "",
    bank_name: "",
    bank_iban: "",
    bank_bic: "",
    payment_terms_default: "",
    is_small_business: false,
    is_flat_rate_farming: false,
    invoice_number_prefix: "",
    invoice_number_pattern: "",
    next_invoice_number: 1,
};

function Field({
    label, children, error, hint, htmlFor,
}: {
    label: string;
    children: React.ReactNode;
    error?: string;
    hint?: string;
    htmlFor?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

/** Live-validated invoice numbering settings with format preview. */
function NumberingSection({
    t,
    values,
    set,
}: {
    t: (key: string) => string;
    values: CompanyValues;
    set: (patch: Partial<CompanyValues>) => void;
}) {
    const [suggesting, setSuggesting] = useState(false);
    const pattern = values.invoice_number_pattern;
    const prefix = values.invoice_number_prefix;
    const next = values.next_invoice_number;

    const activePattern = pattern && pattern.trim() ? pattern.trim() : DEFAULT_NUMBER_PATTERN;
    const activePrefix = prefix && prefix.trim() ? prefix.trim().slice(0, 32) : DEFAULT_NUMBER_PREFIX;
    const patternError = validateNumberPattern(activePattern);
    const preview =
        patternError === null
            ? formatInvoiceNumber({
                  pattern: activePattern,
                  prefix: activePrefix,
                  dateISO: new Date().toISOString().slice(0, 10),
                  seq: typeof next === "number" && next > 0 ? Math.floor(next) : 1,
              })
            : null;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                <Field label={t("settings.numberPrefix")} htmlFor="num-prefix">
                    <Input id="num-prefix" placeholder="RE" maxLength={32} value={prefix ?? ""}
                        onChange={(e) => set({ invoice_number_prefix: e.target.value })} />
                </Field>
                <Field label={t("settings.numberPattern")} htmlFor="num-pattern"
                    hint={t("settings.numberPatternHelp")}
                    error={patternError ? t("settings.numberPatternInvalid") : undefined}>
                    <Input id="num-pattern" placeholder={DEFAULT_NUMBER_PATTERN} maxLength={64} value={pattern ?? ""}
                        onChange={(e) => set({ invoice_number_pattern: e.target.value })}
                        aria-invalid={!!patternError} />
                </Field>
            </div>
            <div className="grid items-end gap-4 sm:grid-cols-2">
                <Field label={t("settings.nextInvoiceNumber")} hint={t("settings.nextInvoiceNumberHint")}>
                    <DecimalInput min={1} precision={0} style={{ width: "100%" }} value={next ?? 1}
                        onChange={(v) => set({ next_invoice_number: v ?? 1 })} />
                </Field>
                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="self-start"
                        disabled={suggesting}
                        onClick={async () => {
                            setSuggesting(true);
                            try {
                                const suggestion = await getNextInvoiceNumber(true);
                                if (suggestion) {
                                    set({ next_invoice_number: suggestion.next });
                                    toast.success(t("settings.numberSuggested"));
                                }
                            } catch {
                                toast.error(t("settings.saveError"));
                            } finally {
                                setSuggesting(false);
                            }
                        }}
                    >
                        {suggesting && <Loader2 className="animate-spin" />}
                        {t("settings.suggestFromHistory")}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.numberPreview")}:{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-semibold">{preview ?? "—"}</code>
                    </p>
                </div>
            </div>
        </div>
    );
}

interface AiValues {
    provider: AIProvider;
    model: string;
    base_url?: string;
    api_key?: string;
    system_prompt?: string;
    test_prompt?: string;
}

export default function SettingsPage() {
    const { user, logout, deleteAccount } = useAuth();
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState("company");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyLoadError, setCompanyLoadError] = useState<string | null>(null);
    const [companySaveError, setCompanySaveError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiTesting, setAiTesting] = useState(false);
    const [aiKeyConfigured, setAiKeyConfigured] = useState(false);
    const [aiResponse, setAiResponse] = useState<string>("");
    const [aiDailyUsage, setAiDailyUsage] = useState<{
        used: number;
        limit: number;
        remaining: number;
    } | null>(null);
    const [aiLocalAllowed, setAiLocalAllowed] = useState<boolean>(true);
    const [verifySending, setVerifySending] = useState(false);
    const [aiModelPresets, setAiModelPresets] = useState<Record<AIProvider, string[]>>({
        openai: [],
        anthropic: [],
        openrouter: [],
        ollama: [],
    });
    const [values, setValues] = useState<CompanyValues>(emptyCompany);
    const [errors, setErrors] = useState<Partial<Record<keyof CompanyValues, string>>>({});
    const set = (patch: Partial<CompanyValues>) => setValues((v) => ({ ...v, ...patch }));

    const [aiValues, setAiValues] = useState<AiValues>({
        provider: "openai",
        model: "gpt-4o-mini",
        base_url: "http://localhost:11434/v1",
        api_key: "",
        system_prompt: "You are Rechly AI. Help the user write invoice-related text clearly and concisely.",
        test_prompt: "",
    });
    const setAi = (patch: Partial<AiValues>) => setAiValues((v) => ({ ...v, ...patch }));
    const selectedProvider = aiValues.provider;

    useEffect(() => {
        const tabParam = new URLSearchParams(window.location.search).get("tab");
        if (tabParam && ["company", "booking", "ai", "migration", "account"].includes(tabParam)) {
            setActiveTab(tabParam);
        }
        void loadCompanyInfo();
        void loadAISettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCompanyInfo = async () => {
        try {
            setLoading(true);
            setCompanyLoadError(null);
            const data = await getCompanyInfo({ throwOnError: true });
            if (data) {
                setValues({ ...emptyCompany, ...data });
                setLogoPreview(data.logo_base64 || null);
            }
        } catch (error) {
            setCompanyLoadError(error instanceof ApiError && error.status === 401
                ? (language === "de" ? "Ihre Sitzung ist abgelaufen. Bitte erneut anmelden." : "Your session has expired. Please sign in again.")
                : (language === "de" ? "Die Firmendaten konnten nicht geladen werden. Bitte erneut laden, bevor Sie Änderungen speichern." : "Company details could not be loaded. Reload them before saving changes."));
        } finally {
            setLoading(false);
        }
    };

    const loadAISettings = async () => {
        try {
            setAiLoading(true);
            const data = await getAISettings();
            if (data) {
                setAiValues((v) => ({
                    ...v,
                    provider: data.provider,
                    model: data.model,
                    base_url: data.base_url || "http://localhost:11434/v1",
                    system_prompt: data.system_prompt,
                    api_key: "",
                }));
                setAiKeyConfigured(data.api_key_configured);
                setAiLocalAllowed(data.local_ai_allowed ?? true);
                setAiDailyUsage(data.daily_usage || null);
                if (data.model_presets) {
                    setAiModelPresets(data.model_presets);
                }
            }
        } catch (error) {
            console.error("Error loading AI settings:", error);
            toast.error(t("settings.aiLoadError"));
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (loading || companyLoadError) return;
        const nextErrors: Partial<Record<keyof CompanyValues, string>> = {};
        if (!values.name.trim()) nextErrors.name = t("settings.required");
        if (!values.address_line1.trim()) nextErrors.address_line1 = t("settings.required");
        if (!values.postal_code.trim()) nextErrors.postal_code = t("settings.required");
        if (!values.city.trim()) nextErrors.city = t("settings.required");
        if (!values.email.trim()) nextErrors.email = t("settings.required");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = t("settings.invalidEmail");
        if (!values.bank_iban.trim()) nextErrors.bank_iban = t("settings.required");
        if (!values.payment_terms_default.trim()) nextErrors.payment_terms_default = t("settings.required");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSaving(true);
        setCompanySaveError(null);
        try {
            const saved = await saveCompanyInfo({
                ...values,
                logo_base64: logoPreview || "",
            });
            setValues({ ...emptyCompany, ...saved });
            toast.success(t("settings.saved"));
        } catch (error) {
            setCompanySaveError(error instanceof ApiError
                ? (error.status === 401
                    ? (language === "de" ? "Ihre Sitzung ist abgelaufen. Bitte erneut anmelden." : "Your session has expired. Please sign in again.")
                    : error.message)
                : (language === "de" ? "Speichern fehlgeschlagen. Bitte die Verbindung prüfen und erneut versuchen. Ihre Eingaben bleiben erhalten." : "Save failed. Check your connection and try again. Your entries have been kept."));
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (file: File) => {
        void (async () => {
            try {
                const normalized = await normalizeLogoFile(file);
                setLogoPreview(normalized);
            } catch (error) {
                if (error instanceof LogoError && error.code === "size") {
                    toast.error(t("settings.imageTooLarge"));
                } else {
                    toast.error(t("settings.imageFormatUnsupported"));
                }
            }
        })();
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
    };

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const confirmDeleteAccount = async () => {
        setDeleting(true);
        try {
            await deleteAccount();
            toast.success(t("settings.accountDeleted"));
            window.location.href = "/";
        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error(t("settings.deleteError"));
            // Keep confirmation open; do not imply completion on failure.
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveAISettings = async (event: React.FormEvent) => {
        event.preventDefault();
        setAiSaving(true);
        try {
            const saved = await saveAISettings({
                provider: aiValues.provider,
                model: aiValues.model,
                base_url: aiValues.base_url,
                api_key: aiValues.api_key,
                system_prompt: aiValues.system_prompt,
            });
            setAi({ api_key: "" });
            setAiKeyConfigured(saved.api_key_configured);
            setAiLocalAllowed(saved.local_ai_allowed ?? true);
            setAiDailyUsage(saved.daily_usage || null);
            if (saved.model_presets) {
                setAiModelPresets(saved.model_presets);
            }
            toast.success(t("settings.aiSaved"));
        } catch (error) {
            console.error("Error saving AI settings:", error);
            toast.error(error instanceof Error ? error.message : t("settings.aiTestError"));
        } finally {
            setAiSaving(false);
        }
    };

    const handleTestAI = async () => {
        const prompt = aiValues.test_prompt?.trim();
        if (!prompt) {
            toast.error(t("settings.required"));
            return;
        }

        setAiTesting(true);
        try {
            const result = await testAI(prompt);
            setAiResponse(result.content);
            const refreshedSettings = await getAISettings();
            if (refreshedSettings?.daily_usage) {
                setAiDailyUsage(refreshedSettings.daily_usage);
            }
            toast.success(t("settings.aiTestSuccess"));
        } catch (error) {
            console.error("Error testing AI:", error);
            setAiResponse("");
            toast.error(error instanceof Error ? error.message : t("settings.aiTestError"));
        } finally {
            setAiTesting(false);
        }
    };

    const handleResendVerification = async () => {
        setVerifySending(true);
        try {
            const res = await fetch("/api/auth/verification", { method: "POST" });
            if (!res.ok) throw new Error("send failed");
            toast.success(t("verify.sent"));
        } catch {
            toast.error(t("verify.sendFailed"));
        } finally {
            setVerifySending(false);
        }
    };

    const providerOptions = [
        { value: "ollama", label: t("settings.aiProviderOllama"), disabled: !aiLocalAllowed },
        { value: "openai", label: t("settings.aiProviderOpenAI") },
        { value: "anthropic", label: t("settings.aiProviderAnthropic") },
        { value: "openrouter", label: t("settings.aiProviderOpenRouter") },
    ];
    const modelOptions = aiModelPresets[selectedProvider] || [];
    const formDisabled = loading || !!companyLoadError;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-semibold">{t("settings.title")}</h2>
                <HelpLink href="/hilfe/erste-schritte#firma" label="Hilfe zur Einrichtung" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap">
                    <TabsTrigger value="company"><Building2 />{t("settings.company")}</TabsTrigger>
                    {isTermineEnabled() && (
                        <TabsTrigger value="booking">
                            <CalendarDays />
                            {language === "de" ? "Online-Buchung & Termine" : "Online Booking"}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="ai"><Bot />{t("settings.ai")}</TabsTrigger>
                    <TabsTrigger value="account"><User />{t("settings.account")}</TabsTrigger>
                    <TabsTrigger value="migration"><ArrowLeftRight />{t("dashboard.migration")}</TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="flex flex-col gap-4">
                    {companyLoadError && (
                        <Alert variant="destructive">
                            <AlertTitle>{companyLoadError}</AlertTitle>
                            <AlertDescription>
                                <Button type="button" size="sm" className="mt-2" disabled={loading} onClick={() => void loadCompanyInfo()}>
                                    {loading && <Loader2 className="animate-spin" />}
                                    {language === "de" ? "Erneut laden" : "Retry"}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {companySaveError && (
                        <Alert variant="destructive">
                            <AlertTitle>{companySaveError}</AlertTitle>
                        </Alert>
                    )}

                    <form onSubmit={handleSave} className={formDisabled ? "pointer-events-none flex flex-col gap-4 opacity-60" : "flex flex-col gap-4"} noValidate>
                        {/* Logo */}
                        <Card>
                            <CardContent className="flex flex-wrap items-center gap-4">
                                {logoPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logoPreview} alt="Logo" className="size-20 rounded-lg object-contain" />
                                ) : (
                                    <div className="dashboard-logo-placeholder flex size-20 items-center justify-center rounded-lg">
                                        <Building2 className="size-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex flex-col items-start gap-2">
                                    <label className="inline-flex cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleLogoUpload(file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium hover:bg-accent">
                                            <Upload className="size-4" />
                                            {t("settings.uploadLogo")}
                                        </span>
                                    </label>
                                    {logoPreview && (
                                        <Button type="button" variant="destructive" size="sm" onClick={handleRemoveLogo}>
                                            <Trash2 />
                                            {t("settings.removeLogo")}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Field label={t("settings.companyName")} htmlFor="co-name" error={errors.name}>
                            <Input id="co-name" placeholder={t("settings.companyName")} value={values.name}
                                onChange={(e) => set({ name: e.target.value })} aria-invalid={!!errors.name} />
                        </Field>

                        <Field label={t("settings.legalForm")} htmlFor="co-legal">
                            <Input id="co-legal" placeholder={t("settings.legalFormPlaceholder")} value={values.legal_form ?? ""}
                                onChange={(e) => set({ legal_form: e.target.value })} />
                        </Field>

                        <Separator>{t("settings.address")}</Separator>

                        <Field label={t("settings.address")} htmlFor="co-addr1" error={errors.address_line1}>
                            <Input id="co-addr1" placeholder={t("settings.streetNumber")} value={values.address_line1}
                                onChange={(e) => set({ address_line1: e.target.value })} aria-invalid={!!errors.address_line1} />
                        </Field>

                        <Field label={t("settings.addressExtra")} htmlFor="co-addr2">
                            <Input id="co-addr2" placeholder={t("settings.addressExtra")} value={values.address_line2 ?? ""}
                                onChange={(e) => set({ address_line2: e.target.value })} />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                            <Field label={t("settings.postalCode")} htmlFor="co-postal" error={errors.postal_code}>
                                <Input id="co-postal" placeholder="12345" value={values.postal_code}
                                    onChange={(e) => set({ postal_code: e.target.value })} aria-invalid={!!errors.postal_code} />
                            </Field>
                            <Field label={t("settings.city")} htmlFor="co-city" error={errors.city}>
                                <Input id="co-city" placeholder={t("settings.city")} value={values.city}
                                    onChange={(e) => set({ city: e.target.value })} aria-invalid={!!errors.city} />
                            </Field>
                        </div>

                        <Field label={t("settings.country")}>
                            <Select value={values.country} onValueChange={(v) => set({ country: v })}>
                                <SelectTrigger aria-label={t("settings.country")}><SelectValue placeholder={t("settings.country")} /></SelectTrigger>
                                <SelectContent>
                                    {euCountryOptions(language, values.country).map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Separator>{t("settings.contact")}</Separator>

                        <Field label={t("settings.email")} htmlFor="co-email" error={errors.email}>
                            <Input id="co-email" placeholder="info@company.com" value={values.email ?? ""}
                                onChange={(e) => set({ email: e.target.value })} aria-invalid={!!errors.email} />
                        </Field>

                        <Field label={t("settings.phone")} htmlFor="co-phone">
                            <Input id="co-phone" placeholder="+49 30 123456" value={values.phone ?? ""}
                                onChange={(e) => set({ phone: e.target.value })} />
                        </Field>

                        <Field label={t("settings.website")} htmlFor="co-website">
                            <Input id="co-website" placeholder="https://www.company.com" value={values.website ?? ""}
                                onChange={(e) => set({ website: e.target.value })} />
                        </Field>

                        <Separator>{t("settings.taxInfo")}</Separator>

                        <div className="grid items-start gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-4">
                                <EInvoiceFieldsControlled seller value={values.e_invoice} onChange={(e_invoice) => set({ e_invoice })} />
                                <Field label={t("settings.vatId")} htmlFor="co-vat">
                                    <Input id="co-vat" placeholder="DE123456789" value={values.vat_id ?? ""}
                                        onChange={(e) => set({ vat_id: e.target.value })} />
                                </Field>
                            </div>
                            <Field label={t("settings.taxNumber")} htmlFor="co-tax">
                                <Input id="co-tax" placeholder="12/345/67890" value={values.tax_number ?? ""}
                                    onChange={(e) => set({ tax_number: e.target.value })} />
                            </Field>
                        </div>

                        <Field label={t("settings.commercialRegister")} htmlFor="co-register">
                            <Input id="co-register" placeholder="HRB 12345" value={values.commercial_register_number ?? ""}
                                onChange={(e) => set({ commercial_register_number: e.target.value })} />
                        </Field>

                        <Field label={t("settings.registryCourt")} htmlFor="co-court">
                            <Input id="co-court" placeholder={t("settings.registryCourt")} value={values.registry_court ?? ""}
                                onChange={(e) => set({ registry_court: e.target.value })} />
                        </Field>

                        <Field label={t("settings.managingDirectors")} htmlFor="co-directors">
                            <Input id="co-directors" placeholder={t("settings.managingDirectors")} value={values.managing_directors ?? ""}
                                onChange={(e) => set({ managing_directors: e.target.value })} />
                        </Field>

                        <Separator>{t("settings.bankDetails")}</Separator>

                        <Field label={t("settings.bankName")} htmlFor="co-bank">
                            <Input id="co-bank" placeholder={t("settings.bankName")} value={values.bank_name ?? ""}
                                onChange={(e) => set({ bank_name: e.target.value })} />
                        </Field>

                        <Field label={t("settings.iban")} htmlFor="co-iban" hint={t("settings.ibanGirocodeHelp")} error={errors.bank_iban}>
                            <Input id="co-iban" placeholder="DE89 3704 0044 0532 0130 00" value={values.bank_iban ?? ""}
                                onChange={(e) => set({ bank_iban: e.target.value })} aria-invalid={!!errors.bank_iban} />
                        </Field>

                        <Field label={t("settings.bic")} htmlFor="co-bic">
                            <Input id="co-bic" placeholder="COBADEFFXXX" value={values.bank_bic ?? ""}
                                onChange={(e) => set({ bank_bic: e.target.value })} />
                        </Field>

                        <Separator>{t("settings.invoiceSettings")}</Separator>

                        <Field label={t("settings.paymentTerms")} htmlFor="co-terms" error={errors.payment_terms_default}>
                            <Textarea id="co-terms" placeholder={t("settings.paymentTermsPlaceholder")} rows={2}
                                value={values.payment_terms_default ?? ""}
                                onChange={(e) => set({ payment_terms_default: e.target.value })}
                                aria-invalid={!!errors.payment_terms_default} />
                        </Field>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label htmlFor="co-small">{t("settings.smallBusiness")}</Label>
                                <p className="text-xs text-muted-foreground">{t("settings.smallBusinessHint")}</p>
                            </div>
                            <Switch id="co-small" checked={!!values.is_small_business}
                                onCheckedChange={(checked) => set(checked ? { is_small_business: true, is_flat_rate_farming: false } : { is_small_business: false })} />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label htmlFor="co-flat">{t("settings.flatRateFarming")}</Label>
                                <p className="text-xs text-muted-foreground">{t("settings.flatRateFarmingHint")}</p>
                            </div>
                            <Switch id="co-flat" checked={!!values.is_flat_rate_farming}
                                onCheckedChange={(checked) => set(checked ? { is_flat_rate_farming: true, is_small_business: false } : { is_flat_rate_farming: false })} />
                        </div>

                        <Separator>{t("settings.numberingTitle")}</Separator>
                        <NumberingSection t={t} values={values} set={set} />

                        <div className="pt-2">
                            <Button type="submit" size="lg" disabled={saving || formDisabled}>
                                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                                {t("settings.save")}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                {isTermineEnabled() && (
                    <TabsContent value="booking">
                        <OnlineBookingSettingsTab />
                    </TabsContent>
                )}

                <TabsContent value="ai" className="flex flex-col gap-4">
                    <form onSubmit={handleSaveAISettings} className={aiLoading ? "pointer-events-none flex flex-col gap-4 opacity-60" : "flex flex-col gap-4"} noValidate>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.aiTitle")}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <p className="text-sm text-muted-foreground">{t("settings.aiDescription")}</p>
                                <Separator />

                                {aiDailyUsage && (
                                    <Card>
                                        <CardContent className="flex flex-col gap-1.5">
                                            <p className="font-semibold">{t("settings.aiUsageTitle")}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t("settings.aiUsageSummary")
                                                    .replace("{used}", String(aiDailyUsage.used))
                                                    .replace("{limit}", String(aiDailyUsage.limit))
                                                    .replace("{remaining}", String(aiDailyUsage.remaining))}
                                            </p>
                                            <Progress
                                                value={aiDailyUsage.limit > 0 ? Math.min(100, (aiDailyUsage.used / aiDailyUsage.limit) * 100) : 0}
                                                className={aiDailyUsage.remaining === 0 ? "[&>[data-slot=progress-indicator]]:bg-destructive" : undefined}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                <Field label={t("settings.aiProvider")}>
                                    <Select
                                        value={selectedProvider}
                                        onValueChange={(value) => {
                                            const provider = value as AIProvider;
                                            const presets = aiModelPresets[provider] || [];
                                            const patch: Partial<AiValues> = { provider };
                                            if (presets.length > 0 && !presets.includes(aiValues.model)) {
                                                patch.model = presets[0];
                                            }
                                            if (provider === "ollama" && !aiValues.base_url) {
                                                patch.base_url = "http://localhost:11434/v1";
                                            }
                                            setAi(patch);
                                        }}
                                    >
                                        <SelectTrigger aria-label={t("settings.aiProvider")}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {providerOptions.map((o) => (
                                                <SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                {!aiLocalAllowed && (
                                    <Alert>
                                        <AlertTitle>{t("settings.aiOllamaHostedTitle")}</AlertTitle>
                                        <AlertDescription>{t("settings.aiOllamaHostedBody")}</AlertDescription>
                                    </Alert>
                                )}

                                {selectedProvider === "ollama" && aiLocalAllowed && (
                                    <>
                                        <Alert>
                                            <AlertTitle>{t("settings.aiLocalPrivacyBadge")}</AlertTitle>
                                        </Alert>
                                        <Card className="dashboard-success-panel">
                                            <CardContent className="flex flex-col gap-1.5">
                                                <p className="font-semibold text-emerald-600">
                                                    ⭐ Empfohlenes Modell: <code>jonprompter/Rechly-DE-3B</code>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Speziell trainiert für deutsche Rechnungen, GoBD &amp; §19 UStG.
                                                    Terminal-Befehl zum Starten:
                                                </p>
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ollama run jonprompter/Rechly-DE-3B</code>
                                                <div className="mt-1 flex gap-3 text-xs">
                                                    <a href="https://ollama.com/jonprompter/Rechly-DE-3B" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                                        Ollama Modell-Seite ↗
                                                    </a>
                                                    <a href="https://huggingface.co/jonprompter/rechly-de-3b" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                                        Hugging Face Repo ↗
                                                    </a>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}

                                <Field label={t("settings.aiModel")} htmlFor="ai-model">
                                    <>
                                        <Input
                                            id="ai-model"
                                            list="ai-model-presets"
                                            value={aiValues.model}
                                            onChange={(e) => setAi({ model: e.target.value })}
                                            placeholder={t("settings.aiModelPlaceholder")}
                                        />
                                        <datalist id="ai-model-presets">
                                            {modelOptions.map((model) => (
                                                <option key={model} value={model} />
                                            ))}
                                        </datalist>
                                    </>
                                </Field>

                                {selectedProvider === "ollama" && (
                                    <Field label={t("settings.aiBaseUrl")} htmlFor="ai-base" hint={t("settings.aiBaseUrlHelp")}>
                                        <Input id="ai-base" placeholder="http://localhost:11434/v1" value={aiValues.base_url ?? ""}
                                            onChange={(e) => setAi({ base_url: e.target.value })} />
                                    </Field>
                                )}

                                <Field label={t("settings.aiApiKey")} htmlFor="ai-key"
                                    hint={selectedProvider === "ollama" ? "Optional für lokale Server (Standard: nicht benötigt)" : t("settings.aiApiKeyHelp")}>
                                    <Input id="ai-key" type="password" value={aiValues.api_key ?? ""}
                                        onChange={(e) => setAi({ api_key: e.target.value })}
                                        placeholder={selectedProvider === "ollama" ? "Optional..." : "sk-..."} />
                                </Field>

                                <p className={aiKeyConfigured ? "text-sm text-emerald-600" : "text-sm text-muted-foreground"}>
                                    {aiKeyConfigured ? t("settings.aiConfigured") : t("settings.aiNotConfigured")}
                                </p>

                                <Field label={t("settings.aiSystemPrompt")} htmlFor="ai-prompt">
                                    <Textarea id="ai-prompt" rows={3} value={aiValues.system_prompt ?? ""}
                                        onChange={(e) => setAi({ system_prompt: e.target.value })}
                                        placeholder={t("settings.aiSystemPromptPlaceholder")} />
                                </Field>

                                <div>
                                    <Button type="submit" disabled={aiSaving || aiLoading}>
                                        {aiSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                        {t("settings.aiSave")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.aiTestRun")}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Field label={t("settings.aiTestPrompt")} htmlFor="ai-test">
                                <Textarea id="ai-test" rows={4} value={aiValues.test_prompt ?? ""}
                                    onChange={(e) => setAi({ test_prompt: e.target.value })}
                                    placeholder={t("settings.aiTestPromptPlaceholder")} />
                            </Field>
                            <div>
                                <Button type="button" variant="outline" disabled={aiTesting} onClick={() => void handleTestAI()}>
                                    {aiTesting ? <Loader2 className="animate-spin" /> : <Bot />}
                                    {t("settings.aiTestRun")}
                                </Button>
                            </div>
                            {aiResponse && (
                                <Card>
                                    <CardContent className="flex flex-col gap-2">
                                        <p className="font-semibold">{t("settings.aiResponse")}</p>
                                        <div className="text-sm whitespace-pre-wrap">{aiResponse}</div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="account" className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.accountInfo")}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("settings.accountEmail")}</p>
                                <p className="font-semibold">{user?.email || t("settings.guest")}</p>
                                {user?.email && (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        {user.emailVerification ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{t("verify.verifiedBadge")}</Badge>
                                        ) : (
                                            <>
                                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">{t("verify.unverifiedBadge")}</Badge>
                                                <Button type="button" size="sm" variant="outline" disabled={verifySending} onClick={() => void handleResendVerification()}>
                                                    {verifySending && <Loader2 className="animate-spin" />}
                                                    {t("verify.resend")}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("settings.accountId")}</p>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{user?.$id}</code>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.logout")}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-start gap-4">
                            <p className="text-sm text-muted-foreground">{t("settings.logoutDesc")}</p>
                            <Button type="button" variant="destructive" onClick={() => void handleLogout()}>
                                {t("settings.logout")}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">{t("settings.deleteAccount")}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-start gap-4">
                            <p className="text-sm text-muted-foreground">{t("settings.deleteAccountWarning")}</p>
                            <Button type="button" variant="destructive" disabled={deleting} onClick={() => setDeleteOpen(true)}>
                                {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                                {t("settings.deleteAccount")}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="migration">
                    <MigrationWizard compact />
                </TabsContent>
            </Tabs>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("settings.deleteAccountTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="flex flex-col gap-2">
                                <span>{t("settings.deleteAccountConfirm")}</span>
                                <span className="font-medium text-destructive">{t("settings.deleteAccountWarning")}</span>
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("settings.deleteAccountCancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={deleting} onClick={() => void confirmDeleteAccount()}>
                            {deleting && <Loader2 className="animate-spin" />}
                            {t("settings.deleteAccountButton")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
