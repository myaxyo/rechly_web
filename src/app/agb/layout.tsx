import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nutzungsbedingungen",
    description:
        "Nutzungsbedingungen für Rechly, die kostenlose Open-Source-Rechnungssoftware für Deutschland.",
    alternates: {
        canonical: "/agb",
    },
};

export default function AgbLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
