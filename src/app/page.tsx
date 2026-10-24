import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HeroSection from "@/components/landing/sections/HeroSection";
import AuthRedirect from "@/components/landing/AuthRedirect";
import SeoTopicsSection from "@/components/landing/sections/SeoTopicsSection";
import ComparisonTopicsSection from "@/components/landing/sections/ComparisonTopicsSection";
import TransactionalTopicsSection from "@/components/landing/sections/TransactionalTopicsSection";
import { getSiteUrl } from "@/lib/env";
import { homeFaqsDe } from "@/lib/home-faq";
import { createPageMetadata } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata = createPageMetadata({
    title: "Rechly – Kostenlose Open-Source Rechnungssoftware",
    description:
        "Rechnungen, Angebote und E-Rechnungen online erstellen: Rechly ist die kostenlose Open-Source Rechnungssoftware für Freelancer und kleine Unternehmen in Deutschland.",
    path: "/",
});

// Lazy load non-critical sections
const FeaturesSection = dynamic(
    () => import("@/components/landing/sections/FeaturesSection"),
    { ssr: true },
);
const DownloadSection = dynamic(
    () => import("@/components/landing/sections/DownloadSection"),
    { ssr: true },
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
const ToolsSection = dynamic(
    () => import("@/components/landing/sections/ToolsSection"),
    { ssr: true }
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
            operatingSystem: "Web, Windows, macOS",
            inLanguage: "de-DE",
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
                "Kostenlose Open-Source Rechnungssoftware für Rechnungen, Angebote, XRechnung, ZUGFeRD, PDF-Export, Kundenverwaltung und Zahlungserinnerungen.",
            author: {
                "@id": `${siteUrl}/#organization`,
            },
            publisher: {
                "@id": `${siteUrl}/#organization`,
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
                "Transparenter Open-Source-Quellcode",
                "KI-gestützte Rechnungshilfe (BYOK)",
                "DATEV-Export",
                "Rechly Desktop (100 % offline für Windows & Mac)",
                "Open Source & selbst hostbar",
            ],
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
            mainEntity: homeFaqsDe.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                },
            })),
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
                <ToolsSection />
                <FeaturesSection />
                <DownloadSection />
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
