import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rechly.de";

// Viewport configuration to prevent iOS zoom on input focus
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    // Primary Meta Tags - German SEO optimized
    title: {
        default:
            "Rechly - Kostenlose Rechnungssoftware | Rechnung erstellen online",
        template: "%s | Rechly - Rechnungsprogramm",
    },
    description:
        "Rechnung erstellen online kostenlos mit Rechly. Das beste Rechnungsprogramm für Freelancer und Selbstständige in Deutschland. DSGVO-konform, Open Source, keine versteckten Kosten. Professionelle Rechnungsvorlagen, Kundenverwaltung & Cloud-Sync.",
    keywords: [
        // Primary German keywords
        "Rechnung erstellen online",
        "Rechnungsprogramm",
        "Rechnungssoftware",
        "Rechnungstool",
        "Online Rechnungssoftware",
        "Rechnung schreiben online",
        "Rechnungsvorlage online",
        "Rechnungsprogramm kostenlos",
        "Rechnung erstellen kostenlos",
        // Secondary keywords
        "Rechnungsgenerator",
        "Invoice Generator",
        "Freelancer Rechnungsprogramm",
        "Selbstständige Rechnungssoftware",
        "Kleinunternehmer Rechnung",
        "GoBD konforme Rechnung",
        "DSGVO konforme Rechnungssoftware",
        "Open Source Rechnungsprogramm",
        // Long-tail keywords
        "kostenlose Rechnungsvorlage",
        "Rechnung online erstellen ohne Anmeldung",
        "einfaches Rechnungsprogramm",
        "Rechnungen schreiben Freiberufler",
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
        languages: {
            "de-DE": "/",
            "en-US": "/",
        },
    },
    // Open Graph for Social Sharing
    openGraph: {
        type: "website",
        locale: "de_DE",
        alternateLocale: "en_US",
        url: siteUrl,
        siteName: "Rechly",
        title: "Rechly - Kostenlose Rechnungssoftware für Deutschland",
        description:
            "Erstelle professionelle Rechnungen in Sekunden. Kostenloses Open-Source Rechnungsprogramm für Freelancer, Selbstständige und kleine Unternehmen. DSGVO-konform, Server in Deutschland.",
        images: [
            {
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "Rechly - Kostenlose Rechnungssoftware",
            },
        ],
    },
    // Twitter Card
    twitter: {
        card: "summary_large_image",
        title: "Rechly - Kostenlose Rechnungssoftware | Online Rechnung erstellen",
        description:
            "Professionelle Rechnungen erstellen in Sekunden. Kostenlos, Open Source, DSGVO-konform. Das Rechnungsprogramm für Freelancer in Deutschland.",
        images: [`${siteUrl}/og-image.png`],
        creator: "@rechly_app",
    },
    // Robots
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
    // Icons
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
    // Verification (add your IDs later)
    verification: {
        // google: "your-google-verification-code",
        // yandex: "your-yandex-verification-code",
    },
    // Category
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
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-CNKVXS1FVZ"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-CNKVXS1FVZ');
                    `}
                </Script>
                <AntdRegistry>
                    <LanguageProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </LanguageProvider>
                </AntdRegistry>
            </body>
        </html>
    );
}
