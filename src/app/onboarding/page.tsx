"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, User, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCompanyInfo, saveCompanyInfo } from "@/lib/companyService";
import { euCountryOptions } from "@/lib/euCountries";
import { ApiError } from "@/lib/apiClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Steps } from "@/components/ui/steps";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type FormValues = {
    company_name: string;
    owner_name: string;
    street: string;
    postal_code: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    tax_id: string;
    vat_id: string;
    bank_name: string;
    iban: string;
    bic: string;
};

const initialValues: FormValues = {
    company_name: "",
    owner_name: "",
    street: "",
    postal_code: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
    tax_id: "",
    vat_id: "",
    bank_name: "",
    iban: "",
    bic: "",
};

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { language } = useLanguage();
    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const setField = (field: keyof FormValues, value: string) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const content = {
        de: {
            title: "Willkommen bei Rechly!",
            subtitle:
                "Richte dein Unternehmensprofil ein, um Rechnungen erstellen zu können.",
            step1: "Unternehmen",
            step2: "Kontakt",
            step3: "Fertig",
            companyName: "Firmenname",
            companyNamePlaceholder: "z.B. Musterfirma GmbH",
            companyNameRequired: "Bitte Firmennamen eingeben",
            ownerName: "Inhaber / Geschäftsführer",
            ownerNamePlaceholder: "Max Mustermann",
            street: "Straße & Hausnummer",
            streetPlaceholder: "Musterstraße 123",
            streetRequired: "Bitte Adresse eingeben",
            postalCode: "PLZ",
            postalCodePlaceholder: "12345",
            postalCodeRequired: "Bitte PLZ eingeben",
            city: "Stadt",
            cityPlaceholder: "Berlin",
            cityRequired: "Bitte Stadt eingeben",
            country: "Land",
            countryPlaceholder: "Deutschland",
            email: "E-Mail",
            emailPlaceholder: "kontakt@firma.de",
            phone: "Telefon",
            phonePlaceholder: "+49 123 456789",
            taxId: "Steuernummer",
            taxIdPlaceholder: "12/345/67890",
            vatId: "USt-IdNr.",
            vatIdPlaceholder: "DE123456789",
            bankName: "Bank",
            bankNamePlaceholder: "Sparkasse",
            iban: "IBAN",
            ibanPlaceholder: "DE89 3704 0044 0532 0130 00",
            ibanHelp:
                "Wird für den GiroCode (SEPA-QR-Zahlungscode) auf Ihren Rechnungen verwendet.",
            bic: "BIC",
            bicPlaceholder: "COBADEFFXXX",
            next: "Weiter",
            back: "Zurück",
            finish: "Loslegen",
            skip: "Später ausfüllen",
            successTitle: "Alles bereit!",
            successText: "Du kannst jetzt deine erste Rechnung erstellen.",
            gotoDashboard: "Zum Dashboard",
        },
        en: {
            title: "Welcome to Rechly!",
            subtitle: "Set up your company profile to start creating invoices.",
            step1: "Company",
            step2: "Contact",
            step3: "Done",
            companyName: "Company Name",
            companyNamePlaceholder: "e.g. Acme Inc.",
            companyNameRequired: "Please enter company name",
            ownerName: "Owner / Director",
            ownerNamePlaceholder: "John Doe",
            street: "Street & Number",
            streetPlaceholder: "123 Main Street",
            streetRequired: "Please enter address",
            postalCode: "Postal Code",
            postalCodePlaceholder: "12345",
            postalCodeRequired: "Please enter postal code",
            city: "City",
            cityPlaceholder: "Berlin",
            cityRequired: "Please enter city",
            country: "Country",
            countryPlaceholder: "Germany",
            email: "Email",
            emailPlaceholder: "contact@company.com",
            phone: "Phone",
            phonePlaceholder: "+49 123 456789",
            taxId: "Tax ID",
            taxIdPlaceholder: "12/345/67890",
            vatId: "VAT ID",
            vatIdPlaceholder: "DE123456789",
            bankName: "Bank",
            bankNamePlaceholder: "Deutsche Bank",
            iban: "IBAN",
            ibanPlaceholder: "DE89 3704 0044 0532 0130 00",
            ibanHelp:
                "Used for the GiroCode (SEPA QR payment code) on your invoices.",
            bic: "BIC",
            bicPlaceholder: "COBADEFFXXX",
            next: "Next",
            back: "Back",
            finish: "Get Started",
            skip: "Fill in later",
            successTitle: "All set!",
            successText: "You can now create your first invoice.",
            gotoDashboard: "Go to Dashboard",
        },
    };

    const t = content[language];

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            checkExistingCompany();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, router]);

    const checkExistingCompany = async () => {
        try {
            const companyInfo = await getCompanyInfo();
            if (companyInfo?.name) {
                // Already has company info, redirect to dashboard
                router.push("/dashboard");
                return;
            }
        } catch (error) {
            console.error("Error checking company info:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        const newErrors: Partial<Record<keyof FormValues, string>> = {};
        if (!values.company_name) newErrors.company_name = t.companyNameRequired;
        if (!values.street) newErrors.street = t.streetRequired;
        if (!values.postal_code) newErrors.postal_code = t.postalCodeRequired;
        if (!values.city) newErrors.city = t.cityRequired;
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            // Validation failed
            return;
        }
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            await saveCompanyInfo({
                name: values.company_name,
                managing_directors: values.owner_name,
                address_line1: values.street,
                postal_code: values.postal_code,
                city: values.city,
                country: values.country || "Deutschland",
                email: values.email,
                phone: values.phone,
                tax_number: values.tax_id,
                vat_id: values.vat_id,
                bank_name: values.bank_name,
                bank_iban: values.iban,
                bank_bic: values.bic,
                payment_terms_default:
                    "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
            });
            setCurrentStep(2);
        } catch (error) {
            console.error("Error saving company info:", error);
            toast.error(error instanceof ApiError ? error.message : "Fehler beim Speichern. Bitte die Verbindung prüfen und erneut versuchen.");
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        router.push("/dashboard");
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f5f5]">
                <Loader2 className="size-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#152438] px-5 py-10">
            <Card className="w-full max-w-[600px] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                <CardContent>
                    <div className="mb-8 text-center">
                        <h2 className="mb-2 text-2xl font-semibold text-[#152438]">{t.title}</h2>
                        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                    </div>

                    <Steps
                        current={currentStep}
                        className="mb-8"
                        items={[{ title: t.step1 }, { title: t.step2 }, { title: t.step3 }]}
                    />

                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* Step 1: Company Info */}
                        {currentStep === 0 && (
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="company_name">{t.companyName}</Label>
                                    <div className="relative">
                                        <Landmark className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="company_name"
                                            value={values.company_name}
                                            onChange={(e) => setField("company_name", e.target.value)}
                                            placeholder={t.companyNamePlaceholder}
                                            className="pl-10 h-11"
                                            aria-invalid={!!errors.company_name}
                                        />
                                    </div>
                                    {errors.company_name && <p className="text-sm text-destructive">{errors.company_name}</p>}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="owner_name">{t.ownerName}</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="owner_name"
                                            value={values.owner_name}
                                            onChange={(e) => setField("owner_name", e.target.value)}
                                            placeholder={t.ownerNamePlaceholder}
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="street">{t.street}</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="street"
                                            value={values.street}
                                            onChange={(e) => setField("street", e.target.value)}
                                            placeholder={t.streetPlaceholder}
                                            className="pl-10 h-11"
                                            aria-invalid={!!errors.street}
                                        />
                                    </div>
                                    {errors.street && <p className="text-sm text-destructive">{errors.street}</p>}
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="postal_code">{t.postalCode}</Label>
                                        <Input
                                            id="postal_code"
                                            value={values.postal_code}
                                            onChange={(e) => setField("postal_code", e.target.value)}
                                            placeholder={t.postalCodePlaceholder}
                                            className="h-11"
                                            aria-invalid={!!errors.postal_code}
                                        />
                                        {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code}</p>}
                                    </div>

                                    <div className="flex flex-[2] flex-col gap-2">
                                        <Label htmlFor="city">{t.city}</Label>
                                        <Input
                                            id="city"
                                            value={values.city}
                                            onChange={(e) => setField("city", e.target.value)}
                                            placeholder={t.cityPlaceholder}
                                            className="h-11"
                                            aria-invalid={!!errors.city}
                                        />
                                        {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="country">{t.country}</Label>
                                    <Select value={values.country} onValueChange={(v) => setField("country", v)}>
                                        <SelectTrigger id="country" className="w-full h-11">
                                            <SelectValue placeholder={t.countryPlaceholder} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {euCountryOptions(language).map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Contact & Bank Info */}
                        {currentStep === 1 && (
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-4">
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="email">{t.email}</Label>
                                        <Input
                                            id="email"
                                            value={values.email}
                                            onChange={(e) => setField("email", e.target.value)}
                                            placeholder={t.emailPlaceholder}
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="phone">{t.phone}</Label>
                                        <Input
                                            id="phone"
                                            value={values.phone}
                                            onChange={(e) => setField("phone", e.target.value)}
                                            placeholder={t.phonePlaceholder}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="tax_id">{t.taxId}</Label>
                                        <Input
                                            id="tax_id"
                                            value={values.tax_id}
                                            onChange={(e) => setField("tax_id", e.target.value)}
                                            placeholder={t.taxIdPlaceholder}
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="flex flex-1 flex-col gap-2">
                                        <Label htmlFor="vat_id">{t.vatId}</Label>
                                        <Input
                                            id="vat_id"
                                            value={values.vat_id}
                                            onChange={(e) => setField("vat_id", e.target.value)}
                                            placeholder={t.vatIdPlaceholder}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="bank_name">{t.bankName}</Label>
                                    <Input
                                        id="bank_name"
                                        value={values.bank_name}
                                        onChange={(e) => setField("bank_name", e.target.value)}
                                        placeholder={t.bankNamePlaceholder}
                                        className="h-11"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="iban">{t.iban}</Label>
                                    <Input
                                        id="iban"
                                        value={values.iban}
                                        onChange={(e) => setField("iban", e.target.value)}
                                        placeholder={t.ibanPlaceholder}
                                        className="h-11"
                                    />
                                    <p className="text-sm text-muted-foreground">{t.ibanHelp}</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="bic">{t.bic}</Label>
                                    <Input
                                        id="bic"
                                        value={values.bic}
                                        onChange={(e) => setField("bic", e.target.value)}
                                        placeholder={t.bicPlaceholder}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {currentStep === 2 && (
                            <div className="py-10 text-center">
                                <CheckCircle2 className="mx-auto mb-6 size-16 text-[#52c41a]" />
                                <h3 className="text-xl font-semibold">{t.successTitle}</h3>
                                <p className="text-sm text-muted-foreground">{t.successText}</p>
                            </div>
                        )}
                    </form>

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex justify-between">
                        {currentStep === 0 && (
                            <>
                                <Button variant="outline" onClick={handleSkip}>{t.skip}</Button>
                                <Button onClick={handleNext}>{t.next}</Button>
                            </>
                        )}

                        {currentStep === 1 && (
                            <>
                                <Button variant="outline" onClick={handleBack}>{t.back}</Button>
                                <Button onClick={handleFinish} disabled={saving}>
                                    {saving && <Loader2 className="animate-spin" />}
                                    {t.finish}
                                </Button>
                            </>
                        )}

                        {currentStep === 2 && (
                            <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
                                {t.gotoDashboard}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
