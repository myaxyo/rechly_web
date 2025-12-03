import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
    title: "Rechly - Invoice Generator",
    description: "Professional invoice management for German businesses",
    icons: {
        icon: [
            { url: "/favicon/favicon.ico", sizes: "any" },
            { url: "/favicon/favicon.svg", type: "image/svg+xml" },
            {
                url: "/favicon/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png",
            },
        ],
        shortcut: "/favicon/favicon.ico",
        apple: "/favicon/apple-touch-icon.png",
    },
    manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body>
                <AntdRegistry>
                    <LanguageProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </LanguageProvider>
                </AntdRegistry>
            </body>
        </html>
    );
}
