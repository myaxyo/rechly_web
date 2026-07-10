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
        "Rechly ist eine deutsche Rechnungssoftware für Freelancer, Selbstständige und kleine Unternehmen. Online Rechnungen schreiben, Kunden verwalten, PDFs erzeugen und DSGVO-konform arbeiten.",
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
        "E-Rechnung Software Kleinunternehmer",
        "GoBD konforme Rechnung",
        "DSGVO konforme Rechnungssoftware",
        "Open Source Rechnungsprogramm",
        "Rechnungen schreiben Freiberufler",
        "Rechnungssoftware Deutschland",
        "Rechnung erstellen für Freelancer",
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
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "de_DE",
        url: siteUrl,
        siteName: "Rechly",
        title: "Rechly - Deutsche Rechnungssoftware für Freelancer und Selbstständige",
        description:
            "Rechnungen online erstellen, Kunden verwalten und professionelle PDFs erzeugen. Entwickelt für den deutschen Markt mit Fokus auf DSGVO, GoBD und einfache Workflows.",
        images: [
            {
                url: `${siteUrl}/opengraph-image`,
                width: 1200,
                height: 630,
                alt: "Rechly - Deutsche Rechnungssoftware",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Rechly - Rechnungen online schreiben für den deutschen Markt",
        description:
            "Deutsche Rechnungssoftware für Freelancer, Selbstständige und kleine Teams. DSGVO-konform, Open Source und auf schnelle Rechnungserstellung ausgelegt.",
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
