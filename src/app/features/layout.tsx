import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
    title: "Funktionen & Features der Rechnungssoftware",
    description:
        "Alle Funktionen von Rechly im Überblick: Rechnungen erstellen, PDF-Export, XRechnung & ZUGFeRD, Kundenverwaltung, Zahlungserinnerungen, Ausgabenverwaltung, Bankabgleich, KI-Unterstützung. Kostenlos für Freelancer.",
    alternates: {
        canonical: "/features",
        languages: {
            "de": "/features",
            "x-default": "/features",
        },
    },
    openGraph: {
        title: "Funktionen | Rechly - Kostenlose Rechnungssoftware",
        description:
            "Professionelle Rechnungen, PDF-Export, XRechnung, ZUGFeRD, Kundenverwaltung, Angebote, Zahlungserinnerungen und KI-Unterstützung für Freelancer und Selbstständige.",
        url: `${siteUrl}/features`,
        type: "website",
    },
};

export default function FeaturesLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                name: "Funktionen",
                url: `${siteUrl}/features`,
                description:
                    "Entdecke die Funktionen von Rechly: Rechnungen online schreiben, Kunden verwalten, PDFs exportieren, Cloud-Sync nutzen und DSGVO-konform arbeiten.",
                isPartOf: {
                    "@type": "WebSite",
                    "@id": `${siteUrl}/#website`,
                },
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
                    {
                        "@type": "ListItem",
                        position: 2,
                        name: "Funktionen",
                        item: `${siteUrl}/features`,
                    },
                ],
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />
            {children}
        </>
    );
}
