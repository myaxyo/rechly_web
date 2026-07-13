import dynamic from "next/dynamic";
import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/sections/HeroSection";
import AuthRedirect from "@/components/landing/AuthRedirect";
import SeoTopicsSection from "@/components/landing/sections/SeoTopicsSection";
import ComparisonTopicsSection from "@/components/landing/sections/ComparisonTopicsSection";
import TransactionalTopicsSection from "@/components/landing/sections/TransactionalTopicsSection";
import { getRepoUrl, getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const repoUrl = getRepoUrl();

export const metadata: Metadata = {
    title: "Rechnungssoftware für Deutschland",
    description:
        "Rechly hilft Freelancern, Selbstständigen und kleinen Unternehmen in Deutschland beim Schreiben von Rechnungen, Verwalten von Kunden und Erstellen professioneller PDF-Rechnungen.",
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "Rechly - Rechnungssoftware für Deutschland",
        description:
            "Online Rechnungen erstellen, Kunden verwalten und professionelle PDFs exportieren. Entwickelt für den deutschen Markt.",
        url: siteUrl,
        type: "website",
    },
};

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
            url: siteUrl,
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Rechnungssoftware",
            operatingSystem: "Web, Android",
            inLanguage: ["de-DE", "en"],
            areaServed: "DE",
            audience: {
                "@type": "Audience",
                audienceType:
                    "Freelancer, Selbstständige und kleine Unternehmen in Deutschland",
            },
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
            },
            isAccessibleForFree: true,
            description:
                "Deutsche Rechnungssoftware für Freelancer, Selbstständige und kleine Unternehmen mit Fokus auf schnelle Rechnungserstellung, Kundenverwaltung und PDF-Export.",
            author: {
                "@type": "Organization",
                name: "Rechly",
            },
            featureList: [
                "Rechnungen online erstellen",
                "Kundenverwaltung",
                "PDF-Rechnungen exportieren",
                "Cloud-Synchronisation",
                "DSGVO-konforme Workflows",
                "KI-gestützte Rechnungshilfe",
            ],
        },
        {
            "@type": "Organization",
            name: "Rechly",
            url: siteUrl,
            logo: `${siteUrl}/favicon/favicon.svg`,
            description:
                "Open-Source Rechnungssoftware für Deutschland. Entwickelt für Freelancer, Selbstständige und kleine Unternehmen.",
            sameAs: [repoUrl],
        },
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            name: "Rechly - Rechnungssoftware für Deutschland",
            url: siteUrl,
            publisher: {
                "@id": `${siteUrl}/#organization`,
            },
            inLanguage: "de-DE",
        },
        {
            "@type": "WebPage",
            name: "Rechly Startseite",
            url: siteUrl,
            isPartOf: {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
            },
            about: {
                "@type": "Thing",
                name: "Rechnungssoftware für Deutschland",
            },
            primaryImageOfPage: `${siteUrl}/opengraph-image`,
            inLanguage: "de-DE",
        },
        {
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Startseite",
                    item: siteUrl,
                },
            ],
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
    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <AuthRedirect />

            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />

            <Navbar />

            <main role="main">
                <HeroSection />
                <FeaturesSection />
                <SeoTopicsSection />
                <ComparisonTopicsSection />
                <TransactionalTopicsSection />
                <WorkflowSection />
                <AboutSection />
                <FaqSection />
                <CtaSection />
            </main>

            <Footer />
        </div>
    );
}
