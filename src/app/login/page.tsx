"use client";

import { useState, useEffect, Suspense } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Globe, Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDesktopRuntime } from "@/lib/runtime";
import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";
import { logger } from "@/lib/logger";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, loginAnonymously } = useAuth();
    const { t, language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const [guestModalVisible, setGuestModalVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    useEffect(() => {
        const allParams = Object.fromEntries(searchParams.entries());
        if (Object.keys(allParams).length > 0) {
            logger.debug("Login page URL params:", allParams);
        }
        const errorParam = searchParams.get("error");
        if (errorParam) {
            logger.debug("OAuth error param:", errorParam);
            try {
                const decodedError = decodeURIComponent(errorParam);
                try {
                    const error = JSON.parse(decodedError);
                    if (error.type === "user_already_exists") {
                        toast.info(t("auth.accountExists"));
                    } else {
                        toast.error(error.message || t("auth.loginFailed"));
                    }
                } catch {
                    const lowerError = decodedError.toLowerCase();
                    if (
                        lowerError.includes("user_already_exists") ||
                        lowerError.includes("already exists") ||
                        lowerError.includes("existiert bereits")
                    ) {
                        toast.info(t("auth.accountExists"));
                    } else {
                        toast.error(decodedError || t("auth.loginFailed"));
                    }
                }
            } catch {
                toast.error(t("auth.loginFailed"));
            }
            router.replace("/login");
        }
    }, [searchParams, router, t]);

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            toast.success(t("auth.loginSuccess"));
            router.push("/dashboard");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : t("auth.loginFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors: { email?: string; password?: string } = {};
        if (!email) {
            nextErrors.email = t("auth.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = t("auth.emailInvalid");
        }
        if (!password) {
            nextErrors.password = t("auth.passwordRequired");
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        void onFinish({ email, password });
    };

    const handleGuestLogin = async () => {
        setGuestLoading(true);
        try {
            await loginAnonymously();
            toast.success(t("auth.guestSuccess"));
            router.push("/dashboard");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : t("auth.guestFailed"));
        } finally {
            setGuestLoading(false);
            setGuestModalVisible(false);
        }
    };

    return (
        <AuthShell
            mode="login"
            title={l("Willkommen zurück", "Welcome back")}
            subtitle={l(
                "Melde dich an, um Rechnungen, Kunden und Termine weiter zu verwalten.",
                "Log in to continue managing invoices, clients and appointments.",
            )}
            footer={
                <p className="mt-[22px] text-center text-sm text-[#5b6b82]">
                    {t("auth.noAccount")}{" "}
                    <Link href="/register" className="font-semibold">
                        {t("auth.signUpNow")}
                    </Link>
                </p>
            }
        >
            <form name="login" onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="login-email">{t("auth.email")}</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="login-email"
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
                    <Label htmlFor="login-password">{t("auth.password")}</Label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="login-password"
                            type="password"
                            className="h-11 pl-10"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            aria-invalid={!!errors.password}
                        />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {!isDesktopRuntime && (
                    <div className="-mt-2 text-right">
                        <Link href="/forgot-password" className="text-[13.5px] font-semibold">
                            {l("Passwort vergessen?", "Forgot your password?")}
                        </Link>
                    </div>
                )}

                <Button type="submit" className="h-[46px] w-full" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {t("auth.login")}
                </Button>
            </form>

            {!isDesktopRuntime && (
                <>
                    <div className="flex items-center gap-3 py-4">
                        <Separator className="flex-1" />
                        <span className="text-[13px] text-[#8494ab]">{t("auth.or")}</span>
                        <Separator className="flex-1" />
                    </div>
                    <div className="flex w-full flex-col gap-4">
                        <Button variant="outline" size="lg" asChild className="w-full">
                            <a href="/api/auth/google">
                                <Globe />
                                {t("auth.withGoogle")}
                            </a>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full" onClick={() => setGuestModalVisible(true)} disabled={guestLoading}>
                            {guestLoading ? <Loader2 className="animate-spin" /> : <User />}
                            {t("auth.asGuest")}
                        </Button>
                    </div>
                </>
            )}

            <Dialog open={guestModalVisible} onOpenChange={setGuestModalVisible}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" />
                            {t("guest.warningTitle")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="mb-3 text-[15px] font-semibold">{t("guest.warningMain")}</p>
                        <p className="text-muted-foreground">{t("guest.warningIntro")}</p>
                        <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                            <li>{t("guest.warningPoint1")}</li>
                            <li>{t("guest.warningPoint2")}</li>
                            <li>{t("guest.warningPoint3")}</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">{t("guest.warningNote")}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGuestModalVisible(false)}>
                            {t("guest.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleGuestLogin} disabled={guestLoading}>
                            {guestLoading && <Loader2 className="animate-spin" />}
                            {t("guest.continue")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="size-8 animate-spin" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
