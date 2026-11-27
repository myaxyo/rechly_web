"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";

type VerifyState = "loading" | "success" | "error" | "expired" | "rate_limited";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { language } = useLanguage();
    const { user, refreshUser } = useAuth();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [state, setState] = useState<VerifyState>("loading");
    const startedRef = useRef<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    useEffect(() => {
        if (!userId || !secret) return;
        const requestKey = JSON.stringify([userId, secret, attempt]);
        if (startedRef.current === requestKey) return;
        startedRef.current = requestKey;
        (async () => {
            try {
                const res = await fetch("/api/auth/verification/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, secret }),
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    setState(res.status === 429 ? "rate_limited" : body.code === "invalid_link" ? "expired" : "error");
                    return;
                }
                await refreshUser().catch(() => undefined);
                setState("success");
            } catch {
                setState("error");
            }
        })();
    }, [userId, secret, refreshUser, attempt]);

    if (!userId || !secret) {
        return (
            <AuthShell
                mode="reset"
                title={l("Link ungültig", "Invalid link")}
                subtitle={l(
                    "Dieser Link ist ungültig oder unvollständig. Fordere in den Einstellungen einfach einen neuen an.",
                    "This link is invalid or incomplete. Just request a new one from your settings.",
                )}
            >
                <Link href="/login" className="font-semibold">
                    {l("Zur Anmeldung", "Go to login")}
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            mode="reset"
            title={l("E-Mail bestätigen", "Verify your email")}
            subtitle={l(
                "Wir prüfen deinen Bestätigungslink …",
                "We are checking your verification link …",
            )}
        >
            {state === "loading" && (
                <div className="flex justify-center py-6">
                    <Loader2 className="size-8 animate-spin" />
                </div>
            )}
            {state === "success" && (
                <div className="flex flex-col items-center gap-3 text-center">
                    <CheckCircle2 className="size-12 text-emerald-500" />
                    <h2 className="text-xl font-semibold">{l("E-Mail bestätigt", "Email verified")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {l(
                            "Vielen Dank! Deine E-Mail-Adresse ist jetzt bestätigt — alle Funktionen, inklusive Termine, sind freigeschaltet.",
                            "Thank you! Your email address is now verified — all features, including Termine (bookings), are unlocked.",
                        )}
                    </p>
                    <Button
                        size="lg"
                        onClick={() => router.push(user ? "/dashboard" : "/login")}
                    >
                        {user
                            ? l("Zum Dashboard", "Go to dashboard")
                            : l("Jetzt anmelden", "Log in now")}
                    </Button>
                </div>
            )}
            {(state === "error" || state === "rate_limited") && (
                <div className="flex flex-col items-center gap-3 text-center">
                    <AlertTriangle className="size-12 text-amber-500" />
                    <h2 className="text-xl font-semibold">
                        {state === "rate_limited"
                            ? l("Bitte kurz warten", "Please wait")
                            : l("Bestätigung derzeit nicht möglich", "Verification currently unavailable")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {state === "rate_limited"
                            ? l("Zu viele Versuche. Warte mindestens eine Minute und versuche diesen Link erneut.", "Too many attempts. Wait at least a minute and try this link again.")
                            : l("Die Verbindung oder der Bestätigungsdienst ist derzeit nicht verfügbar. Versuche diesen Link später erneut. Das bedeutet nicht, dass er abgelaufen ist.", "The connection or verification service is currently unavailable. Try this link again later. This does not mean it has expired.")}
                    </p>
                    <Button size="lg" onClick={() => { setState("loading"); setAttempt(value => value + 1); }}>
                        {l("Erneut versuchen", "Try again")}
                    </Button>
                </div>
            )}
            {state === "expired" && (
                <div className="flex flex-col items-center gap-3 text-center">
                    <XCircle className="size-12 text-destructive" />
                    <h2 className="text-xl font-semibold">{l("Link nicht mehr gültig", "Link no longer valid")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {l(
                            "Dieser Bestätigungslink ist ungültig, abgelaufen oder wurde bereits verwendet. Melde dich an und fordere in den Einstellungen einen neuen an.",
                            "This verification link is invalid, expired or has already been used. Log in and request a new one from your settings.",
                        )}
                    </p>
                    <Button size="lg" onClick={() => router.push("/login")}>
                        {l("Zur Anmeldung", "Go to login")}
                    </Button>
                </div>
            )}
        </AuthShell>
    );
}

export default function VerifyPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="size-8 animate-spin" />
                </div>
            }
        >
            <VerifyContent />
        </Suspense>
    );
}
