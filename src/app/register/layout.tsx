import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Registrieren",
    description:
        "Erstelle dein Rechly-Konto, um Rechnungen online zu schreiben und deine Kunden zentral zu verwalten.",
    alternates: {
        canonical: "/register",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function RegisterLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
