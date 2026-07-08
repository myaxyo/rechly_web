import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Funktionen",
    description:
        "Entdecke die Funktionen von Rechly: Rechnungen online schreiben, Kunden verwalten, PDFs exportieren, Cloud-Sync nutzen und DSGVO-konform arbeiten.",
    alternates: {
        canonical: "/features",
    },
};

export default function FeaturesLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
