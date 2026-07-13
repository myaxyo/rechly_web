import type { Metadata } from "next";
import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();
const path = "/lexoffice-alternative";

export const metadata: Metadata = {
    title: "lexoffice Alternative – Open Source Rechnungssoftware",
    description:
        "Beste lexoffice Alternative 2026: Rechly bietet kostenlose Rechnungserstellung, Kundenverwaltung und XRechnung-Export. Open Source, ohne Abo, volle Kontrolle über deine Daten.",
    alternates: {
        canonical: path,
    },
    openGraph: {
        title: "lexoffice Alternative | Rechly",
        description:
            "Open-Source Rechnungssoftware als lexoffice Alternative: Rechnungen erstellen, Kunden verwalten, KI-Unterstützung mit eigenem API-Key. Kostenlos.",
        url: `${siteUrl}${path}`,
        type: "article",
    },
};

export default function LexofficeAlternativePage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="LEXOFFICE ALTERNATIVE"
            title="lexoffice Alternative: wenn du eine offenere Rechnungssoftware suchst"
            intro="Wer nach einer lexoffice Alternative sucht, will meistens nicht einfach irgendein anderes Tool. Die eigentliche Frage lautet oft: Welche Rechnungssoftware passt besser zu meinem Setup, meinem Budget und meinem Wunsch nach Kontrolle über Daten, Funktionen und Workflow?"
            summary="Rechly ist in diesem Vergleich interessant, wenn du keine große All-in-one-Oberfläche suchst, sondern eine fokussierte Rechnungssoftware mit Open-Source-Ansatz, klaren Workflows und KI-Funktionen, die du mit eigenem Anbieter und eigenem Schlüssel steuern kannst."
            keywordPills={[
                "lexoffice Alternative",
                "Alternative zu lexoffice",
                "Open Source Rechnungssoftware",
                "Rechnungssoftware Vergleich",
            ]}
            sections={[
                {
                    title: "Warum Nutzer nach einer lexoffice Alternative suchen",
                    body: [
                        "Vergleichssuchen entstehen selten aus Neugier allein. Häufig geht es darum, dass ein bestehendes Tool zu umfangreich wirkt, preislich nicht mehr passt oder zu wenig Kontrolle über den Ablauf und die Integrationen lässt.",
                        "Gerade kleine Teams, Freelancer und Nebenprojekte brauchen oft keine große Suite, sondern einen ruhigen Rechnungsprozess mit Kundendaten, PDFs, Erinnerungen und sauberer Nachverfolgung offener Zahlungen.",
                    ],
                    bullets: [
                        "Weniger Overhead in der Oberfläche",
                        "Klarere Fokussierung auf Rechnungen und Follow-ups",
                        "Offenerer Umgang mit Hosting und Quellcode",
                        "Mehr Kontrolle über KI-Provider und API-Schlüssel",
                    ],
                },
                {
                    title: "Wann Rechly als Alternative sinnvoll ist",
                    body: [
                        "Rechly ist dann interessant, wenn du einen schmaleren Stack bevorzugst und Rechnungsprozesse nicht in einer Black-Box-Umgebung abbilden willst. Der Fokus liegt auf deutscher Rechnungserstellung, Kundenverwaltung, PDF-Export und operativen Schritten bei offenen Rechnungen.",
                        "Dazu kommt der Open-Source-Ansatz. Das ist vor allem für Nutzer relevant, die nachvollziehen möchten, wie das System arbeitet, es selbst hosten wollen oder KI-Funktionen mit eigener Anbieterwahl koppeln möchten.",
                    ],
                    bullets: [
                        "Open Source statt rein geschlossener SaaS-Logik",
                        "KI-Funktionen mit eigenem Provider-Setup",
                        "Geeignet für Freelancer, Solos und kleine Teams",
                        "Fokus auf Rechnungsworkflow statt Funktionsballast",
                    ],
                },
                {
                    title: "Worauf du bei einem Wechsel achten solltest",
                    body: [
                        "Ein guter Wechsel hängt weniger vom Markennamen ab als von deinem tatsächlichen Ablauf. Prüfe, wie oft du Rechnungen schreibst, wie wichtig dir offene Deployment-Optionen sind und ob du primär eine klare Rechnungssoftware oder eine breitere Business-Suite brauchst.",
                        "Wenn dein Schwerpunkt auf einfacher Rechnungserstellung, Erinnerungen und operativer Ruhe liegt, ist eine fokussierte Alternative oft sinnvoller als ein möglichst großes System.",
                    ],
                },
            ]}
            faqs={[
                {
                    question:
                        "Ist Rechly ein direkter 1:1-Ersatz für jede lexoffice-Nutzung?",
                    answer: "Nein. Ob Rechly passt, hängt davon ab, welche Teile deines aktuellen Setups dir wichtig sind. Rechly ist besonders dann interessant, wenn du einen fokussierten Rechnungsworkflow und einen offenen Produktansatz suchst.",
                },
                {
                    question:
                        "Warum ist Open Source bei einer Alternative relevant?",
                    answer: "Weil Open Source mehr Transparenz und Kontrolle ermöglicht. Gerade bei Daten, Hosting und KI-Anbindungen kann das ein echter Unterschied sein.",
                },
                {
                    question:
                        "Für wen ist diese lexoffice Alternative gedacht?",
                    answer: "Vor allem für Freelancer, Selbstständige, Nebenprojekte und kleine Teams, die Rechnungen sauber organisieren wollen, ohne ein überladenes System zu pflegen.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/sevdesk-alternative",
                    title: "sevdesk Alternative",
                    description:
                        "Für eine zweite Vergleichssuche mit ähnlicher Kaufintention rund um Rechnungssoftware.",
                },
                {
                    href: "/rechnungsprogramm-kostenlos",
                    title: "Rechnungsprogramm kostenlos",
                    description:
                        "Wenn du statt Vergleichsmarketing ein wirklich kostenloses Rechnungsprogramm bewerten willst.",
                },
            ]}
        />
    );
}
