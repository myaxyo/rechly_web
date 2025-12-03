"use client";

import { Typography, Card, Switch, Button, Space } from "antd";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const { Title, Paragraph, Text } = Typography;

const content = {
    de: {
        title: "Cookie-Einstellungen",
        intro: "Wir verwenden nur technisch notwendige Cookies. Tracking- oder Werbe-Cookies gibt es bei uns nicht.",
        essentialTitle: "Notwendige Cookies",
        essentialDesc: "Für Login und Grundfunktionen erforderlich.",
        analyticsTitle: "Analyse-Cookies",
        analyticsDesc: "Aktuell nicht im Einsatz.",
        saveButton: "Einstellungen speichern",
        savedAlert: "Einstellungen gespeichert.",
        lastUpdated: "Stand: Dezember 2025",
    },
    en: {
        title: "Cookie Settings",
        intro: "We only use technically necessary cookies. There are no tracking or advertising cookies.",
        essentialTitle: "Essential Cookies",
        essentialDesc: "Required for login and basic functionality.",
        analyticsTitle: "Analytics Cookies",
        analyticsDesc: "Currently not in use.",
        saveButton: "Save Settings",
        savedAlert: "Settings saved.",
        lastUpdated: "Last updated: December 2025",
    },
};

export default function CookiesPage() {
    const { language } = useLanguage();
    const t = content[language];
    const [analyticsCookies, setAnalyticsCookies] = useState(false);

    const handleSave = () => {
        localStorage.setItem(
            "cookiePreferences",
            JSON.stringify({
                essential: true,
                analytics: analyticsCookies,
                timestamp: new Date().toISOString(),
            })
        );
        alert(t.savedAlert);
    };

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

                    <Paragraph style={{ fontSize: 15 }}>{t.intro}</Paragraph>

                    <Card
                        style={{
                            marginTop: 24,
                            marginBottom: 16,
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <Title level={5} style={{ marginBottom: 4 }}>
                                    {t.essentialTitle}
                                </Title>
                                <Text
                                    style={{ color: "#64748b", fontSize: 14 }}
                                >
                                    {t.essentialDesc}
                                </Text>
                            </div>
                            <Switch checked disabled />
                        </div>
                    </Card>

                    <Card
                        style={{
                            marginBottom: 24,
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <Title level={5} style={{ marginBottom: 4 }}>
                                    {t.analyticsTitle}
                                </Title>
                                <Text
                                    style={{ color: "#64748b", fontSize: 14 }}
                                >
                                    {t.analyticsDesc}
                                </Text>
                            </div>
                            <Switch
                                checked={analyticsCookies}
                                onChange={setAnalyticsCookies}
                            />
                        </div>
                    </Card>

                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleSave}
                            block
                            style={{ borderRadius: 8 }}
                        >
                            {t.saveButton}
                        </Button>
                    </Space>

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
