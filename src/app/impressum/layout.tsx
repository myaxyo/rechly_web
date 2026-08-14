import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
    title: "Impressum",
    description:
        "Impressum, Verantwortliche und Kontaktinformationen zum Open-Source-Projekt Rechly.",
    path: "/impressum",
});

export default function ImpressumLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
