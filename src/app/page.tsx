"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Script from "next/script";
import HeroSection from "@/components/landing/sections/HeroSection";
import { getRepoUrl, getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const repoUrl = getRepoUrl();

// Lazy load non-critical sections
const FeaturesSection = dynamic(
    () => import("@/components/landing/sections/FeaturesSection"),
    { ssr: true }, // Keep SSR for SEO, but hydrate later? No, usually false for pure client interaction, but these have text content.
    // If I use ssr: false, the content won't be in the initial HTML, bad for SEO.
    // Next.js dynamic imports automatically split the bundle.
    // Loading priority is managed by Next.js.
);
const AboutSection = dynamic(
    () => import("@/components/landing/sections/AboutSection"),
);
const WorkflowSection = dynamic(
    () => import("@/components/landing/sections/WorkflowSection"),
);
const FaqSection = dynamic(
    () => import("@/components/landing/sections/FaqSection"),
);
const CtaSection = dynamic(
    () => import("@/components/landing/sections/CtaSection"),
);

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
            url: siteUrl,
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
            url: siteUrl,
            logo: `${siteUrl}/favicon/favicon.svg`,
            description:
                "Open-Source Rechnungssoftware für Deutschland. DSGVO-konform, kostenlos, einfach.",
            sameAs: [repoUrl],
        },
        {
            "@type": "WebSite",
            name: "Rechly - Kostenlose Rechnungssoftware",
            url: siteUrl,
            potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/search?q={search_term_string}`,
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

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();
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
                <HeroSection />
                <FeaturesSection />
                <WorkflowSection />
                <AboutSection />
                <FaqSection />
                <CtaSection />
            </main>

            <Footer />
        </div>
    );
}
