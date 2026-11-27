"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDesktopRuntime } from "@/lib/runtime";
import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";

type RegisterErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptPolicy?: string;
};

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const { t, language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [acceptPolicy, setAcceptPolicy] = useState(false);
    const [errors, setErrors] = useState<RegisterErrors>({});

    const onFinish = async (values: { name: string; email: string; password: string }) => {
        setLoading(true);
        try {
            await register(values.email, values.password, values.name);
            toast.success(t("auth.registerSuccess"));
            router.push("/onboarding");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : t("auth.registerFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors: RegisterErrors = {};
        if (!name) {
            nextErrors.name = t("auth.nameRequired");
        }
        if (!email) {
            nextErrors.email = t("auth.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = t("auth.emailInvalid");
        }
        if (!password) {
            nextErrors.password = t("auth.passwordRequired");
        } else if (password.length < 8) {
            nextErrors.password = t("auth.passwordMin");
        }
        if (!confirmPassword) {
            nextErrors.confirmPassword = t("auth.confirmPasswordRequired");
        } else if (password !== confirmPassword) {
            nextErrors.confirmPassword = t("auth.passwordMismatch");
        }
        if (!acceptPolicy) {
            nextErrors.acceptPolicy = t("auth.acceptPolicyRequired");
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        void onFinish({ name, email, password });
    };

    return (
        <AuthShell
            mode="register"
            title={l("Kostenloses Konto erstellen", "Create your free account")}
            subtitle={l(
                "In zwei Minuten zur ersten Rechnung. Kein Abo, keine Kreditkarte, keine Limits.",
                "Your first invoice in two minutes. No subscription, no credit card, no limits.",
            )}
            footer={
                <p className="mt-[22px] text-center text-sm text-[#5b6b82]">
                    {t("auth.hasAccount")}{" "}
                    <Link href="/login" className="font-semibold">
                        {t("auth.signInNow")}
                    </Link>
                </p>
            }
        >
            <form name="register" onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="register-name">{t("auth.fullName")}</Label>
                    <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="register-name"
                            className="h-11 pl-10"
                            placeholder="Max Mustermann"
                            autoComplete="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            aria-invalid={!!errors.name}
                        />
                    </div>
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="register-email">{t("auth.email")}</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="register-email"
                            className="h-11 pl-10"
                            placeholder="name@firma.de"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            aria-invalid={!!errors.email}
                        />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="register-password">{t("auth.password")}</Label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="register-password"
                            type="password"
                            className="h-11 pl-10"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            aria-invalid={!!errors.password}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">{l("Mindestens 8 Zeichen.", "At least 8 characters.")}</p>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="register-confirm-password">{t("auth.confirmPassword")}</Label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="register-confirm-password"
                            type="password"
                            className="h-11 pl-10"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            aria-invalid={!!errors.confirmPassword}
                        />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="register-accept-policy"
                            checked={acceptPolicy}
                            onCheckedChange={(checked) => setAcceptPolicy(checked === true)}
                            aria-invalid={!!errors.acceptPolicy}
                            className="mt-0.5"
                        />
                        <span className="text-[13px] leading-[1.55]">
                            {t("auth.acceptPolicyPrefix")}{" "}
                            <Link href="/agb" target="_blank" rel="noopener noreferrer">
                                {t("auth.termsLink")}
                            </Link>{" "}
                            {t("auth.acceptPolicyAnd")}{" "}
                            <Link href="/datenschutz" target="_blank" rel="noopener noreferrer">
                                {t("auth.privacyLink")}
                            </Link>
                            {t("auth.acceptPolicyOpenSource")}
                        </span>
                    </div>
                    {errors.acceptPolicy && <p className="text-sm text-destructive">{errors.acceptPolicy}</p>}
                </div>

                <Button type="submit" className="h-[46px] w-full" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {l("Kostenlos registrieren", "Create free account")}
                </Button>
            </form>

            {!isDesktopRuntime && (
                <>
                    <div className="flex items-center gap-3 py-4">
                        <Separator className="flex-1" />
                        <span className="text-[13px] text-[#8494ab]">{t("auth.or")}</span>
                        <Separator className="flex-1" />
                    </div>
                    <div className="flex w-full flex-col gap-2">
                        <Button variant="outline" size="lg" asChild className="w-full">
                            <a href="/api/auth/google">
                                <Globe />
                                {t("auth.registerWithGoogle")}
                            </a>
                        </Button>
                        <p className="m-0 text-center text-xs text-[#8494ab]">
                            {t("auth.googlePolicyHint")}
                        </p>
                    </div>
                </>
            )}
        </AuthShell>
    );
}
