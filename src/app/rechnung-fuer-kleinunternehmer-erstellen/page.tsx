import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/rechnung-fuer-kleinunternehmer-erstellen";

export const metadata: Metadata = {
    title: "Rechnung für Kleinunternehmer erstellen",
    description:
        "Rechnung für Kleinunternehmer erstellen: Wie du Kundendaten, Pflichtangaben und den Hinweis zur Kleinunternehmerregelung in einen sauberen Rechnungsprozess bringst.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "Rechnung für Kleinunternehmer erstellen | Rechly",
        description:
            "So erstellst du als Kleinunternehmer strukturierte Rechnungen mit klaren Pflichtangaben und wiederverwendbaren Kundendaten.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function RechnungFuerKleinunternehmerErstellenPage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="RECHNUNG FÜR KLEINUNTERNEHMER ERSTELLEN"
            title="Rechnung für Kleinunternehmer erstellen: vom Einzelfall zum wiederholbaren Ablauf"
            intro="Wer nach 'Rechnung für Kleinunternehmer erstellen' sucht, ist meistens schon im Tun. Es geht nicht mehr um allgemeine Information, sondern darum, eine Rechnung sauber aufzusetzen und im Alltag ohne ständige Unsicherheit zu wiederholen."
            summary="Rechly unterstützt genau diesen Schritt: Kundendaten, Leistungsbeschreibung, Rechnungsnummern und Hinweise zur Kleinunternehmerregelung werden zu einem Workflow gebündelt, der für deutsche Kleinunternehmen alltagstauglich bleibt."
            keywordPills={[
                "Rechnung für Kleinunternehmer erstellen",
                "Kleinunternehmer Rechnung erstellen",
                "§19 UStG Rechnung",
                "Rechnung schreiben Kleinunternehmer",
            ]}
            sections={[
                {
                    title: "Der Unterschied zwischen Wissen und tatsächlichem Erstellen",
                    body: [
                        "Viele wissen grundsätzlich, dass eine Kleinunternehmer-Rechnung bestimmte Inhalte braucht. Schwieriger wird es beim tatsächlichen Erstellen, wenn Daten fehlen, Formulierungen unsicher sind oder Rechnungen immer wieder neu gebaut werden müssen.",
                        "Genau deshalb ist der Suchbegriff so relevant: Er beschreibt einen unmittelbaren Arbeitsmoment. An diesem Punkt hilft nicht nur Information, sondern eine Rechnungsstruktur, die sich jeden Monat wiederverwenden lässt.",
                    ],
                    bullets: [
                        "Rechnungsdaten einmal sauber anlegen",
                        "Kundenprofile wiederverwenden statt neu tippen",
                        "Pflichtangaben und Hinweise konsistent halten",
                        "PDF-Ausgabe direkt anschließen",
                    ],
                },
                {
                    title: "Wie Rechly das Erstellen von Kleinunternehmer-Rechnungen vereinfacht",
                    body: [
                        "Rechly bringt Kundendaten, Positionen, Notizen und Rechnungslogik in eine Oberfläche, die für kleine Betriebe verständlich bleibt. Dadurch wird aus einer einmal erstellten Rechnung ein Ablauf, der sich ruhig und schnell wiederholen lässt.",
                        "Besonders für Solo-Selbstständige und kleine Teams ist das relevant, weil die meiste Zeit nicht in Formalien, sondern im eigentlichen Geschäft stecken sollte.",
                    ],
                    bullets: [
                        "Weniger manuelle Arbeit pro Rechnung",
                        "Besserer Überblick über offene und versendete Rechnungen",
                        "Hilfreich für wiederkehrende Kunden und Leistungen",
                        "Offene Basis für spätere Erweiterungen",
                    ],
                },
                {
                    title: "Was du fachlich im Blick behalten solltest",
                    body: [
                        "Rechly kann dir den operativen Rechnungsprozess deutlich erleichtern. Welche steuerlichen Hinweise oder Formulierungen in deinem konkreten Fall nötig sind, solltest du aber weiterhin fachlich absichern.",
                        "Der wichtigste operative Vorteil ist, dass du das Erstellen nicht jedes Mal improvisieren musst. Genau dort entsteht im Alltag der größte Zeitgewinn.",
                    ],
                },
            ]}
            faqs={[
                {
                    question:
                        "Kann ich mit Rechly direkt Rechnungen als Kleinunternehmer erstellen?",
                    answer: "Ja. Rechly ist dafür gedacht, Rechnungsdaten, Kundeninformationen und PDF-Ausgabe in einem klaren Ablauf zusammenzuführen.",
                },
                {
                    question: "Ist das nur für einmalige Rechnungen gedacht?",
                    answer: "Nein. Der größere Vorteil liegt gerade bei wiederkehrenden Rechnungen, weil Kundendaten und Struktur wiederverwendet werden können.",
                },
                {
                    question:
                        "Prüft Rechly automatisch jede steuerliche Besonderheit?",
                    answer: "Nein. Rechly unterstützt deinen Workflow, ersetzt aber keine fachliche Prüfung für steuerliche oder rechtliche Einzelfälle.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/kleinunternehmer-rechnung",
                    title: "Kleinunternehmer Rechnung",
                    description:
                        "Wenn du zuerst die Grundlagen und Pflichtangaben der Rechnung verstehen willst.",
                },
                {
                    href: "/rechnungsvorlage",
                    title: "Rechnungsvorlage",
                    description:
                        "Wenn du von einer Vorlage in einen echten Kleinunternehmer-Workflow übergehen willst.",
                },
            ]}
        />
    );
}
