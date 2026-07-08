import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Impressum",
    description:
        "Impressum und Kontaktinformationen zum Open-Source-Projekt Rechly.",
    alternates: {
        canonical: "/impressum",
    },
};

export default function ImpressumLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
