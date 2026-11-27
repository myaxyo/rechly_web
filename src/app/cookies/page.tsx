"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";


const content = {
    de: {
        title: "Cookie-Einstellungen",
        intro: "Technisch notwendige Cookies sind immer aktiv. Optionale Analyse wird erst nach deiner ausdrücklichen Zustimmung geladen.",
        essentialTitle: "Notwendige Cookies",
        essentialDesc: "Für Login und Grundfunktionen erforderlich.",
        analyticsTitle: "Analyse-Cookies",
        analyticsDesc: "Optional: hilft uns, Nutzung und technische Qualität zu verstehen.",
        saveButton: "Einstellungen speichern",
        savedAlert: "Einstellungen gespeichert.",
        lastUpdated: "Stand: August 2026",
    },
    en: {
        title: "Cookie Settings",
        intro: "Essential cookies are always active. Optional analytics are loaded only after your explicit consent.",
        essentialTitle: "Essential Cookies",
        essentialDesc: "Required for login and basic functionality.",
        analyticsTitle: "Analytics Cookies",
        analyticsDesc: "Optional: helps us understand usage and technical quality.",
        saveButton: "Save Settings",
        savedAlert: "Settings saved.",
        lastUpdated: "Last updated: August 2026",
    },
};

export default function CookiesPage() {
    const { language } = useLanguage();
    const t = content[language];
    const [analyticsCookies, setAnalyticsCookies] = useState(false);
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("cookiePreferences");
            if (stored) {
                const preferences: unknown = JSON.parse(stored);
                if (
                    typeof preferences === "object" &&
                    preferences !== null &&
                    "analytics" in preferences &&
                    typeof preferences.analytics === "boolean"
                ) {
                    setAnalyticsCookies(preferences.analytics);
                }
            }
        } catch {
            // Invalid preferences are treated as no optional consent.
        } finally {
            setPreferencesLoaded(true);
        }
    }, []);

    const handleSave = () => {
        if (!preferencesLoaded) return;

        localStorage.setItem(
            "cookiePreferences",
            JSON.stringify({
                essential: true,
                analytics: analyticsCookies,
                timestamp: new Date().toISOString(),
            })
        );
        window.dispatchEvent(new Event("cookie-consent-changed"));
        alert(t.savedAlert);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <Navbar showAuth={false} />

            <main
                style={{
                    paddingTop: 100,
                    paddingBottom: 60,
                    paddingLeft: 24,
                    paddingRight: 24,
                    maxWidth: 700,
                    margin: "0 auto",
                }}
            >
                <Card className="legal-prose" style={{ borderRadius: 10 }}>
                    <CardContent>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: 24 }}>
                        {t.title}
                    </h1>

                    <p style={{ fontSize: 15 }}>{t.intro}</p>

                    <Card
                        style={{
                            marginTop: 24,
                            marginBottom: 16,
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <CardContent>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h3 style={{ marginBottom: 4 }}>
                                    {t.essentialTitle}
                                </h3>
                                <span style={{ color: "#64748b", fontSize: 14 }}>
                                    {t.essentialDesc}
                                </span>
                            </div>
                            <Switch checked disabled />
                        </div>
                        </CardContent>
                    </Card>

                    <Card
                        style={{
                            marginBottom: 24,
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <CardContent>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h3 style={{ marginBottom: 4 }}>
                                    {t.analyticsTitle}
                                </h3>
                                <span style={{ color: "#64748b", fontSize: 14 }}>
                                    {t.analyticsDesc}
                                </span>
                            </div>
                            <Switch
                                checked={analyticsCookies}
                                disabled={!preferencesLoaded}
                                onCheckedChange={setAnalyticsCookies}
                            />
                        </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col w-full">
                        <Button
                            size="lg"
                            onClick={handleSave}
                            disabled={!preferencesLoaded}
                            className="w-full"
                            style={{ borderRadius: 8 }}
                        >
                            {t.saveButton}
                        </Button>
                    </div>

                    <span className="text-muted-foreground" style={{
                            fontSize: 13,
                            marginTop: 24,
                            display: "block",
                        }}>
                        {t.lastUpdated}
                    </span>
                </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
