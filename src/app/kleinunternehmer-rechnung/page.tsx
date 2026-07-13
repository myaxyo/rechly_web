import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/kleinunternehmer-rechnung";

export const metadata: Metadata = {
    title: "Kleinunternehmer Rechnung erstellen – §19 UStG Vorlage",
    description:
        "Kleinunternehmer Rechnung erstellen: Alle Pflichtangaben nach §19 UStG, korrekte Rechnungsnummern, Kundenverwaltung und PDF-Export. Kostenlos mit Rechly.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "Kleinunternehmer Rechnung | Rechly",
        description:
            "Rechnungen für Kleinunternehmer mit allen Pflichtangaben nach deutschem Recht. PDF-Export, Kundenverwaltung und Zahlungserinnerungen inklusive.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function KleinunternehmerPage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="KLEINUNTERNEHMER RECHNUNG"
            title="Kleinunternehmer Rechnung: klare Pflichtangaben, ruhiger Ablauf"
            intro="Wer als Kleinunternehmer Rechnungen schreibt, braucht vor allem Klarheit. Kundendaten, Leistungsbeschreibung, Rechnungsnummer und der passende Hinweis zur Kleinunternehmerregelung müssen sauber zusammenpassen."
            summary="Rechly hilft dir dabei, Rechnungsdaten strukturiert zu erfassen und daraus nachvollziehbare Rechnungen zu erzeugen. Das ist besonders wertvoll, wenn du alleine arbeitest und Fehler in der Abrechnung möglichst vermeiden willst."
            keywordPills={[
                "Kleinunternehmer Rechnung",
                "§19 UStG Rechnung",
                "Rechnung Kleinunternehmer",
                "Rechnungsvorlage Deutschland",
            ]}
            sections={[
                {
                    title: "Was bei einer Kleinunternehmer-Rechnung wichtig ist",
                    body: [
                        "Kleinunternehmer müssen ihre Rechnungen nicht mit unnötiger Komplexität aufladen, aber die grundlegenden Angaben sollten vollständig und nachvollziehbar sein. Dazu zählen typischerweise Absender, Empfänger, Rechnungsdatum, Rechnungsnummer, Leistungsbeschreibung und Zahlungsinformationen.",
                        "Wenn du die Kleinunternehmerregelung nutzt, ist außerdem der passende Hinweis wichtig. In der Praxis wird dafür häufig auf §19 UStG verwiesen. Welche Formulierung für deinen Fall passt, solltest du im Zweifel steuerlich prüfen lassen.",
                    ],
                    bullets: [
                        "Kunden- und Absenderdaten vollständig pflegen",
                        "Rechnungsnummern konsistent vergeben",
                        "Leistungen verständlich und prüfbar beschreiben",
                        "Hinweis zur Kleinunternehmerregelung sauber dokumentieren",
                    ],
                },
                {
                    title: "Wie Rechly Kleinunternehmer im Alltag unterstützt",
                    body: [
                        "Für viele Kleinunternehmer ist nicht die Theorie das Problem, sondern der laufende Prozess: neue Kunden, wiederkehrende Rechnungen, PDF-Export und Erinnerung bei verspäteter Zahlung. Genau dort spart eine aufgeräumte Rechnungssoftware Zeit.",
                        "Rechly bündelt Kundendaten, Positionen und Notizen an einem Ort. Dadurch wird aus einer losen Rechnungsvorlage ein reproduzierbarer Ablauf, den du nicht jeden Monat neu zusammensetzen musst.",
                    ],
                    bullets: [
                        "Kunden einmal anlegen und wiederverwenden",
                        "Rechnungen als PDF exportieren",
                        "Zahlungsbedingungen und Notizen zentral verwalten",
                        "Bei offenen Beträgen direkt an passende Erinnerungen anknüpfen",
                    ],
                },
                {
                    title: "Kleinunternehmer-Rechnung ohne unnötigen Verwaltungsdruck",
                    body: [
                        "Gerade für Solo-Selbstständige ist wichtig, dass die Rechnungssoftware nicht komplizierter wird als das eigentliche Geschäft. Eine schlanke Oberfläche und klare Datenfelder senken die Hürde deutlich.",
                        "Rechly ist keine Steuerberatung. Es ist eine offene Arbeitsgrundlage, mit der du deine Rechnungsprozesse strukturiert, wiederholbar und verständlich halten kannst.",
                    ],
                },
            ]}
            faqs={[
                {
                    question:
                        "Brauche ich als Kleinunternehmer eine spezielle Rechnungssoftware?",
                    answer: "Nicht zwingend eine spezielle Software, aber ein sauberer Workflow hilft enorm. Gerade bei wiederkehrenden Rechnungen und mehreren Kunden spart eine strukturierte Lösung spürbar Zeit.",
                },
                {
                    question: "Ersetzt Rechly steuerliche Beratung?",
                    answer: "Nein. Rechly unterstützt deinen Rechnungsprozess, ersetzt aber keine steuerliche oder rechtliche Beratung für individuelle Fälle.",
                },
                {
                    question:
                        "Ist der Hinweis auf §19 UStG automatisch eine Rechtsgarantie?",
                    answer: "Nein. Rechly kann dich beim strukturierten Erfassen von Rechnungsdaten unterstützen. Ob eine Formulierung oder ein Einzelfall korrekt ist, solltest du bei Bedarf mit Steuerberatung oder Buchhaltung abstimmen.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/rechnungssoftware-fuer-freelancer",
                    title: "Rechnungssoftware für Freelancer",
                    description:
                        "Für Dienstleister und Freiberufler mit Fokus auf schnellen Rechnungsläufen.",
                },
                {
                    href: "/e-rechnung-software",
                    title: "E-Rechnung Software",
                    description:
                        "Welche Daten und Prozesse heute schon für E-Rechnungsthemen vorbereitet werden sollten.",
                },
            ]}
        />
    );
}
