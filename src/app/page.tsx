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
    title: "Kostenlose Rechnungssoftware für Freelancer & Selbstständige in Deutschland",
    description:
        "Rechly ist die kostenlose Rechnungssoftware für Deutschland. Online Rechnungen erstellen, XRechnung & ZUGFeRD exportieren, Kunden verwalten, PDF-Rechnungen erzeugen. GoBD-konform, DSGVO-sicher, Open Source.",
    alternates: {
        canonical: "/",
        languages: {
            "de": "/",
            "x-default": "/",
        },
    },
    openGraph: {
        title: "Rechly - Kostenlose Rechnungssoftware für Freelancer & Selbstständige",
        description:
            "Online Rechnungen erstellen, XRechnung & ZUGFeRD exportieren, Kunden verwalten und professionelle PDFs erzeugen. GoBD-konform, Open Source, kostenlos.",
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
            "@id": `${siteUrl}/#software`,
            name: "Rechly",
            url: siteUrl,
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Rechnungssoftware",
            operatingSystem: "Web, Android",
            inLanguage: ["de-DE", "en"],
            areaServed: {
                "@type": "Country",
                name: "Germany",
            },
            audience: {
                "@type": "BusinessAudience",
                audienceType:
                    "Freelancer, Selbstständige, Kleinunternehmer und kleine Unternehmen in Deutschland",
            },
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
            },
            isAccessibleForFree: true,
            description:
                "Kostenlose deutsche Rechnungssoftware mit XRechnung, ZUGFeRD, PDF-Export, Kundenverwaltung, Angebotserstellung und Zahlungserinnerungen. GoBD-konform und DSGVO-sicher.",
            author: {
                "@id": `${siteUrl}/#organization`,
            },
            publisher: {
                "@id": `${siteUrl}/#organization`,
            },
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "12",
                bestRating: "5",
                worstRating: "1",
            },
            featureList: [
                "Rechnungen online erstellen",
                "XRechnung & ZUGFeRD Export",
                "Kundenverwaltung",
                "PDF-Rechnungen exportieren",
                "Angebote erstellen und versenden",
                "Wiederkehrende Rechnungen",
                "Zahlungserinnerungen & Mahnungen",
                "Ausgabenverwaltung mit Belegerfassung",
                "Bankabgleich",
                "Cloud-Synchronisation",
                "DSGVO-konforme Workflows",
                "GoBD-konforme Rechnungen",
                "KI-gestützte Rechnungshilfe (BYOK)",
                "DATEV-Export",
                "Open Source & selbst hostbar",
            ],
            screenshot: `${siteUrl}/opengraph-image`,
        },
        {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: "Rechly",
            url: siteUrl,
            logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/favicon/favicon.svg`,
            },
            description:
                "Open-Source Rechnungssoftware für Deutschland. Entwickelt für Freelancer, Selbstständige und kleine Unternehmen.",
            sameAs: [repoUrl],
        },
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            name: "Rechly - Kostenlose Rechnungssoftware für Deutschland",
            url: siteUrl,
            publisher: {
                "@id": `${siteUrl}/#organization`,
            },
            inLanguage: "de-DE",
            potentialAction: {
                "@type": "SearchAction",
                target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteUrl}/?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "WebPage",
            "@id": `${siteUrl}/#webpage`,
            name: "Rechly - Kostenlose Rechnungssoftware für Freelancer & Selbstständige",
            url: siteUrl,
            isPartOf: {
                "@id": `${siteUrl}/#website`,
            },
            about: {
                "@id": `${siteUrl}/#software`,
            },
            primaryImageOfPage: {
                "@type": "ImageObject",
                url: `${siteUrl}/opengraph-image`,
            },
            inLanguage: "de-DE",
            datePublished: "2024-09-01",
            dateModified: "2026-07-10",
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
