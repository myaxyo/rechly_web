"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
export function useWords() { const { language } = useLanguage(); return { language, l: (de: string, en: string) => language === "de" ? de : en }; }
export function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function addDays(day: string, count: number) { const date = new Date(day + "T12:00:00"); date.setDate(date.getDate() + count); return localDay(date); }
export const money = (value: number, language = "de") => new Intl.NumberFormat(language === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" }).format(value);
export function download(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function useResource<T>(url: string) {
    const [data, setData] = useState<T>(); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
    const generation = useRef(0);
    const load = useCallback(async () => {
        const current = ++generation.current;
        setLoading(true);
        try { const response = await fetch(url, { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load workspace"); if (current === generation.current) { setData(body); setError(""); } }
        catch (error) { if (current === generation.current) setError((error as Error).message); } finally { if (current === generation.current) setLoading(false); }
    }, [url]);
    useEffect(() => { void load(); }, [load]);
    async function mutate(body: object) {
        setBusy(true);
        try {
            const response = await fetch(url.split("?")[0], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to save");
            await load(); window.dispatchEvent(new Event("rechly-workspace-change")); return result.result;
        } finally { setBusy(false); }
    }
    return { data, error, setError, loading, busy, load, mutate };
}
export function WorkspaceLinks() {
    const { l } = useWords();
    return <nav className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Link href="/dashboard" className="text-primary hover:underline">{l("Dashboard", "Dashboard")}</Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/dashboard/calendar" className="text-primary hover:underline">{l("Kalender & Termine", "Calendar")}</Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/dashboard/termine/buchungen" className="text-primary hover:underline">{l("Buchungen & Zeiten", "Bookings & Hours")}</Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/dashboard/workspace" className="text-primary hover:underline">{l("Projekte & Aufgaben", "Projects & Tasks")}</Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/dashboard/workspace/time" className="text-primary hover:underline">{l("Zeiterfassung", "Time & Billing")}</Link>
        <span className="text-muted-foreground">·</span>
        <Link href="/dashboard/reports?tab=projects" className="text-primary hover:underline">{l("Projektcontrolling", "Project Controlling")}</Link>
    </nav>;
}
export function WorkspaceFrame({ title, description, error, retry, children }: { title: string; description: string; error?: string; retry: () => void; children: React.ReactNode }) {
    const { l } = useWords();
    return <div className="mx-auto w-full max-w-[1280px]"><WorkspaceLinks /><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p>{error && <Alert variant="destructive" className="mb-4"><AlertTitle>{error}</AlertTitle><AlertDescription><Button type="button" size="sm" className="mt-2" onClick={retry}>{l("Erneut versuchen", "Retry")}</Button></AlertDescription></Alert>}{children}</div>;
}
