import { getSiteUrl, getRepoUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const repoUrl = getRepoUrl();

/**
 * Global JSON-LD structured data rendered in root layout.
 * Provides Organization and WebSite schema on every page,
 * which helps Google understand site hierarchy and display breadcrumbs.
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
                    url: `${siteUrl}/favicon/favicon.svg`,
                },
                description:
                    "Open-Source Rechnungssoftware für Deutschland. Entwickelt für Freelancer, Selbstständige und kleine Unternehmen.",
                sameAs: [repoUrl],
            },
            {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                name: "Rechly",
                url: siteUrl,
                publisher: {
                    "@id": `${siteUrl}/#organization`,
                },
                inLanguage: "de-DE",
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
