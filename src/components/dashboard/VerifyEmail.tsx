"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDesktopRuntime } from "@/lib/runtime";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DISMISS_KEY = "rechly-verify-banner-dismissed";

function useVerificationActions() {
    const { t } = useLanguage();
    const { refreshUser, user } = useAuth();
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);

    const resend = async () => {
        setSending(true);
        try {
            const res = await fetch("/api/auth/verification", { method: "POST" });
            if (!res.ok) throw new Error("send failed");
            toast.success(t("verify.sent"));
        } catch {
            toast.error(t("verify.sendFailed"));
        } finally {
            setSending(false);
        }
    };

    const checkNow = async () => {
        setChecking(true);
        try {
            await refreshUser();
            // refreshUser updates context async; read fresh status from the API to judge now.
            const res = await fetch("/api/auth/user");
            const fresh = res.ok ? await res.json() : null;
            if (fresh?.emailVerification) {
                toast.success(t("verify.verifiedBadge"));
            } else {
                toast.info(t("verify.stillPending"));
            }
        } finally {
            setChecking(false);
        }
    };

    return { resend, sending, checkNow, checking, email: user?.email };
}

/**
 * Persistent (per-session dismissible) nudge for signed-in users whose email
 * is not verified yet. Hidden for guests, verified users and desktop mode.
 */
export function VerifyEmailBanner() {
    const { t } = useLanguage();
    const { user, isAnonymous } = useAuth();
    const { resend, sending, checkNow, checking } = useVerificationActions();
    const [dismissed, setDismissed] = useState<boolean>(
        () => typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1",
    );

    if (isDesktopRuntime || dismissed) return null;
    if (!user || isAnonymous || !user.email || user.emailVerification) return null;

    return (
        <Alert className="mb-4">
            <Mail />
            <AlertTitle className="flex items-start justify-between gap-2">
                <span>{t("verify.bannerTitle")}</span>
                <Button
                    type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Dismiss"
                    onClick={() => {
                        sessionStorage.setItem(DISMISS_KEY, "1");
                        setDismissed(true);
                    }}
                >
                    <X className="size-4" />
                </Button>
            </AlertTitle>
            <AlertDescription>
                <span className="flex flex-col gap-2">
                    <span>{t("verify.bannerDesc")}</span>
                    <span className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" disabled={sending} onClick={resend}>
                            {sending ? <Loader2 className="animate-spin" /> : <Mail />}
                            {t("verify.resend")}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={checking} onClick={checkNow}>
                            {checking && <Loader2 className="animate-spin" />}
                            {t("verify.checkNow")}
                        </Button>
                    </span>
                </span>
            </AlertDescription>
        </Alert>
    );
}

/**
 * Wrapper for verified-only areas (Termine): renders children only for
 * verified accounts; guests get a register prompt, unverified users the
 * resend/check panel. Desktop/local profiles are verified by construction.
 */
export function VerifiedOnly({ children }: { children: React.ReactNode }) {
    const { t } = useLanguage();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }
    if (isDesktopRuntime || (user?.email && user.emailVerification)) {
        return <>{children}</>;
    }
    if (!user?.email) {
        return (
            <Card className="mx-auto my-12 max-w-xl text-center">
                <CardContent className="flex flex-col items-center gap-3">
                    <Mail className="size-10 text-primary" />
                    <h3 className="text-lg font-semibold">{t("termine.verifyGateTitle")}</h3>
                    <p className="text-sm text-muted-foreground">{t("termine.verifyGateGuest")}</p>
                    <Button size="lg" asChild>
                        <Link href="/register">{t("dashboard.registerNow")}</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    return <VerifyEmailGate />;
}

/** Full-panel gate shown in place of verified-only features (Termine). */
export function VerifyEmailGate() {
    const { t } = useLanguage();
    const { resend, sending, checkNow, checking, email } = useVerificationActions();

    return (
        <Card className="mx-auto my-12 max-w-xl text-center">
            <CardContent className="flex flex-col items-center gap-3">
                <Mail className="size-10 text-primary" />
                <h3 className="text-lg font-semibold">{t("termine.verifyGateTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("termine.verifyGateDesc")}</p>
                {email && <p className="font-semibold">{email}</p>}
                <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" size="lg" disabled={sending} onClick={resend}>
                        {sending ? <Loader2 className="animate-spin" /> : <Mail />}
                        {t("verify.resend")}
                    </Button>
                    <Button type="button" size="lg" variant="outline" disabled={checking} onClick={checkNow}>
                        {checking && <Loader2 className="animate-spin" />}
                        {t("verify.checkNow")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
