import { getSiteUrl, getRepoUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const repoUrl = getRepoUrl();

/**
 * Global JSON-LD structured data rendered in root layout.
 * Provides Organization and WebSite schema (with SearchAction) on every page,
 * helping Google understand site hierarchy, topical authority, and sitelinks searchbox.
 */
export default function GlobalJsonLd() {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: "Rechly",
                url: siteUrl,
                logo: {
                    "@type": "ImageObject",
                    "@id": `${siteUrl}/#logo`,
                    url: `${siteUrl}/logo.png`,
                    contentUrl: `${siteUrl}/logo.png`,
                    width: 512,
                    height: 512,
                    caption: "Rechly",
                },
                description:
                    "Open-Source Rechnungssoftware & kostenlose Business-Superapp für Deutschland. Entwickelt für Freelancer, Selbstständige, Handwerker und kleine Unternehmen.",
                areaServed: {
                    "@type": "Country",
                    name: "Germany",
                },
                knowsAbout: [
                    "Rechnungssoftware",
                    "E-Rechnung (XRechnung & ZUGFeRD)",
                    "Kleinunternehmerregelung (§ 19 UStG)",
                    "Pflichtangaben Rechnung (§ 14 UStG)",
                    "Umsatzsteuer & EÜR (§ 4 Abs. 3 EStG)",
                    "GoBD-konforme Buchhaltung",
                    "SEPA GiroCode & ISO 20022 XML",
                    "Mahnwesen & Verzugszinsen (§ 288 BGB)",
                ],
                sameAs: [
                    repoUrl,
                    "https://github.com/myaxyo/rechly_desktop",
                ],
            },
            {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                name: "Rechly",
                alternateName: "Rechly Business-Superapp Deutschland",
                url: siteUrl,
                publisher: {
                    "@id": `${siteUrl}/#organization`,
                },
                inLanguage: "de-DE",
                potentialAction: {
                    "@type": "SearchAction",
                    target: {
                        "@type": "EntryPoint",
                        urlTemplate: `${siteUrl}/tools?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                },
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData),
            }}
        />
    );
}
