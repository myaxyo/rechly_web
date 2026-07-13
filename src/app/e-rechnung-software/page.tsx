import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/e-rechnung-software";

export const metadata: Metadata = {
    title: "E-Rechnung Software – XRechnung & ZUGFeRD für Kleinunternehmer",
    description:
        "E-Rechnung Software für Deutschland: XRechnung erstellen, ZUGFeRD exportieren, Leitweg-ID verwalten. Bereite dein Unternehmen auf die E-Rechnungspflicht 2025 vor. Kostenlos mit Rechly.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "E-Rechnung Software | Rechly",
        description:
            "XRechnung und ZUGFeRD für kleine Unternehmen: Kundendaten, Leitweg-ID und strukturierte Rechnungsprozesse mit kostenloser Open-Source-Software vorbereiten.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function ERechnungSoftwarePage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="E-RECHNUNG SOFTWARE"
            title="E-Rechnung Software: Prozesse heute sauber aufsetzen"
            intro="Die Suche nach E-Rechnung Software beginnt oft mit Dateiformaten. In der Praxis ist der wichtigere Schritt aber früher: Kundendaten, Rechnungslogik und Pflichtfelder so zu strukturieren, dass spätere E-Rechnungsprozesse nicht chaotisch werden."
            summary="Rechly ist eine offene Grundlage für deutsche Rechnungsabläufe. Kundendaten, Leitweg-ID-Felder, Rechnungspositionen und PDF-Workflows lassen sich bereits heute sauber organisieren, damit dein Team auf E-Rechnung-Anforderungen vorbereitet ist, ohne sofort in ein überdimensioniertes System zu wechseln."
            keywordPills={[
                "E-Rechnung Software",
                "Leitweg-ID",
                "strukturierte Rechnungsdaten",
                "Rechnungssoftware Deutschland",
            ]}
            sections={[
                {
                    title: "Was kleine Unternehmen bei E-Rechnungen jetzt beachten sollten",
                    body: [
                        "Wer künftig strukturierte Rechnungsprozesse bedienen will, sollte nicht erst beim Export anfangen. Relevante Kundendaten, Ansprechpartner, Leitweg-ID und konsistente Positionsdaten gehören früh in den Prozess.",
                        "Genau an dieser Stelle hilft eine Rechnungssoftware, die Stammdaten sauber verwaltet und nicht nur einzelne PDFs produziert. Je strukturierter deine Datenbasis ist, desto leichter lassen sich spätere Anforderungen abbilden.",
                    ],
                    bullets: [
                        "Kundenstammdaten vollständig und einheitlich pflegen",
                        "Leitweg-ID und zusätzliche Felder klar zuordnen",
                        "Rechnungspositionen nachvollziehbar beschreiben",
                        "Interne Prozesse für Freigabe, Versand und Nachverfolgung vereinheitlichen",
                    ],
                },
                {
                    title: "Wie Rechly bei E-Rechnungsnähe unterstützt",
                    body: [
                        "Rechly positioniert sich als offene Rechnungssoftware für deutsche Teams, die eine klare Datenbasis wollen. In der Kundenverwaltung gibt es Felder für deutsche Abrechnungsrealität, und die offene Codebasis ist wichtig, wenn Prozesse später erweitert oder angepasst werden sollen.",
                        "Das ist besonders dann sinnvoll, wenn du heute ein schlankes System brauchst, aber gleichzeitig vermeiden willst, dass Kunden- und Rechnungsdaten später wieder mühsam migriert oder bereinigt werden müssen.",
                    ],
                    bullets: [
                        "Open Source für transparente Erweiterbarkeit",
                        "Kunden- und Rechnungsfelder für deutsche Anforderungen",
                        "Zentraler Ablauf für Erstellen, Exportieren und Nachfassen",
                        "Gute Basis für teamspezifische Weiterentwicklung",
                    ],
                },
                {
                    title: "Wichtig: E-Rechnung ist mehr als ein neues Dateiformat",
                    body: [
                        "Für viele Unternehmen ist die eigentliche Herausforderung organisatorisch: Datenqualität, wiederverwendbare Kundenprofile, klare Prozesse und ein System, das nicht nach zwei Wochen Workarounds produziert.",
                        "Rechly hilft dabei, diese Grundlage aufzubauen. Ob und welche konkreten E-Rechnungsformate oder Anforderungen für deinen Einsatzfall relevant sind, solltest du anschließend fachlich und regulatorisch passend bewerten.",
                    ],
                },
            ]}
            faqs={[
                {
                    question: "Ist E-Rechnung nur ein PDF per E-Mail?",
                    answer: "Nein. Im fachlichen Kontext geht es typischerweise um strukturierte Rechnungsdaten. Deshalb ist eine saubere Datenbasis in Kunden- und Rechnungsfeldern entscheidend.",
                },
                {
                    question:
                        "Warum ist die Leitweg-ID für manche Unternehmen relevant?",
                    answer: "Je nach Empfänger und Prozess kann die Leitweg-ID ein wichtiges Zuordnungsmerkmal sein. Deshalb ist es hilfreich, wenn solche Felder in der Kundenverwaltung früh mitgedacht werden.",
                },
                {
                    question:
                        "Ist Rechly eine rechtliche Zusage für jede E-Rechnungsanforderung?",
                    answer: "Nein. Rechly unterstützt strukturierte Rechnungsprozesse und eine saubere Datenbasis. Welche regulatorischen Anforderungen in deinem Fall erfüllt werden müssen, solltest du separat prüfen.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/rechnungssoftware-fuer-freelancer",
                    title: "Rechnungssoftware für Freelancer",
                    description:
                        "Wenn du eher projektbasiert und solo arbeitest, ist diese Seite der passendere Einstieg.",
                },
                {
                    href: "/kleinunternehmer-rechnung",
                    title: "Kleinunternehmer Rechnung",
                    description:
                        "Für kleine Betriebe mit Fokus auf Pflichtangaben und einfache Abrechnung ohne unnötige Komplexität.",
                },
            ]}
        />
    );
}
