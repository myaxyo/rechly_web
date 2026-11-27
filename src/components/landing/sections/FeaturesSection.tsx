"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
    FileText,
    Users,
    Bot,
    TrendingUp,
    ShieldCheck,
    Mail,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeaturesSection() {
    const { t } = useLanguage();

    const features = [
        {
            icon: <FileText size={24} style={{ color: "#0f766e" }} />,
            title: t("features.invoices.title"),
            desc: t("features.invoices.desc"),
        },
        {
            icon: <Users size={24} style={{ color: "#2855d9" }} />,
            title: t("features.clients.title"),
            desc: t("features.clients.desc"),
        },
        {
            icon: <Mail size={24} style={{ color: "#b45309" }} />,
            title: t("features.reminders.title"),
            desc: t("features.reminders.desc"),
        },
        {
            icon: <Bot size={24} style={{ color: "#7c3aed" }} />,
            title: t("features.ai.title"),
            desc: t("features.ai.desc"),
        },
        {
            icon: <TrendingUp size={24} style={{ color: "#dc2626" }} />,
            title: t("features.analytics.title"),
            desc: t("features.analytics.desc"),
        },
        {
            icon: <ShieldCheck size={24} style={{ color: "#166534" }} />,
            title: t("features.opensource.title"),
            desc: t("features.opensource.desc"),
        },
    ];

    const highlights = [
        {
            value: t("features.highlight1.value"),
            label: t("features.highlight1.label"),
        },
        {
            value: t("features.highlight2.value"),
            label: t("features.highlight2.label"),
        },
        {
            value: t("features.highlight3.value"),
            label: t("features.highlight3.label"),
        },
    ];

    return (
        <section
            style={{
                padding: "84px 24px 96px",
                background:
                    "linear-gradient(180deg, #fff8ed 0%, #fff 52%, #f6fbff 100%)",
            }}
            aria-label="Funktionen der Rechnungssoftware"
        >
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <div className="landing-eyebrow">{t("features.badge")}</div>
                    <h2
                        style={{
                            textAlign: "center",
                            marginBottom: 16,
                            marginTop: 18,
                            fontWeight: 700,
                            color: "#111827",
                            fontSize: 34,
                            lineHeight: 1.15,
                        }}
                    >
                        {t("features.title")}
                    </h2>
                    <p
                        style={{
                            maxWidth: 760,
                            margin: "0 auto",
                            color: "#5b6474",
                            fontSize: 17,
                            lineHeight: 1.7,
                        }}
                    >
                        {t("features.subtitle")}
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 22,
                    }}
                >
                    {features.map((feature, i) => (
                        <Card
                            key={i}
                            className="feature-card py-0"
                            style={{
                                borderRadius: 20,
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                                background: "rgba(255,255,255,0.9)",
                                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
                            }}
                        >
                            <CardContent style={{ padding: 28 }}>
                                <div
                                    style={{
                                        marginBottom: 18,
                                        width: 52,
                                        height: 52,
                                        borderRadius: 16,
                                        background: "rgba(255,255,255,0.92)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow:
                                            "inset 0 0 0 1px rgba(15, 23, 42, 0.04)",
                                    }}
                                >
                                    {feature.icon}
                                </div>
                                <h3
                                    style={{
                                        marginBottom: 10,
                                        fontWeight: 700,
                                        fontSize: 18,
                                        color: "#111827",
                                    }}
                                >
                                    {feature.title}
                                </h3>
                                <span
                                    style={{
                                        color: "#5f6b7a",
                                        fontSize: 14,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {feature.desc}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div
                    style={{
                        marginTop: 32,
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 16,
                    }}
                >
                    {highlights.map((highlight, index) => (
                        <div key={index} className="landing-highlight-card">
                            <div
                                style={{
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: "#111827",
                                    marginBottom: 6,
                                }}
                            >
                                {highlight.value}
                            </div>
                            <div
                                style={{
                                    color: "#5f6b7a",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                }}
                            >
                                {highlight.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
