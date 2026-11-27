"use client";

import { ArrowLeft, House } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
    const router = useRouter();
    const { language } = useLanguage();
    const isDe = language === "de";

    return (
        <div className="dashboard-page">
            <section className="dashboard-welcome">
                <div>
                    <div className="dashboard-eyebrow">404</div>
                    <h1>{isDe ? "Seite nicht gefunden" : "Page not found"}</h1>
                    <p>
                        {isDe
                            ? "Dieser Bereich des Dashboards existiert nicht oder wurde verschoben."
                            : "This dashboard page does not exist or has moved."}
                    </p>
                </div>
            </section>
            <div className="flex flex-wrap gap-3">
                <Button type="button" size="lg" onClick={() => router.push("/dashboard")}>
                    <House />
                    {isDe ? "Zum Dashboard" : "Back to dashboard"}
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>
                    <ArrowLeft />
                    {isDe ? "Zurück" : "Go back"}
                </Button>
            </div>
        </div>
    );
}
