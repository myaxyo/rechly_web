import KeywordLandingPage from "@/components/landing/KeywordLandingPage";
import { createPageMetadata } from "@/lib/seo";

const path = "/e-rechnung-software";

export const metadata = createPageMetadata({
    title: "E-Rechnung Software kostenlos – XRechnung & ZUGFeRD erstellen",
    description:
        "Kostenlose E-Rechnung Software für Deutschland: XRechnung 3.0 & ZUGFeRD 2.3 (EN 16931) rechtskonform erstellen, prüfen und versenden. 100% kostenlos & ohne Abo!",
    path,
    type: "article",
    keywords: [
        "E-Rechnung Software",
        "XRechnung Software",
        "Software E-Rechnungen",
        "E-Rechnung kostenlos",
        "ZUGFeRD erstellen",
        "XRechnung Generator",
        "E-Rechnungspflicht Deutschland",
    ],
});

export default function ERechnungSoftwarePage() {
    return (
        <KeywordLandingPage
            path={path}
            eyebrow="E-RECHNUNG SOFTWARE"
            title="E-Rechnung Software kostenlos: XRechnung & ZUGFeRD nach EN 16931"
            intro="Seit 2025 gilt in Deutschland die E-Rechnungspflicht im B2B-Geschäftsverkehr. Mit Rechly erstellst, prüfst und exportierst du rechtskonforme elektronische Rechnungen im XML-Format (XRechnung 3.0) und als hybrides PDF (ZUGFeRD 2.3) – dauerhaft kostenlos und ohne Abo."
            summary="Rechly deckt den kompletten E-Rechnungs-Lebenszyklus ab: Valide XML-Generierung nach EN 16931, Leitweg-ID-Prüfung für öffentliche Auftraggeber (B2G), Rechnungsprüfung mit integriertem Viewer und unkomplizierter PDF-Export."
            keywordPills={[
                "E-Rechnung Software kostenlos",
                "XRechnung 3.0",
                "ZUGFeRD 2.3",
                "EN 16931 konform",
                "Leitweg-ID Prüfung",
            ]}
            sections={[
                {
                    title: "E-Rechnungspflicht 2025 bis 2028: Was gilt für dein Unternehmen?",
                    body: [
                        "Mit dem Wachstumschancengesetz müssen alle inländischen Unternehmen seit dem 1. Januar 2025 E-Rechnungen im strukturierten elektronischen Format empfangen können. Das bloße Versenden einer einfachen PDF-Datei per E-Mail reicht im reinen B2B-Geschäft nicht mehr aus.",
                        "Rechly unterstützt beide führenden Standards in Deutschland: XRechnung (reine XML-Datei nach UBL/CII) und ZUGFeRD (druckbares PDF/A-3 mit eingebetteter XML-Datei). Damit bist du sowohl für private Geschäftskunden als auch für Behörden (B2G) optimal aufgestellt.",
                    ],
                    bullets: [
                        "EN 16931 konforme XML-Syntax (UN/CEFACT CII und UBL)",
                        "Unterstützung aller Pflichtfelder inklusive Käuferreferenz (Leitweg-ID)",
                        "ZUGFeRD Profile (Comfort, Extended) mit maschinenlesbarem Datensatz",
                        "Keine Abhängigkeit von kostenpflichtigen Cloud-Portalen",
                    ],
                },
                {
                    title: "Wie Rechly E-Rechnungen einfach macht",
                    body: [
                        "Viele Softwareanbieter verlangen für das E-Rechnungsmodul teure Zusatzabos. Bei Rechly ist die E-Rechnung vollwertiger Kernbestandteil der kostenlosen Software – sowohl in der Web-App als auch in der 100% offline nutzbaren Desktop-App.",
                        "Du erfasst deine Rechnung ganz normal in der gewohnten Eingabemaske. Mit einem einzigen Klick erzeugt Rechly neben dem gewohnten PDF-Dokument die standardkonforme XRechnung-XML oder bettet die Daten direkt als ZUGFeRD ein.",
                    ],
                    bullets: [
                        "1-Klick-Export für XRechnung 3.0 und ZUGFeRD 2.3",
                        "Integrierter Leitweg-ID-Validator verhindert Abweisung durch Behördenportale",
                        "Kostenloser integrierter E-Rechnung Viewer zur Sichtprüfung",
                        "DATEV-Export für die nahtlose Übergabe an das Steuerbüro",
                    ],
                },
                {
                    title: "Sicherheit & Datenschutz: Deine Rechnungsdaten gehören dir",
                    body: [
                        "Gerade bei E-Rechnungen fallen sensible Geschäftsdaten an: Umsätze, Kundenadressen, Zahlungskonditionen und Bankdaten. Rechly ist Open Source und speichert Daten wahlweise auf zertifizierten deutschen Servern (Frankfurt am Main) oder mit Rechly Desktop komplett lokal auf deinem Rechner.",
                    ],
                },
            ]}
            faqs={[
                {
                    question: "Ist die E-Rechnung Funktion in Rechly wirklich dauerhaft kostenlos?",
                    answer: "Ja. Als Open-Source-Software gibt es bei Rechly keine Rechnungsbegrenzung, keine Paywall und keine versteckten Gebühren für den XML-Export.",
                },
                {
                    question: "Was ist der Unterschied zwischen XRechnung und ZUGFeRD?",
                    answer: "XRechnung ist eine reine, maschinenlesbare XML-Datei ohne visuelle Darstellung, die vor allem von Bundes- und Landesbehörden verlangt wird. ZUGFeRD ist ein hybrides Format: Eine für Menschen lesbare PDF-Datei, in die dieselben XML-Rechnungsdaten unsichtbar eingebettet sind.",
                },
                {
                    question: "Was bedeutet die Leitweg-ID bei E-Rechnungen?",
                    answer: "Die Leitweg-ID ist eine Adressierungsnummer für Rechnungen an die öffentliche Verwaltung in Deutschland (B2G). Sie stellt sicher, dass die Rechnung im Behördennetzwerk automatisch der richtigen Dienststelle zugeordnet wird.",
                },
            ]}
            clusterLinks={[
                {
                    href: "/tools/e-rechnung-viewer",
                    title: "Kostenloser E-Rechnung Viewer",
                    description:
                        "Öffne, prüfe und visualisiere XRechnung XML und ZUGFeRD PDFs direkt im Browser.",
                },
                {
                    href: "/tools/leitweg-id-pruefen",
                    title: "Leitweg-ID Prüfer",
                    description:
                        "Prüfe das Format und die Prüfziffer deiner Leitweg-ID vor dem Rechnungsversand.",
                },
                {
                    href: "/lexikon/e-rechnung-pflicht",
                    title: "E-Rechnungspflicht 2025–2028",
                    description:
                        "Fristen, Übergangsregelungen und Ausnahmen für deutsche Unternehmen im Detail.",
                },
            ]}
        />
    );
}
