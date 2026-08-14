export interface HomeFaqItem {
    question: string;
    answer: string;
}

export const homeFaqsDe: HomeFaqItem[] = [
    {
        question: "Ist Rechly kostenlos und Open Source?",
        answer: "Ja. Rechly wird als Open-Source-Projekt unter der AGPL-3.0-Lizenz entwickelt und kann kostenlos genutzt oder selbst gehostet werden. Den Quellcode, offene Issues und Beiträge findest du transparent auf GitHub.",
    },
    {
        question: "Wie unterstützt Rechly den Datenschutz?",
        answer: "Rechly setzt auf transparente Open-Source-Software und ein europäisches Hosting-Setup. Welche Daten verarbeitet werden und welche Dienste zum Einsatz kommen, ist in der Datenschutzerklärung dokumentiert. Beim Selbsthosting kontrollierst du die Infrastruktur selbst.",
    },
    {
        question: "Welche Angaben kann ich auf Rechnungen erfassen?",
        answer: "Rechly unterstützt zentrale Rechnungsangaben wie Absender, Empfänger, Rechnungsnummer, Leistungsbeschreibung, Leistungsdatum, Beträge und Steuern. Ob eine Rechnung im Einzelfall alle rechtlichen Anforderungen erfüllt, sollte bei Unsicherheit fachlich geprüft werden.",
    },
    {
        question: "Für wen ist Rechly geeignet?",
        answer: "Rechly richtet sich an Freelancer, Selbstständige, Kleinunternehmer und kleine Unternehmen, die Rechnungen, Angebote, Kunden und offene Zahlungen in einem übersichtlichen Workflow organisieren möchten.",
    },
    {
        question: "Unterstützt Rechly E-Rechnungen?",
        answer: "Rechly unterstützt den Export strukturierter Rechnungsdaten als XRechnung und ZUGFeRD. Damit lassen sich viele deutsche E-Rechnungsprozesse abbilden; konkrete Empfängeranforderungen sollten vor dem Versand geprüft werden.",
    },
];

export const homeFaqsEn: HomeFaqItem[] = [
    {
        question: "Is Rechly free and open source?",
        answer: "Yes. Rechly is developed as an open-source project under the AGPL-3.0 license and can be used for free or self-hosted. The source code, issues, and community contributions are available on GitHub.",
    },
    {
        question: "How does Rechly support data protection?",
        answer: "Rechly uses transparent open-source software and European hosting infrastructure. Its privacy policy documents which data and services are involved. Self-hosting gives you control over the infrastructure.",
    },
    {
        question: "Which invoice details can I record?",
        answer: "Rechly supports essential invoice information such as sender, recipient, invoice number, service description, delivery date, amounts, and taxes. Seek professional advice if you are unsure about requirements for a specific invoice.",
    },
    {
        question: "Who is Rechly for?",
        answer: "Rechly is designed for freelancers, self-employed professionals, small-business owners, and small companies that want to organize invoices, offers, clients, and overdue payments in one workflow.",
    },
    {
        question: "Does Rechly support electronic invoices?",
        answer: "Rechly supports structured invoice exports in XRechnung and ZUGFeRD formats. This covers many German e-invoicing workflows; always verify the recipient's specific requirements before sending.",
    },
];
