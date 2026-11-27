"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutSection() {
    const { t } = useLanguage();

    const aboutPoints = [
        t("about.point1"),
        t("about.point2"),
        t("about.point3"),
        t("about.point4"),
    ];

    return (
        <section
            style={{
                padding: "80px 24px",
                maxWidth: 700,
                margin: "0 auto",
            }}
            aria-label="Über das Open-Source Rechnungsprogramm"
        >
            <div
                style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "#f0fdf4",
                    borderRadius: 4,
                    marginBottom: 16,
                }}
            >
                <span
                    style={{
                        color: "#166534",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                    }}
                >
                    {t("about.badge")}
                </span>
            </div>

            <h2
                style={{
                    marginBottom: 16,
                    fontWeight: 600,
                    color: "#111",
                    fontSize: 28,
                }}
            >
                {t("about.title")}
            </h2>

            <p
                style={{
                    fontSize: 16,
                    color: "#64748b",
                    marginBottom: 32,
                    lineHeight: 1.8,
                }}
            >
                {t("about.description")}
            </p>

            <div className="flex flex-col gap-3">
                {aboutPoints.map((point, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <Check size={16} style={{ color: "#22c55e" }} />
                        <span style={{ color: "#374151", fontSize: 15 }}>
                            {point}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
