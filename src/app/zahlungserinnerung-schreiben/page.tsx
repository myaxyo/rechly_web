import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/zahlungserinnerung-schreiben";

export const metadata: Metadata = {
    title: "Zahlungserinnerung schreiben",
    description:
        "Zahlungserinnerung schreiben: Wie du offene Rechnungen freundlich, klar und professionell nachverfolgst und dafür einen sauberen Workflow aufbaust.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "Zahlungserinnerung schreiben | Rechly",
        description:
            "So schreibst du eine Zahlungserinnerung mit klarem Ton, Rechnungsbezug und einem nachvollziehbaren Prozess für offene Forderungen.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function ZahlungserinnerungSchreibenPage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="ZAHLUNGSERINNERUNG SCHREIBEN"
            title="Zahlungserinnerung schreiben: freundlich im Ton, klar in der Sache"
            intro="Wenn Rechnungen offen bleiben, suchen viele nicht nach Theorie, sondern nach einer Formulierung, die professionell klingt und trotzdem Druck aus der Situation nimmt. Genau deshalb ist das Thema Zahlungserinnerung schreiben hochgradig transaktional."
            summary="Rechly hilft dir dabei, offene Rechnungen nicht isoliert als E-Mail-Text zu behandeln, sondern als Teil eines geordneten Rechnungsprozesses. So werden Erinnerungstexte, Rechnungsdaten und Kundenkontext miteinander verbunden."
            keywordPills={[
                "Zahlungserinnerung schreiben",
                "Zahlungserinnerung Vorlage",
                "offene Rechnung erinnern",
                "Mahnung freundlich formulieren",
            ]}
            sections={[
                {
                    title: "Warum gute Zahlungserinnerungen mehr brauchen als einen Standardsatz",
                    body: [
                        "Eine brauchbare Zahlungserinnerung verbindet Ton, Timing und klare Referenz auf die betroffene Rechnung. Wenn du ohne Kontext formulierst, wirkt die Nachricht schnell zu hart, zu unklar oder unprofessionell.",
                        "Deshalb ist es hilfreich, wenn du direkt im Rechnungsworkflow siehst, welche Rechnung offen ist, seit wann sie offen bleibt und welche Kundensituation dahintersteht.",
                    ],
                    bullets: [
                        "Freundlicher Einstieg statt sofortiger Eskalation",
                        "Klare Bezugnahme auf Rechnung und Fälligkeit",
                        "Nachvollziehbarer nächster Schritt für den Empfänger",
                        "Wiederverwendbarer Prozess für mehrere offene Rechnungen",
                    ],
                },
                {
                    title: "Wie Rechly bei Zahlungserinnerungen hilft",
                    body: [
                        "Rechly behandelt Zahlungserinnerungen nicht als losgelösten Textbaustein. Die Erinnerung entsteht aus dem Rechnungs- und Kundenkontext, wodurch Formulierungen besser passen und weniger manuelle Nacharbeit brauchen.",
                        "Gerade für Freelancer und kleine Teams spart das Zeit, wenn mehrere Rechnungen parallel überwacht werden müssen und du nicht für jede Nachricht wieder dieselben Informationen zusammensuchen willst.",
                    ],
                    bullets: [
                        "Erinnerungsentwürfe direkt aus offenen Rechnungen starten",
                        "Kundenkontext und Rechnungsdaten zusammenführen",
                        "KI-Schreibhilfe für höfliche und klare Texte nutzen",
                        "Weniger Copy-paste zwischen Rechnungsliste und E-Mail",
                    ],
                },
                {
                    title: "Worauf du beim Schreiben von Zahlungserinnerungen achten solltest",
                    body: [
                        "Je früher im Prozess du sauber arbeitest, desto leichter werden spätere Erinnerungen. Klare Rechnungsnummern, nachvollziehbare Leistungsbeschreibungen und gepflegte Kontaktdaten machen Follow-ups einfacher und glaubwürdiger.",
                        "Rechly ersetzt keine rechtliche Beratung für Mahnprozesse, schafft aber eine deutlich bessere operative Grundlage für offene Forderungen und deren Kommunikation.",
                    ],
                },
            ]}
            faqs={[
                {
                    question:
                        "Soll eine Zahlungserinnerung schon wie eine Mahnung klingen?",
                    answer: "Nicht zwingend. In vielen Fällen ist ein ruhiger, sachlicher und freundlicher Ton wirksamer, solange die Rechnung klar benannt und die offene Zahlung nachvollziehbar angesprochen wird.",
                },
                {
                    question:
                        "Kann Rechly Erinnerungstexte direkt aus Rechnungen ableiten?",
                    answer: "Ja. Genau dafür sind die Erinnerungsschritte im Rechnungs- und Kundenkontext gedacht, inklusive KI-gestützter Entwürfe.",
                },
                {
                    question: "Ersetzt das eine rechtliche Mahnstrategie?",
                    answer: "Nein. Rechly unterstützt die operative Kommunikation rund um offene Rechnungen. Für rechtliche Eskalation oder individuelle Fälle brauchst du separate fachliche Einschätzung.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/rechnungsvorlage",
                    title: "Rechnungsvorlage",
                    description:
                        "Wenn du zuerst die Ausgangsrechnung sauber strukturieren willst.",
                },
                {
                    href: "/rechnungssoftware-fuer-freelancer",
                    title: "Rechnungssoftware für Freelancer",
                    description:
                        "Wenn du einen kompletten Rechnungs- und Follow-up-Prozess statt einzelner Textbausteine suchst.",
                },
            ]}
        />
    );
}
