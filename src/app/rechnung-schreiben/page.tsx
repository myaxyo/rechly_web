import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/rechnung-schreiben";

export const metadata: Metadata = {
    title: "Rechnung schreiben kostenlos – Anleitung & Pflichtangaben 2026",
    description:
        "Rechnung schreiben in 5 Minuten: alle Pflichtangaben nach §14 UStG, kostenlose Vorlage im Tool, PDF-Export und E-Rechnung. Schritt-für-Schritt-Anleitung für Freelancer und Kleinunternehmer.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "Rechnung schreiben kostenlos | Rechly",
        description:
            "Schritt-für-Schritt-Anleitung mit allen Pflichtangaben nach §14 UStG – und kostenlosem Tool zum direkten Loslegen.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function RechnungSchreibenPage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="RECHNUNG SCHREIBEN"
            title="Rechnung schreiben: kostenlos, korrekt und in 5 Minuten"
            intro="Eine Rechnung zu schreiben ist keine Kunst – aber eine mit Regeln. Wer die Pflichtangaben nach §14 UStG kennt und ein sauberes Werkzeug nutzt, erstellt in wenigen Minuten Rechnungen, die vor dem Finanzamt und den eigenen Kunden bestehen."
            summary="Diese Anleitung zeigt Schritt für Schritt, was in jede deutsche Rechnung gehört, welche Sonderfälle für Kleinunternehmer gelten und wie du mit Rechly kostenlos professionelle Rechnungen als PDF oder E-Rechnung erstellst."
            keywordPills={[
                "Rechnung schreiben kostenlos",
                "Rechnung erstellen",
                "Pflichtangaben §14 UStG",
                "Rechnung online schreiben",
            ]}
            howTo={{
                title: "Rechnung schreiben in 6 Schritten",
                steps: [
                    {
                        name: "Absender und Empfänger vollständig angeben",
                        text: "Vollständiger Name und Anschrift deines Unternehmens sowie des Kunden. Bei Geschäftskunden gehört die Firmierung dazu, wie sie im Handelsregister steht.",
                    },
                    {
                        name: "Steuernummer oder USt-IdNr. eintragen",
                        text: "Jede Rechnung braucht deine Steuernummer oder deine Umsatzsteuer-Identifikationsnummer. Bei EU-Geschäften ist die USt-IdNr. beider Seiten Pflicht.",
                    },
                    {
                        name: "Fortlaufende Rechnungsnummer vergeben",
                        text: "Die Rechnungsnummer muss einmalig und fortlaufend sein, z. B. RE-2026-001. Lücken sind erlaubt, Dopplungen nicht – gute Software zählt automatisch hoch.",
                    },
                    {
                        name: "Leistung, Zeitraum und Datum beschreiben",
                        text: "Was wurde geliefert oder geleistet, in welcher Menge, wann? Rechnungsdatum und Liefer-/Leistungsdatum gehören auf jede Rechnung.",
                    },
                    {
                        name: "Beträge und Umsatzsteuer ausweisen",
                        text: "Nettobetrag, Steuersatz (19 %, 7 % oder steuerfrei), Steuerbetrag und Bruttosumme. Kleinunternehmer nach §19 UStG weisen keine Umsatzsteuer aus und ergänzen den Hinweis auf die Kleinunternehmerregelung.",
                    },
                    {
                        name: "Zahlungsziel angeben und Rechnung versenden",
                        text: "Zahlungsfrist und Bankverbindung angeben, dann als PDF oder E-Rechnung (XRechnung/ZUGFeRD) verschicken. Für Geschäfte mit öffentlichen Auftraggebern ist die E-Rechnung Pflicht.",
                    },
                ],
            }}
            sections={[
                {
                    title: "Pflichtangaben: das muss auf jede Rechnung",
                    body: [
                        "§14 Abs. 4 UStG definiert klar, was eine ordnungsgemäße Rechnung enthalten muss. Fehlt eine Pflichtangabe, riskierst du den Vorsteuerabzug deines Kunden – und unangenehme Rückfragen bei der nächsten Betriebsprüfung.",
                    ],
                    bullets: [
                        "Vollständiger Name und Anschrift von Aussteller und Empfänger",
                        "Steuernummer oder Umsatzsteuer-Identifikationsnummer",
                        "Rechnungsdatum und fortlaufende, einmalige Rechnungsnummer",
                        "Menge und Art der Leistung bzw. Lieferung",
                        "Liefer- oder Leistungszeitpunkt",
                        "Entgelt nach Steuersätzen aufgeschlüsselt (netto)",
                        "Steuersatz und Steuerbetrag – oder Hinweis auf Steuerbefreiung",
                    ],
                },
                {
                    title: "Sonderfall Kleinunternehmer: Rechnung ohne Umsatzsteuer",
                    body: [
                        "Wer die Kleinunternehmerregelung nach §19 UStG nutzt, weist keine Umsatzsteuer aus. Stattdessen gehört ein Hinweis auf die Regelung auf die Rechnung, etwa: „Gemäß §19 UStG wird keine Umsatzsteuer berechnet.“",
                        "Alle übrigen Pflichtangaben gelten unverändert – auch Kleinunternehmer brauchen fortlaufende Rechnungsnummern und vollständige Angaben.",
                    ],
                },
                {
                    title: "Rechnung kostenlos schreiben: Vorlage oder Software?",
                    body: [
                        "Word- und Excel-Vorlagen sind der klassische Einstieg, haben aber drei Schwächen: Rechnungsnummern musst du selbst verwalten, Änderungen an alten Rechnungen sind nicht nachvollziehbar, und für die kommende E-Rechnungspflicht im B2B-Geschäft fehlt das Format komplett.",
                        "Eine kostenlose Rechnungssoftware wie Rechly nimmt dir genau das ab: fortlaufende Nummern, saubere PDFs, XRechnung und ZUGFeRD auf Knopfdruck – und deine Kunden- und Rechnungsdaten bleiben an einem Ort.",
                    ],
                    bullets: [
                        "Automatisch fortlaufende Rechnungsnummern",
                        "Alle Pflichtangaben im Layout verankert",
                        "PDF, XRechnung und ZUGFeRD aus denselben Daten",
                        "Offene Posten und Zahlungserinnerungen im Blick",
                    ],
                },
            ]}
            faqs={[
                {
                    question: "Kann ich eine Rechnung wirklich kostenlos schreiben?",
                    answer: "Ja. Mit Rechly erstellst du Rechnungen kostenlos und ohne Limit – als Open-Source-Projekt gibt es keine künstliche Obergrenze oder Zwangs-Upgrades.",
                },
                {
                    question: "Was passiert, wenn eine Pflichtangabe fehlt?",
                    answer: "Der Kunde kann den Vorsteuerabzug verlieren und die Rechnung zurückweisen. Du musst dann eine korrigierte Rechnung ausstellen. Software mit fest verankerten Pflichtfeldern verhindert das von vornherein.",
                },
                {
                    question: "Darf ich Rechnungen nachträglich ändern?",
                    answer: "Eine bereits zugestellte Rechnung änderst du nicht einfach, sondern korrigierst sie mit einer Rechnungskorrektur oder Gutschrift, die auf die ursprüngliche Rechnungsnummer verweist.",
                },
                {
                    question: "Brauche ich 2026 eine E-Rechnung?",
                    answer: "Im B2B-Geschäft gilt die E-Rechnungspflicht stufenweise: Empfangen können müssen alle Unternehmen bereits, das Ausstellen wird verpflichtend. Mit XRechnung- und ZUGFeRD-Export bist du auf der sicheren Seite.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/rechnungsvorlage",
                    title: "Rechnungsvorlage",
                    description:
                        "Wenn du zuerst eine Vorlage sehen willst, bevor du auf ein Tool umsteigst.",
                },
                {
                    href: "/kleinunternehmer-rechnung",
                    title: "Kleinunternehmer-Rechnung",
                    description:
                        "Alle Details zur Rechnung ohne Umsatzsteuer nach §19 UStG.",
                },
                {
                    href: "/e-rechnung-software",
                    title: "E-Rechnung-Software",
                    description:
                        "XRechnung und ZUGFeRD: was die E-Rechnungspflicht für dich bedeutet.",
                },
            ]}
        />
    );
}
