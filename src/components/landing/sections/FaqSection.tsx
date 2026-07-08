"use client";

import { Collapse } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";

// FAQ Data for display
const faqData = {
    de: [
        {
            question: "Ist Rechly wirklich kostenlos?",
            answer: "Ja, Rechly ist zu 100% kostenlos. Es gibt keine versteckten Kosten, keine Premium-Pläne und keine Werbung. Als Open-Source-Projekt bleibt Rechly für immer kostenlos.",
        },
        {
            question: "Ist Rechly DSGVO-konform?",
            answer: "Ja, Rechly ist vollständig DSGVO-konform. Alle Daten werden auf deutschen Servern (Frankfurt) gespeichert und verarbeitet. Es werden keine Tracking-Cookies verwendet.",
        },
        {
            question:
                "Kann ich mit Rechly rechtskonforme Rechnungen erstellen?",
            answer: "Ja, alle mit Rechly erstellten Rechnungen enthalten alle gesetzlich erforderlichen Pflichtangaben für deutsche Rechnungen, einschließlich Steuernummer, fortlaufende Rechnungsnummer und ordnungsgemäße Steuerauszeichnung.",
        },
        {
            question: "Für wen ist Rechly geeignet?",
            answer: "Rechly ist ideal für Freelancer, Selbstständige, Kleinunternehmer und kleine Unternehmen, die eine einfache und kostenlose Lösung zum Erstellen von Rechnungen suchen.",
        },
        {
            question: "Gibt es eine mobile App?",
            answer: "Ja, Rechly bietet eine native Android-App. Eine iOS-App ist in Entwicklung. Deine Daten werden automatisch zwischen Web und App synchronisiert.",
        },
    ],
    en: [
        {
            question: "Is Rechly really free?",
            answer: "Yes, Rechly is 100% free. There are no hidden costs, no premium plans, and no ads. As an open-source project, Rechly will remain free forever.",
        },
        {
            question: "Is Rechly GDPR compliant?",
            answer: "Yes, Rechly is fully GDPR compliant. All data is stored and processed on German servers (Frankfurt). No tracking cookies are used.",
        },
        {
            question: "Can I create legally compliant invoices with Rechly?",
            answer: "Yes, all invoices created with Rechly contain all legally required information for German invoices, including tax number, sequential invoice number, and proper tax labeling.",
        },
        {
            question: "Who is Rechly suitable for?",
            answer: "Rechly is ideal for freelancers, self-employed individuals, small business owners, and small companies looking for a simple and free invoicing solution.",
        },
        {
            question: "Is there a mobile app?",
            answer: "Yes, Rechly offers a native Android app. An iOS app is in development. Your data is automatically synced between web and app.",
        },
    ],
};

export default function FaqSection() {
    const { t, language } = useLanguage();

    return (
        <section
            style={{
                padding: "60px 24px 80px",
                background: "#fafafa",
            }}
            aria-label="Häufige Fragen zur Rechnungssoftware"
        >
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <h2
                    style={{
                        textAlign: "center",
                        marginBottom: 12,
                        fontWeight: 600,
                        color: "#111",
                        fontSize: 28,
                    }}
                >
                    {t("faq.title")}
                </h2>
                <p
                    style={{
                        textAlign: "center",
                        color: "#64748b",
                        marginBottom: 32,
                        fontSize: 16,
                    }}
                >
                    {t("faq.subtitle")}
                </p>

                <Collapse
                    ghost
                    expandIcon={({ isActive }) => (
                        <QuestionCircleOutlined
                            rotate={isActive ? 90 : 0}
                            style={{ fontSize: 18, color: "#1890ff" }}
                        />
                    )}
                    items={faqData[language].map((faq, i) => ({
                        key: i,
                        label: (
                            <span
                                style={{
                                    fontWeight: 500,
                                    fontSize: 16,
                                    color: "#1f2937",
                                }}
                            >
                                {faq.question}
                            </span>
                        ),
                        children: (
                            <p
                                style={{
                                    color: "#64748b",
                                    lineHeight: 1.7,
                                    margin: 0,
                                }}
                            >
                                {faq.answer}
                            </p>
                        ),
                    }))}
                />
            </div>
        </section>
    );
}
