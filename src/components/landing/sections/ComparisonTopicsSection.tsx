"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
    de: {
        eyebrow: "VERGLEICH & ALTERNATIVEN",
        title: "Seiten für Vergleichssuchen rund um Rechnungssoftware",
        subtitle:
            "Diese Themen sprechen Nutzer an, die Tools vergleichen, nach einer Alternative suchen oder bewusst ein kostenloses Rechnungsprogramm evaluieren.",
        cards: [
            {
                href: "/lexoffice-alternative",
                title: "lexoffice Alternative",
                description:
                    "Für Suchende, die statt einer geschlossenen SaaS-Lösung eine offenere und schlankere Rechnungssoftware prüfen wollen.",
            },
            {
                href: "/sevdesk-alternative",
                title: "sevdesk Alternative",
                description:
                    "Für Teams und Selbstständige, die eine ruhigere Alternative für Rechnungen, Kunden und offene Zahlungen vergleichen möchten.",
            },
            {
                href: "/rechnungsprogramm-kostenlos",
                title: "Rechnungsprogramm kostenlos",
                description:
                    "Für Nutzer, die konkret ein kostenloses Rechnungsprogramm für Deutschland suchen, ohne direkt in Preislogik oder Upsells zu laufen.",
            },
        ],
    },
    en: {
        eyebrow: "COMPARISONS & ALTERNATIVES",
        title: "Pages for invoicing software comparison intent",
        subtitle:
            "These topics target users comparing tools, looking for alternatives, or evaluating a genuinely free invoicing product for Germany.",
        cards: [
            {
                href: "/lexoffice-alternative",
                title: "lexoffice alternative",
                description:
                    "For users evaluating a more open and focused invoicing workflow instead of a closed SaaS stack.",
            },
            {
                href: "/sevdesk-alternative",
                title: "sevdesk alternative",
                description:
                    "For freelancers and small teams comparing invoicing tools with a simpler workflow for reminders and client data.",
            },
            {
                href: "/rechnungsprogramm-kostenlos",
                title: "Free invoicing software",
                description:
                    "For searchers who specifically want a free invoicing tool for Germany without immediate pricing friction.",
            },
        ],
    },
};

export default function ComparisonTopicsSection() {
    const { language } = useLanguage();
    const current = content[language];

    return (
        <section
            style={{
                padding: "0 24px 88px",
                background:
                    "linear-gradient(180deg, #f8fff8 0%, #ffffff 60%, #f9fcff 100%)",
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
                                        "linear-gradient(180deg, #ffffff 0%, #f4fff7 100%)",
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
