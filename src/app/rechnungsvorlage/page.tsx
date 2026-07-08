import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/rechnungsvorlage";

export const metadata: Metadata = {
    title: "Rechnungsvorlage",
    description:
        "Rechnungsvorlage für Deutschland: Welche Inhalte wichtig sind, wie du Pflichtangaben strukturierst und aus einer Vorlage einen sauberen Prozess machst.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "Rechnungsvorlage | Rechly",
        description:
            "So wird aus einer Rechnungsvorlage ein nutzbarer deutscher Rechnungsprozess mit klaren Pflichtangaben und PDF-Export.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function RechnungsvorlagePage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="RECHNUNGSVORLAGE"
            title="Rechnungsvorlage: was eine gute deutsche Vorlage wirklich leisten muss"
            intro="Viele suchen nach einer Rechnungsvorlage, weil sie schnell loslegen wollen. Das Problem ist selten die erste Vorlage, sondern der Moment danach: Kunden wechseln, Positionen ändern sich, offene Zahlungen kommen dazu und aus einer Datei wird plötzlich ein dauernder Prozess."
            summary="Rechly setzt genau dort an. Statt nur eine statische Rechnungsvorlage zu liefern, hilft dir die Software dabei, Kundendaten, Pflichtangaben, Positionen und PDFs in einen sauberen deutschen Rechnungsablauf zu überführen."
            keywordPills={[
                "Rechnungsvorlage",
                "Rechnungsvorlage Deutschland",
                "Rechnung online erstellen",
                "Pflichtangaben Rechnung",
            ]}
            sections={[
                {
                    title: "Warum eine Rechnungsvorlage oft nur der Anfang ist",
                    body: [
                        "Eine Vorlage ist hilfreich, wenn du die Struktur einer Rechnung schnell aufsetzen willst. Für den laufenden Betrieb reicht sie aber oft nicht aus, weil Kundendaten, Rechnungsnummern, Leistungsbeschreibungen und Zahlungsbedingungen immer wieder manuell angepasst werden müssen.",
                        "Je mehr wiederkehrende Abrechnung entsteht, desto wichtiger wird es, aus der Vorlage einen reproduzierbaren Prozess zu machen. Genau dadurch sinkt das Risiko von Lücken und Copy-paste-Fehlern.",
                    ],
                    bullets: [
                        "Pflichtangaben nicht bei jeder Rechnung neu zusammensuchen",
                        "Kundendaten sauber wiederverwenden",
                        "Leistungsbeschreibungen konsistent halten",
                        "PDF-Erstellung und Versand direkt anschließen",
                    ],
                },
                {
                    title: "Was eine gute Rechnungsvorlage in Deutschland abdecken sollte",
                    body: [
                        "Im deutschen Markt ist nicht nur das Layout wichtig, sondern vor allem die inhaltliche Vollständigkeit. Eine gute Rechnungsvorlage muss Platz für Absender, Empfänger, Datum, Rechnungsnummer, Leistungsbeschreibung, Zahlungsziel und steuerlich relevante Hinweise bieten.",
                        "Für kleine Unternehmen und Freelancer ist dabei entscheidend, dass diese Informationen nicht isoliert in einer Datei liegen, sondern im Alltag zuverlässig wiederverwendet werden können.",
                    ],
                },
                {
                    title: "Wie Rechly aus der Vorlage einen Ablauf macht",
                    body: [
                        "Rechly hilft dabei, die Logik einer Rechnungsvorlage in einen echten Workflow zu überführen. Kunden werden zentral gepflegt, Positionen strukturiert verwaltet und Rechnungen als PDF ausgegeben, ohne dass du jedes Mal bei Null startest.",
                        "Wenn später Zahlungen offen bleiben, endet der Prozess nicht an der Vorlage. Dann greifen Follow-up- und Erinnerungsschritte direkt auf dieselben Rechnungsdaten zurück.",
                    ],
                    bullets: [
                        "Vorlage + Kundendaten + PDF in einem System",
                        "Besser geeignet für wiederkehrende Abrechnung",
                        "Saubere Grundlage für Erinnerungen und Nachverfolgung",
                    ],
                },
            ]}
            faqs={[
                {
                    question:
                        "Reicht eine einfache Rechnungsvorlage für den Alltag aus?",
                    answer: "Für den Einstieg oft ja. Sobald du aber regelmäßig Rechnungen schreibst, hilft eine strukturierte Software deutlich mehr als eine statische Vorlage.",
                },
                {
                    question:
                        "Kann ich mit Rechly statt einer Vorlage direkt Rechnungen erzeugen?",
                    answer: "Ja. Rechly ist dafür gedacht, Rechnungsdaten, Kundeninformationen und PDF-Ausgabe in einem laufenden Workflow zu bündeln.",
                },
                {
                    question:
                        "Ist eine Rechnungsvorlage automatisch rechtssicher?",
                    answer: "Nein. Eine Vorlage kann nur die Struktur unterstützen. Ob deine konkreten Rechnungen inhaltlich vollständig und passend für deinen Fall sind, musst du fachlich prüfen.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/rechnungssoftware-fuer-freelancer",
                    title: "Rechnungssoftware für Freelancer",
                    description:
                        "Wenn du statt einer Vorlage einen wiederholbaren Rechnungsprozess suchst.",
                },
                {
                    href: "/rechnung-fuer-kleinunternehmer-erstellen",
                    title: "Rechnung für Kleinunternehmer erstellen",
                    description:
                        "Für konkrete Rechnungsabläufe mit Kleinunternehmerregelung und Pflichtangaben.",
                },
            ]}
        />
    );
}
