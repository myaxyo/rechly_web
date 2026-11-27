"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    const onFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { password?: string; confirmPassword?: string } = {};
        if (!password) {
            newErrors.password = l("Bitte Passwort eingeben", "Please enter a password");
        } else if (password.length < 8) {
            newErrors.password = l("Mindestens 8 Zeichen", "At least 8 characters");
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = l("Bitte Passwort bestätigen", "Please confirm your password");
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = l("Die Passwörter stimmen nicht überein", "Passwords do not match");
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        if (!userId || !secret) {
            toast.error(l("Der Link ist ungültig oder abgelaufen.", "This link is invalid or expired."));
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/recovery/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, secret, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Recovery failed");
            }
            toast.success(l("Neues Passwort gespeichert. Bitte melde dich an.", "New password saved. Please log in."));
            router.push("/login");
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : l("Der Link ist ungültig oder abgelaufen.", "This link is invalid or expired."),
            );
        } finally {
            setLoading(false);
        }
    };

    if (!userId || !secret) {
        return (
            <AuthShell
                mode="reset"
                title={l("Link ungültig", "Invalid link")}
                subtitle={l(
                    "Dieser Link ist ungültig oder abgelaufen. Fordere einfach einen neuen an.",
                    "This link is invalid or expired. Just request a new one.",
                )}
            >
                <Link href="/forgot-password" className="font-semibold">
                    {l("Neuen Link anfordern", "Request a new link")}
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            mode="reset"
            title={l("Neues Passwort setzen", "Set a new password")}
            subtitle={l("Wähle ein sicheres Passwort mit mindestens 8 Zeichen.", "Choose a secure password with at least 8 characters.")}
        >
            <form onSubmit={onFinish} noValidate className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="password">{l("Neues Passwort", "New password")}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="pl-10 h-11"
                            aria-invalid={!!errors.password}
                        />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword">{l("Passwort bestätigen", "Confirm password")}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="pl-10 h-11"
                            aria-invalid={!!errors.confirmPassword}
                        />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full h-[46px]" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {l("Passwort speichern", "Save new password")}
                </Button>
            </form>
        </AuthShell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="size-8 animate-spin" />
                </div>
            }
        >
            <ResetForm />
        </Suspense>
    );
}
