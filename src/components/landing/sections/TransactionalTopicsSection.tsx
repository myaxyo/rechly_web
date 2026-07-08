"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const content = {
    de: {
        eyebrow: "TRANSAKTIONALE SUCHINTENTIONEN",
        title: "Seiten für direkte Rechnungsaufgaben im deutschen Markt",
        subtitle:
            "Diese Themen zielen auf Nutzer, die nicht nur recherchieren, sondern sofort eine Vorlage, Erinnerung oder konkrete Rechnungsstruktur brauchen.",
        cards: [
            {
                href: "/rechnungsvorlage",
                title: "Rechnungsvorlage",
                description:
                    "Für Nutzer, die schnell verstehen wollen, welche Inhalte eine deutsche Rechnungsvorlage wirklich tragen sollte.",
            },
            {
                href: "/zahlungserinnerung-schreiben",
                title: "Zahlungserinnerung schreiben",
                description:
                    "Für Fälle, in denen offene Rechnungen freundlich, klar und professionell nachverfolgt werden müssen.",
            },
            {
                href: "/rechnung-fuer-kleinunternehmer-erstellen",
                title: "Rechnung für Kleinunternehmer erstellen",
                description:
                    "Für konkrete Rechnungsabläufe mit Kleinunternehmerregelung, Pflichtangaben und sauberer Struktur.",
            },
        ],
    },
    en: {
        eyebrow: "TRANSACTIONAL SEARCH INTENTS",
        title: "Pages for immediate invoicing tasks in Germany",
        subtitle:
            "These topics target users who are ready to act now and need a template, reminder workflow, or a concrete invoice structure.",
        cards: [
            {
                href: "/rechnungsvorlage",
                title: "Invoice template",
                description:
                    "For users who need a clear view of what a German invoice template should actually contain.",
            },
            {
                href: "/zahlungserinnerung-schreiben",
                title: "Write a payment reminder",
                description:
                    "For overdue invoices that need a professional follow-up with the right tone.",
            },
            {
                href: "/rechnung-fuer-kleinunternehmer-erstellen",
                title: "Create an invoice as a small business",
                description:
                    "For concrete invoice workflows with small-business rules and required fields.",
            },
        ],
    },
};

export default function TransactionalTopicsSection() {
    const { language } = useLanguage();
    const current = content[language];

    return (
        <section
            style={{
                padding: "0 24px 88px",
                background:
                    "linear-gradient(180deg, #fff 0%, #fffaf2 55%, #ffffff 100%)",
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
                                        "linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)",
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
