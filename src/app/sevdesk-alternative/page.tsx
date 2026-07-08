import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/sevdesk-alternative";

export const metadata: Metadata = {
    title: "sevdesk Alternative",
    description:
        "sevdesk Alternative: Wann Rechly für Rechnungen, Kundenverwaltung und offene Zahlungen die passendere Wahl sein kann, wenn du ein fokussiertes System suchst.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "sevdesk Alternative | Rechly",
        description:
            "Für Nutzer, die eine sevdesk Alternative mit Open-Source-Ansatz, klarer Rechnungslogik und ruhigem Workflow vergleichen wollen.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function SevdeskAlternativePage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="SEVDESK ALTERNATIVE"
            title="sevdesk Alternative: wenn du Rechnungen mit weniger Reibung organisieren willst"
            intro="Wer nach einer sevdesk Alternative sucht, vergleicht selten nur Funktionslisten. Meistens geht es darum, ob ein anderes Tool im Alltag ruhiger funktioniert, klarer fokussiert ist oder besser zum eigenen Setup passt."
            summary="Rechly ist hier vor allem für Nutzer interessant, die Rechnungen, Kunden und Zahlungserinnerungen in einem kompakten Ablauf organisieren wollen und zusätzlich Wert auf Open Source, eigene Hosting-Optionen und konfigurierbare KI-Funktionen legen."
            keywordPills={[
                "sevdesk Alternative",
                "Alternative zu sevdesk",
                "Rechnungssoftware Alternative",
                "Rechnungen online erstellen",
            ]}
            sections={[
                {
                    title: "Warum der Vergleich bei Rechnungssoftware selten nur technisch ist",
                    body: [
                        "Bei Vergleichssuchen wie sevdesk Alternative zählt nicht nur, was ein Tool theoretisch kann. Wichtiger ist, ob es im Alltag zu deiner Arbeitsweise passt: schnell Rechnungen schreiben, Kundendaten wiederverwenden, PDFs erzeugen und offene Rechnungen ohne Bruch im Prozess nachverfolgen.",
                        "Vor allem kleine Teams und Solo-Selbstständige merken schnell, wenn eine Lösung mehr Oberfläche als operative Klarheit liefert.",
                    ],
                    bullets: [
                        "Klare Rechnungserstellung statt verschachtelter Wege",
                        "Kundendaten und Positionen sauber wiederverwenden",
                        "Erinnerungen und Follow-ups direkt aus dem Workflow starten",
                        "Weniger Reibung für kleine Teams",
                    ],
                },
                {
                    title: "Was Rechly im Vergleich interessant macht",
                    body: [
                        "Rechly konzentriert sich bewusst auf den Kernprozess: Rechnungen, Kunden, PDFs, Erinnerungen und KI-unterstützte Textarbeit an den Stellen, an denen sie im Alltag wirklich hilft. Das Produkt versucht nicht, jede Business-Funktion gleichzeitig zu sein.",
                        "Für Vergleichssucher ist das relevant, wenn sie eine verständliche Alternative mit weniger Produktballast und mehr Transparenz suchen.",
                    ],
                    bullets: [
                        "Open Source und nachvollziehbare Architektur",
                        "Bring your own AI provider statt fester KI-Abhängigkeit",
                        "Fokussiert auf deutsche Rechnungsabläufe",
                        "Geeignet für operative Rechnungsarbeit statt Tool-Verwaltung",
                    ],
                },
                {
                    title: "Wie du eine Alternative realistisch bewertest",
                    body: [
                        "Der sauberste Vergleich entsteht, wenn du nicht nur Features, sondern konkrete Arbeitsmomente prüfst: Wie schnell entsteht eine Rechnung? Wie leicht lassen sich Erinnerungen aus offenen Forderungen ableiten? Wie klar bleibt die Oberfläche nach einigen Wochen Nutzung?",
                        "Wenn diese Fragen wichtiger sind als ein maximal breiter Funktionskatalog, lohnt es sich, fokussierte Alternativen ernsthaft zu testen.",
                    ],
                },
            ]}
            faqs={[
                {
                    question: "Ist Rechly nur für sehr kleine Teams gedacht?",
                    answer: "Der Schwerpunkt liegt klar auf Freelancern, Selbstständigen und kleineren Teams. Genau dort bringt ein fokussierter Rechnungsworkflow meist den größten Mehrwert.",
                },
                {
                    question:
                        "Kann ich mit Rechly auch offene Rechnungen besser nachverfolgen?",
                    answer: "Ja. Rechly verbindet Rechnungskontext, Kundendaten und Erinnerungsschritte, damit offene Forderungen nicht als separater Prozess behandelt werden müssen.",
                },
                {
                    question:
                        "Geht es bei einer sevdesk Alternative nur um Preis?",
                    answer: "Nicht nur. Häufig spielen auch Transparenz, Produktfokus, Hosting-Kontrolle und die Frage eine Rolle, wie ruhig sich das Tool im Alltag anfühlt.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/lexoffice-alternative",
                    title: "lexoffice Alternative",
                    description:
                        "Eine weitere Vergleichsseite für Nutzer mit klarer Alternativen-Suche.",
                },
                {
                    href: "/rechnungsprogramm-kostenlos",
                    title: "Rechnungsprogramm kostenlos",
                    description:
                        "Wenn du stattdessen auf freie Nutzung und Open-Source-Ansatz fokussierst.",
                },
            ]}
        />
    );
}
