"use client";

import { Typography, Card } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const { Title, Paragraph, Text } = Typography;

const content = {
    de: {
        title: "Datenschutzerklärung",
        section1Title: "1. Datenschutz auf einen Blick",
        section1Text:
            "Diese Datenschutzerklärung klärt über die Art, den Umfang und Zweck der Verarbeitung personenbezogener Daten innerhalb dieses Projekts auf.",
        section2Title: "2. Verantwortlicher",
        section2Text:
            "Verantwortlich für die Datenverarbeitung ist der Betreiber dieses Open-Source-Projekts (siehe Impressum).",
        section3Title: "3. Erhobene Daten",
        section3Text:
            "Bei der Nutzung von Rechly werden folgende Daten verarbeitet:",
        section3Items: [
            "E-Mail-Adresse (für Account-Erstellung)",
            "Rechnungsdaten (die du selbst eingibst)",
            "Kundendaten (die du selbst eingibst)",
        ],
        section4Title: "4. Hosting",
        section4Text:
            "Die Anwendung und Datenbank werden bei Appwrite in deutschen Rechenzentren (Frankfurt) gehostet. Alle Daten bleiben in der EU.",
        section5Title: "5. Cookies",
        section5Text:
            "Wir verwenden nur technisch notwendige Cookies für die Authentifizierung. Es werden keine Tracking- oder Analyse-Cookies verwendet.",
        section6Title: "6. Deine Rechte",
        section6Text:
            "Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit deiner Daten. Kontaktiere uns über die im Impressum genannte E-Mail-Adresse.",
        section7Title: "7. Datenlöschung",
        section7Text:
            "Du kannst deinen Account und alle zugehörigen Daten jederzeit löschen. Nach der Löschung werden alle Daten innerhalb von 30 Tagen vollständig entfernt.",
        lastUpdated: "Stand: Dezember 2025",
    },
    en: {
        title: "Privacy Policy",
        section1Title: "1. Privacy at a Glance",
        section1Text:
            "This privacy policy explains the nature, scope, and purpose of personal data processing within this project.",
        section2Title: "2. Data Controller",
        section2Text:
            "The operator of this open-source project is responsible for data processing (see Imprint).",
        section3Title: "3. Collected Data",
        section3Text: "When using Rechly, the following data is processed:",
        section3Items: [
            "Email address (for account creation)",
            "Invoice data (that you enter yourself)",
            "Customer data (that you enter yourself)",
        ],
        section4Title: "4. Hosting",
        section4Text:
            "The application and database are hosted by Appwrite in German data centers (Frankfurt). All data remains in the EU.",
        section5Title: "5. Cookies",
        section5Text:
            "We only use technically necessary cookies for authentication. No tracking or analytics cookies are used.",
        section6Title: "6. Your Rights",
        section6Text:
            "You have the right to access, rectification, deletion, and data portability of your data. Contact us via the email address listed in the Imprint.",
        section7Title: "7. Data Deletion",
        section7Text:
            "You can delete your account and all associated data at any time. After deletion, all data will be completely removed within 30 days.",
        lastUpdated: "Last updated: December 2025",
    },
};

export default function DatenschutzPage() {
    const { language } = useLanguage();
    const t = content[language];

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <Navbar showAuth={false} />

            <section
                style={{
                    paddingTop: 100,
                    paddingBottom: 60,
                    paddingLeft: 24,
                    paddingRight: 24,
                    maxWidth: 700,
                    margin: "0 auto",
                }}
            >
                <Card style={{ borderRadius: 12, border: "1px solid #f0f0f0" }}>
                    <Title level={1} style={{ marginBottom: 24 }}>
                        {t.title}
                    </Title>

                    <Title level={4}>{t.section1Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section1Text}
                    </Paragraph>

                    <Title level={4}>{t.section2Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section2Text}
                    </Paragraph>

                    <Title level={4}>{t.section3Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section3Text}
                    </Paragraph>
                    <ul style={{ fontSize: 15, paddingLeft: 20 }}>
                        {t.section3Items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>

                    <Title level={4}>{t.section4Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section4Text}
                    </Paragraph>

                    <Title level={4}>{t.section5Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section5Text}
                    </Paragraph>

                    <Title level={4}>{t.section6Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section6Text}
                    </Paragraph>

                    <Title level={4}>{t.section7Title}</Title>
                    <Paragraph style={{ fontSize: 15 }}>
                        {t.section7Text}
                    </Paragraph>

                    <Text
                        type="secondary"
                        style={{
                            fontSize: 13,
                            marginTop: 24,
                            display: "block",
                        }}
                    >
                        {t.lastUpdated}
                    </Text>
                </Card>
            </section>

            <Footer />
        </div>
    );
}
