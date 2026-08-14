import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
    title: "Nutzungsbedingungen",
    description:
        "Nutzungsbedingungen für Rechly, die kostenlose Open-Source Rechnungssoftware für Deutschland.",
    path: "/agb",
});

export default function AgbLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
