import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/rechnungssoftware-fuer-freelancer";

export const metadata: Metadata = {
    title: "Rechnungssoftware für Freelancer",
    description:
        "Rechnungssoftware für Freelancer in Deutschland: Rechnungen schreiben, Kunden verwalten, PDFs exportieren und offene Zahlungen im Blick behalten.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "Rechnungssoftware für Freelancer | Rechly",
        description:
            "Deutsche Rechnungssoftware für Freelancer mit Fokus auf schnelle Rechnungserstellung, Kundenverwaltung und Follow-ups.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function FreelancerPage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="RECHNUNGSSOFTWARE FÜR FREELANCER"
            title="Rechnungssoftware für Freelancer: schnell schreiben, sauber abrechnen"
            intro="Freelancer brauchen keine überladene ERP-Suite. Sie brauchen eine Rechnungssoftware, mit der Angebote, Rechnungen, Kundendaten und Zahlungserinnerungen ohne Reibung zusammenlaufen."
            summary="Rechly ist auf diesen Alltag ausgelegt: Positionen erfassen, PDF-Rechnungen erstellen, Kunden verwalten und offene Beträge nachfassen. Für den deutschen Markt sind vor allem klare Pflichtangaben, verlässliche Nummernkreise und nachvollziehbare Prozesse wichtig."
            keywordPills={[
                "Rechnungssoftware für Freelancer",
                "Freelancer Rechnungsprogramm",
                "Rechnung schreiben online",
                "Kundenverwaltung",
            ]}
            sections={[
                {
                    title: "Was Freelancer von einer Rechnungssoftware wirklich brauchen",
                    body: [
                        "Im Freelancer-Alltag ist Geschwindigkeit wichtiger als Funktionsballast. Zwischen Kundenkommunikation, Projektarbeit und Abrechnung sollte die Rechnungserstellung nicht zum eigenen Projekt werden.",
                        "Eine gute Rechnungssoftware für Freelancer verbindet deshalb drei Dinge: klare Kundendaten, saubere Rechnungslogik und schnelle Folgeaktionen, wenn eine Zahlung offen bleibt.",
                    ],
                    bullets: [
                        "Rechnungen mit Pflichtangaben und sauberer Struktur erstellen",
                        "Kunden einmal anlegen und bei jeder Rechnung wiederverwenden",
                        "PDFs ohne Zusatzschritte exportieren und versenden",
                        "Offene Rechnungen und Erinnerungstexte direkt im Workflow starten",
                    ],
                },
                {
                    title: "Warum Rechly für Freelancer interessant ist",
                    body: [
                        "Rechly konzentriert sich auf die Kernaufgaben kleiner Dienstleistungs- und Kreativbetriebe. Statt komplexer Buchhaltungsoberflächen bekommst du eine klare Abfolge aus Erfassen, Versenden und Nachverfolgen.",
                        "Dazu kommen offene Deployment-Optionen, ein Open-Source-Ansatz und KI-Hilfen für Notizen, Leistungsbeschreibungen oder freundliche Zahlungserinnerungen mit dem eigenen Anbieter und API-Schlüssel.",
                    ],
                    bullets: [
                        "Open Source statt Black Box",
                        "Deutsche SEO- und Rechtsanforderungen im Blick",
                        "Eigener KI-Provider pro Account möglich",
                        "Geeignet für Solo-Selbstständige und kleine Teams",
                    ],
                },
                {
                    title: "Worauf du bei deutscher Freelancer-Abrechnung achten solltest",
                    body: [
                        "Für Freelancer in Deutschland zählen vor allem saubere Stammdaten, konsistente Rechnungsnummern und verständliche Leistungsbeschreibungen. Gerade bei wiederkehrenden Kunden spart eine gute Struktur jeden Monat Zeit.",
                        "Rechly ersetzt keine Steuerberatung, hilft aber dabei, Rechnungsdaten, Kundeninformationen und Follow-ups so zu organisieren, dass dein Prozess ruhiger und weniger fehleranfällig wird.",
                    ],
                },
            ]}
            faqs={[
                {
                    question: "Ist Rechly für Solo-Freelancer geeignet?",
                    answer: "Ja. Rechly ist gerade für kleine Setups gedacht, in denen Rechnungen, Kundendaten und Zahlungserinnerungen ohne Team-Overhead funktionieren sollen.",
                },
                {
                    question: "Kann ich mit Rechly PDF-Rechnungen exportieren?",
                    answer: "Ja. Rechly ist auf professionelle PDF-Rechnungen ausgelegt, damit du Rechnungen direkt weitergeben oder versenden kannst.",
                },
                {
                    question: "Hilft Rechly auch bei offenen Zahlungen?",
                    answer: "Ja. Offene Rechnungen können im Workflow verfolgt werden, und für Erinnerungstexte gibt es KI-gestützte Entwürfe direkt aus dem Rechnungs- oder Kundenkontext.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/kleinunternehmer-rechnung",
                    title: "Kleinunternehmer Rechnung",
                    description:
                        "Welche Angaben auf Rechnungen für Kleinunternehmer typischerweise wichtig sind.",
                },
                {
                    href: "/e-rechnung-software",
                    title: "E-Rechnung Software",
                    description:
                        "Wie du Rechnungsdaten für strukturierte Prozesse und E-Rechnungsvorbereitung sauber hältst.",
                },
            ]}
        />
    );
}
