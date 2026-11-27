"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<{ email?: string }>({});

    const onFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { email?: string } = {};
        if (!email) {
            newErrors.email = l("Bitte E-Mail eingeben", "Please enter your email");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = l("Ungültige E-Mail-Adresse", "Invalid email address");
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        setLoading(true);
        try {
            await fetch("/api/auth/recovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            setSent(true);
        } catch {
            toast.error(l("Etwas ist schiefgelaufen. Bitte erneut versuchen.", "Something went wrong. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthShell
                mode="reset"
                title={l("E-Mail unterwegs", "Check your inbox")}
                subtitle={l(
                    "Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen geschickt. Er ist begrenzt gültig.",
                    "If an account exists for this email, we sent you a reset link. It expires after a short time.",
                )}
            >
                <div className="text-center py-2 pb-1">
                    <CheckCircle2 className="mx-auto size-11 text-[#2e8c6e]" />
                    <p className="mt-[18px]">
                        <Link href="/login" className="font-semibold">
                            {l("Zurück zur Anmeldung", "Back to log in")}
                        </Link>
                    </p>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            mode="reset"
            title={l("Passwort vergessen?", "Forgot your password?")}
            subtitle={l(
                "Gib deine E-Mail ein. Wir schicken dir einen sicheren Link, mit dem du ein neues Passwort setzen kannst.",
                "Enter your email. We'll send you a secure link to set a new password.",
            )}
            footer={
                <p className="text-center mt-[22px] text-sm text-[#5b6b82]">
                    <Link href="/login" className="font-semibold">
                        {l("Zurück zur Anmeldung", "Back to log in")}
                    </Link>
                </p>
            }
        >
            <form onSubmit={onFinish} noValidate className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">{l("E-Mail", "Email")}</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@firma.de"
                            autoComplete="email"
                            className="pl-10 h-11"
                            aria-invalid={!!errors.email}
                        />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full h-[46px]" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {l("Link zum Zurücksetzen senden", "Send reset link")}
                </Button>
            </form>
        </AuthShell>
    );
}
