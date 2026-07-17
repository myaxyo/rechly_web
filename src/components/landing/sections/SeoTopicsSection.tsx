"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
    de: {
        eyebrow: "SEO-THEMEN FÜR DEUTSCHLAND",
        title: "Lösungen für typische Rechnungsfälle in Deutschland",
        subtitle:
            "Diese Seiten beantworten konkrete Suchanfragen von Freelancern, Kleinunternehmern und Teams, die ihre Rechnungsprozesse strukturieren wollen.",
        cards: [
            {
                href: "/rechnungssoftware-fuer-freelancer",
                title: "Rechnungssoftware für Freelancer",
                description:
                    "Fokus auf schnelle Angebot- und Rechnungsprozesse, Kundenverwaltung und offene Zahlungen.",
            },
            {
                href: "/kleinunternehmer-rechnung",
                title: "Kleinunternehmer Rechnung",
                description:
                    "Pflichtangaben, §19 UStG-Hinweis und ein ruhiger Workflow für kleine Betriebe und Soloselbstständige.",
            },
            {
                href: "/e-rechnung-software",
                title: "E-Rechnung Software",
                description:
                    "Wie du Kundendaten, Leitweg-ID und saubere Rechnungsdaten für E-Rechnungsprozesse vorbereitest.",
            },
            {
                href: "/kostenlose-rechnungssoftware",
                title: "Kostenlose Rechnungssoftware",
                description:
                    "Testphase, Freemium oder echte Vollversion? Die Gratis-Modelle am deutschen Markt im Vergleich.",
            },
        ],
    },
    en: {
        eyebrow: "GERMAN MARKET TOPICS",
        title: "Guides for core invoicing use cases in Germany",
        subtitle:
            "These pages target concrete search intents from freelancers, small businesses, and teams operating under German invoicing requirements.",
        cards: [
            {
                href: "/rechnungssoftware-fuer-freelancer",
                title: "Invoicing software for freelancers",
                description:
                    "Focused on fast invoice creation, client management, and overdue payment follow-up.",
            },
            {
                href: "/kleinunternehmer-rechnung",
                title: "Small business invoice guide",
                description:
                    "Covers key invoice fields, the §19 UStG note, and a simple workflow for solo businesses.",
            },
            {
                href: "/e-rechnung-software",
                title: "E-invoicing software readiness",
                description:
                    "How to prepare client data, routing IDs, and structured invoice processes for Germany.",
            },
            {
                href: "/kostenlose-rechnungssoftware",
                title: "Free invoicing software",
                description:
                    "Trial, freemium, or a genuinely free full version? Comparing the free tiers on the German market.",
            },
        ],
    },
};

export default function SeoTopicsSection() {
    const { language } = useLanguage();
    const current = content[language];

    return (
        <section
            style={{
                padding: "0 24px 88px",
                background: "#fff",
            }}
        >
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 34 }}>
                    <div className="landing-eyebrow">{current.eyebrow}</div>
                    <h2
                        style={{
                            marginTop: 18,
                            marginBottom: 14,
                            fontSize: 34,
                            lineHeight: 1.15,
                            fontWeight: 700,
                            color: "#111827",
                        }}
                    >
                        {current.title}
                    </h2>
                    <p
                        style={{
                            maxWidth: 760,
                            margin: "0 auto",
                            color: "#5f6b7a",
                            fontSize: 17,
                            lineHeight: 1.7,
                        }}
                    >
                        {current.subtitle}
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 18,
                    }}
                >
                    {current.cards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            style={{ textDecoration: "none" }}
                        >
                            <article
                                style={{
                                    height: "100%",
                                    padding: 26,
                                    borderRadius: 22,
                                    border: "1px solid rgba(15, 23, 42, 0.08)",
                                    background:
                                        "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                                    boxShadow:
                                        "0 18px 36px rgba(15, 23, 42, 0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 10,
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: "#111827",
                                    }}
                                >
                                    {card.title}
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        lineHeight: 1.75,
                                        color: "#64748b",
                                    }}
                                >
                                    {card.description}
                                </p>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
