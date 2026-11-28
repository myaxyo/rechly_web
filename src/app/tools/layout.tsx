import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
    title: "30+ Kostenlose Business-Tools, Rechner & PDF-Generatoren",
    description:
        "Kostenlose Online-Rechner & Generatoren ohne Anmeldung: Rechnungsgenerator, Angebotsgenerator, XRechnung Viewer, MwSt-Rechner, Spesenrechner 2027 & USt-IdNr.-Prüfer.",
    path: "/tools",
    keywords: [
        "Business Tools kostenlos",
        "Rechnungstools kostenlos",
        "Rechenportal Alternative",
        "Rechnungsgenerator kostenlos",
        "Angebotsgenerator",
        "E-Rechnung Viewer",
        "GiroCode Generator",
        "Mehrwertsteuerrechner",
        "Stundensatz Rechner",
        "Verzugszinsen Rechner",
        "USt-IdNr prüfen",
        "Kleinunternehmer Rechner",
        "Steuerkalender 2027",
        "Steuerkalender 2026",
    ],
    category: "Business-Superapp & Rechner",
});

export default function ToolsHubLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
