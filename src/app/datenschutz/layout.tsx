import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Datenschutz",
    description:
        "Datenschutzerklärung von Rechly mit Informationen zu Hosting, Cookies, Datenverarbeitung und deinen Rechten nach DSGVO.",
    alternates: {
        canonical: "/datenschutz",
    },
};

export default function DatenschutzLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
