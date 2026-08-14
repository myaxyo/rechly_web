import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
    title: "Datenschutzerklärung",
    description:
        "Datenschutzerklärung von Rechly mit Informationen zu Hosting, Cookies, Datenverarbeitung und Rechten nach der DSGVO.",
    path: "/datenschutz",
});

export default function DatenschutzLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
