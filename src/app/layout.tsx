import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
    getOptionalAnalyticsId,
    getSiteUrl,
    getTwitterHandle,
} from "@/lib/env";
import GlobalJsonLd from "@/components/seo/GlobalJsonLd";
import "./globals.css";

const siteUrl = getSiteUrl();
const analyticsId = getOptionalAnalyticsId();
const twitterHandle = getTwitterHandle();

// Viewport configuration to prevent iOS zoom on input focus
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    applicationName: "Rechly",
    title: {
        default:
            "Rechly - Rechnungssoftware für Freelancer & Selbstständige in Deutschland",
        template: "%s | Rechly - Rechnungsprogramm",
    },
    description:
        "Kostenlose Rechnungssoftware für Deutschland: Online Rechnungen erstellen, XRechnung & ZUGFeRD exportieren, Kunden verwalten und PDF-Rechnungen erzeugen. GoBD-konform, DSGVO-sicher, Open Source.",
    keywords: [
        "Rechnung erstellen online",
        "Rechnungsprogramm",
        "Rechnungssoftware",
        "Online Rechnungssoftware",
        "Rechnung schreiben online",
        "Rechnungsvorlage",
        "Rechnungsgenerator",
        "Rechnungsprogramm kostenlos",
        "Freelancer Rechnungsprogramm",
        "Selbstständige Rechnungssoftware",
        "Kleinunternehmer Rechnung",
        "E-Rechnung Software",
        "E-Rechnung Pflicht 2025",
        "XRechnung erstellen",
        "ZUGFeRD Rechnung",
        "GoBD konforme Rechnung",
        "DSGVO konforme Rechnungssoftware",
        "Open Source Rechnungsprogramm",
        "Rechnungen schreiben Freiberufler",
        "Rechnungssoftware Deutschland",
        "Rechnung erstellen für Freelancer",
        "Rechnung online schreiben kostenlos",
        "Rechnungsprogramm Kleinunternehmer",
        "Angebot erstellen online",
        "Mahnung schreiben",
        "Zahlungserinnerung erstellen",
        "invoice software Germany",
        "free invoicing tool freelancers",
    ],
    authors: [{ name: "Rechly", url: siteUrl }],
    creator: "Rechly",
    publisher: "Rechly",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(siteUrl),
    alternates: {
        languages: {
            "de": siteUrl,
            "x-default": siteUrl,
        },
    },
    openGraph: {
        type: "website",
        locale: "de_DE",
        alternateLocale: ["en_US"],
        url: siteUrl,
        siteName: "Rechly",
        title: "Rechly - Kostenlose Rechnungssoftware für Freelancer & Selbstständige",
        description:
            "Rechnungen online erstellen, XRechnung & ZUGFeRD exportieren, Kunden verwalten und professionelle PDFs erzeugen. GoBD-konform, DSGVO-sicher, Open Source.",
        images: [
            {
                url: `${siteUrl}/opengraph-image`,
                width: 1200,
                height: 630,
                alt: "Rechly - Kostenlose deutsche Rechnungssoftware für Freelancer",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Rechly - Kostenlose Rechnungssoftware für Deutschland",
        description:
            "Rechnungen erstellen, Kunden verwalten, XRechnung exportieren. Open Source, GoBD-konform, DSGVO-sicher. Perfekt für Freelancer und Selbstständige.",
        images: [`${siteUrl}/opengraph-image`],
        creator: twitterHandle,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon/favicon.svg", type: "image/svg+xml" },
            {
                url: "/favicon/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png",
            },
        ],
        shortcut: "/favicon.ico",
        apple: "/favicon/apple-touch-icon.png",
    },
    manifest: "/favicon/site.webmanifest",
    verification: {},
    category: "business",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" suppressHydrationWarning>
            <head>
                <GlobalJsonLd />
            </head>
            <body>
                {analyticsId ? (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
                            strategy="afterInteractive"
                        />
                        <Script
                            id="google-analytics"
                            strategy="afterInteractive"
                        >
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());

                                gtag('config', '${analyticsId}');
                            `}
                        </Script>
                    </>
                ) : null}
                <AntdRegistry>
                    <LanguageProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </LanguageProvider>
                </AntdRegistry>
                <Analytics />
            </body>
        </html>
    );
}
