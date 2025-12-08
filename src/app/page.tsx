"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Typography, Space, Card, Collapse } from "antd";
import {
    FileTextOutlined,
    TeamOutlined,
    CloudOutlined,
    MobileOutlined,
    GithubOutlined,
    CheckOutlined,
    ArrowRightOutlined,
    QuestionCircleOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Script from "next/script";

const { Title, Text, Paragraph } = Typography;

// JSON-LD Structured Data for SEO
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "SoftwareApplication",
            name: "Rechly",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, Android",
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
            },
            description:
                "Kostenlose Rechnungssoftware für Freelancer und Selbstständige. Erstelle professionelle Rechnungen online.",
            url: "https://rechly.de",
            author: {
                "@type": "Organization",
                name: "Rechly",
            },
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "50",
            },
        },
        {
            "@type": "Organization",
            name: "Rechly",
            url: "https://rechly.de",
            logo: "https://rechly.de/favicon/favicon.svg",
            description:
                "Open-Source Rechnungssoftware für Deutschland. DSGVO-konform, kostenlos, einfach.",
            sameAs: ["https://github.com/myaxyo/rechly"],
        },
        {
            "@type": "WebSite",
            name: "Rechly - Kostenlose Rechnungssoftware",
            url: "https://rechly.de",
            potentialAction: {
                "@type": "SearchAction",
                target: "https://rechly.de/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "Ist Rechly wirklich kostenlos?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Ja, Rechly ist zu 100% kostenlos. Es gibt keine versteckten Kosten, keine Premium-Pläne und keine Werbung. Als Open-Source-Projekt bleibt Rechly für immer kostenlos.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Ist Rechly DSGVO-konform?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Ja, Rechly ist vollständig DSGVO-konform. Alle Daten werden auf deutschen Servern (Frankfurt) gespeichert und verarbeitet. Es werden keine Tracking-Cookies verwendet.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Kann ich mit Rechly GoBD-konforme Rechnungen erstellen?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Ja, alle mit Rechly erstellten Rechnungen enthalten alle gesetzlich erforderlichen Pflichtangaben für deutsche Rechnungen, einschließlich Steuernummer, fortlaufende Rechnungsnummer und ordnungsgemäße Steuerauszeichnung.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Für wen ist Rechly geeignet?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Rechly ist ideal für Freelancer, Selbstständige, Kleinunternehmer und kleine Unternehmen, die eine einfache und kostenlose Lösung zum Erstellen von Rechnungen suchen.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Gibt es eine mobile App?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Ja, Rechly bietet eine native Android-App. Eine iOS-App ist in Entwicklung. Deine Daten werden automatisch zwischen Web und App synchronisiert.",
                    },
                },
            ],
        },
    ],
};

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

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { t, language } = useLanguage();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push("/dashboard");
            } else {
                setShowContent(true);
            }
        }
    }, [user, loading, router]);

    if (loading || (!showContent && !user)) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    background: "#fff",
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "3px solid #f0f0f0",
                        borderTopColor: "#1890ff",
                        animation: "spin 0.8s linear infinite",
                    }}
                />
                <style jsx>{`
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

    const features = [
        {
            icon: (
                <FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            ),
            title: t("features.invoices.title"),
            desc: t("features.invoices.desc"),
        },
        {
            icon: <TeamOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
            title: t("features.clients.title"),
            desc: t("features.clients.desc"),
        },
        {
            icon: <CloudOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
            title: t("features.sync.title"),
            desc: t("features.sync.desc"),
        },
        {
            icon: <MobileOutlined style={{ fontSize: 24, color: "#eb2f96" }} />,
            title: t("features.mobile.title"),
            desc: t("features.mobile.desc"),
        },
    ];

    const aboutPoints = [
        t("about.point1"),
        t("about.point2"),
        t("about.point3"),
        t("about.point4"),
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            {/* JSON-LD Structured Data for SEO */}
            <Script
                id="structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />

            <Navbar />

            <main role="main">
                {/* Hero Section - Main H1 for SEO */}
                <section
                    style={{
                        paddingTop: 140,
                        paddingBottom: 80,
                        paddingLeft: 24,
                        paddingRight: 24,
                        textAlign: "center",
                        maxWidth: 700,
                        margin: "0 auto",
                    }}
                    aria-label="Rechnungssoftware für Freelancer"
                >
                    <div
                        style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            background: "#f0f9ff",
                            borderRadius: 20,
                            marginBottom: 24,
                        }}
                    >
                        <Text
                            style={{
                                color: "#0369a1",
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            {t("hero.badge")}
                        </Text>
                    </div>

                    {/* SEO-optimized H1 with target keywords */}
                    <h1
                        style={{
                            fontSize: 48,
                            fontWeight: 700,
                            margin: "0 0 16px",
                            lineHeight: 1.2,
                            color: "#111",
                        }}
                    >
                        {t("hero.title")}
                        <br />
                        <span style={{ color: "#1890ff" }}>
                            {t("hero.titleHighlight")}
                        </span>
                    </h1>

                    <p
                        style={{
                            fontSize: 18,
                            color: "#64748b",
                            marginBottom: 32,
                            lineHeight: 1.7,
                        }}
                    >
                        {t("hero.subtitle")}
                    </p>

                    <Space size="middle" wrap style={{ justifyContent: "center" }}>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => router.push("/register")}
                            style={{
                                height: 48,
                                paddingInline: 28,
                                fontSize: 15,
                                borderRadius: 8,
                                fontWeight: 500,
                            }}
                            aria-label="Jetzt kostenlos Rechnung erstellen"
                        >
                            {t("hero.cta")}
                            <ArrowRightOutlined />
                        </Button>
                        <Button
                            size="large"
                            icon={<GithubOutlined />}
                            href="https://github.com/myaxyo/rechly"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                height: 48,
                                paddingInline: 24,
                                fontSize: 15,
                                borderRadius: 8,
                            }}
                        >
                            {t("hero.secondary")}
                        </Button>
                    </Space>
                </section>

                {/* Features Section - H2 for SEO */}
                <section
                    style={{
                        padding: "60px 24px 80px",
                        background: "#fafafa",
                    }}
                    aria-label="Funktionen der Rechnungssoftware"
                >
                    <div style={{ maxWidth: 900, margin: "0 auto" }}>
                        <h2
                            style={{
                                textAlign: "center",
                                marginBottom: 48,
                                fontWeight: 600,
                                color: "#111",
                                fontSize: 28,
                            }}
                        >
                            {t("features.title")}
                        </h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 20,
                            }}
                        >
                            {features.map((feature, i) => (
                                <Card
                                    key={i}
                                    style={{
                                        borderRadius: 12,
                                        border: "1px solid #f0f0f0",
                                    }}
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <div style={{ marginBottom: 16 }}>
                                        {feature.icon}
                                    </div>
                                    <h3
                                        style={{
                                            marginBottom: 8,
                                            fontWeight: 600,
                                            fontSize: 16,
                                        }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <Text
                                        style={{ color: "#64748b", fontSize: 14 }}
                                    >
                                        {feature.desc}
                                    </Text>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About Section */}
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
                        <Text
                            style={{
                                color: "#166534",
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: 0.5,
                            }}
                        >
                            {t("about.badge")}
                        </Text>
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

                    <Space direction="vertical" size={12}>
                        {aboutPoints.map((point, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <CheckOutlined
                                    style={{ color: "#22c55e", fontSize: 16 }}
                                />
                                <Text style={{ color: "#374151", fontSize: 15 }}>
                                    {point}
                                </Text>
                            </div>
                        ))}
                    </Space>
                </section>

                {/* FAQ Section for SEO */}
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
                            accordion
                            style={{
                                background: "#fff",
                                borderRadius: 12,
                                border: "1px solid #e5e7eb",
                            }}
                            expandIconPosition="end"
                            items={faqData[language].map((faq, i) => ({
                                key: i.toString(),
                                label: (
                                    <span
                                        style={{ fontWeight: 500, color: "#111" }}
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

                {/* CTA Section */}
                <section
                    style={{
                        padding: "64px 24px",
                        background: "#fff",
                        textAlign: "center",
                    }}
                >
                    <div style={{ maxWidth: 500, margin: "0 auto" }}>
                        <h2
                            style={{
                                marginBottom: 12,
                                fontWeight: 600,
                                color: "#111",
                                fontSize: 24,
                            }}
                        >
                            {t("cta.title")}
                        </h2>
                        <p
                            style={{
                                color: "#64748b",
                                marginBottom: 24,
                                fontSize: 16,
                            }}
                        >
                            {t("cta.subtitle")}
                        </p>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => router.push("/register")}
                            style={{
                                height: 48,
                                paddingInline: 32,
                                fontSize: 15,
                                borderRadius: 8,
                                fontWeight: 500,
                            }}
                            aria-label="Kostenlos registrieren und Rechnung erstellen"
                        >
                            {t("cta.button")}
                        </Button>
                        <div style={{ marginTop: 16 }}>
                            <Text style={{ color: "#64748b", fontSize: 13 }}>
                                {t("cta.note")}
                            </Text>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
