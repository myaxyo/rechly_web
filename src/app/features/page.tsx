import { createPageMetadata } from "@/lib/seo";
import FeaturesClient from "./FeaturesClient";

export const metadata = createPageMetadata({
    title: "Rechnungsprogramm: Funktionen für 0 € im Überblick",
    description:
        "Rechnungen, E-Rechnung (XRechnung, ZUGFeRD), Angebote, DATEV und Terminbuchung: alle Funktionen von Rechly kostenlos und ohne Limits.",
    path: "/features",
});

export default function FeaturesPage() {
    return <FeaturesClient />;
}
