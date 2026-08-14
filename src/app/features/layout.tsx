import { createPageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export const metadata = createPageMetadata({
    title: "Funktionen der Rechly Rechnungssoftware",
    description:
        "Rechnungen, Angebote, XRechnung, ZUGFeRD, Kundenverwaltung, Zahlungserinnerungen, Ausgaben, Bankabgleich und DATEV-Export in Rechly entdecken.",
    path: "/features",
});

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
                    "Entdecke die Funktionen von Rechly: Rechnungen online schreiben, Kunden verwalten, PDFs exportieren, Cloud-Sync nutzen und die Open-Source-Software selbst hosten.",
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
