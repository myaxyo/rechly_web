"use client";

import { Typography, Card } from "antd";
import {
    FileTextOutlined,
    TeamOutlined,
    CloudOutlined,
    MobileOutlined,
    SafetyOutlined,
    CalculatorOutlined,
    DownloadOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const { Title, Text, Paragraph } = Typography;

export default function FeaturesPage() {
    const { language } = useLanguage();

    const features =
        language === "de"
            ? [
                  {
                      icon: (
                          <FileTextOutlined
                              style={{ fontSize: 28, color: "#1890ff" }}
                          />
                      ),
                      title: "Professionelle Rechnungen",
                      desc: "Erstelle rechtskonforme Rechnungen mit allen Pflichtangaben nach deutschem Recht. Mehrere Vorlagen verfügbar.",
                  },
                  {
                      icon: (
                          <DownloadOutlined
                              style={{ fontSize: 28, color: "#52c41a" }}
                          />
                      ),
                      title: "PDF-Export",
                      desc: "Exportiere Rechnungen als hochwertige PDF-Dateien. Perfekt zum Versenden per E-Mail.",
                  },
                  {
                      icon: (
                          <TeamOutlined
                              style={{ fontSize: 28, color: "#722ed1" }}
                          />
                      ),
                      title: "Kundenverwaltung",
                      desc: "Speichere Kundendaten einmalig und verwende sie bei jeder Rechnung wieder.",
                  },
                  {
                      icon: (
                          <CalculatorOutlined
                              style={{ fontSize: 28, color: "#fa8c16" }}
                          />
                      ),
                      title: "Automatische Berechnung",
                      desc: "Netto, Brutto, MwSt. – alles wird automatisch berechnet. Verschiedene Steuersätze möglich.",
                  },
                  {
                      icon: (
                          <CloudOutlined
                              style={{ fontSize: 28, color: "#13c2c2" }}
                          />
                      ),
                      title: "Cloud-Synchronisation",
                      desc: "Deine Daten werden sicher in der Cloud gespeichert. Zugriff von überall.",
                  },
                  {
                      icon: (
                          <MobileOutlined
                              style={{ fontSize: 28, color: "#eb2f96" }}
                          />
                      ),
                      title: "Mobile App",
                      desc: "Native Android-App für unterwegs. iOS-App folgt.",
                  },
                  {
                      icon: (
                          <SafetyOutlined
                              style={{ fontSize: 28, color: "#f5222d" }}
                          />
                      ),
                      title: "DSGVO-konform",
                      desc: "Server in Deutschland (Frankfurt). Deine Daten bleiben in Europa.",
                  },
                  {
                      icon: (
                          <GlobalOutlined
                              style={{ fontSize: 28, color: "#1890ff" }}
                          />
                      ),
                      title: "Mehrsprachig",
                      desc: "App und Rechnungen auf Deutsch und Englisch verfügbar.",
                  },
              ]
            : [
                  {
                      icon: (
                          <FileTextOutlined
                              style={{ fontSize: 28, color: "#1890ff" }}
                          />
                      ),
                      title: "Professional Invoices",
                      desc: "Create compliant invoices with all required fields under German law. Multiple templates available.",
                  },
                  {
                      icon: (
                          <DownloadOutlined
                              style={{ fontSize: 28, color: "#52c41a" }}
                          />
                      ),
                      title: "PDF Export",
                      desc: "Export invoices as high-quality PDF files. Perfect for sending via email.",
                  },
                  {
                      icon: (
                          <TeamOutlined
                              style={{ fontSize: 28, color: "#722ed1" }}
                          />
                      ),
                      title: "Client Management",
                      desc: "Save client data once and reuse it for every invoice.",
                  },
                  {
                      icon: (
                          <CalculatorOutlined
                              style={{ fontSize: 28, color: "#fa8c16" }}
                          />
                      ),
                      title: "Automatic Calculations",
                      desc: "Net, gross, VAT – everything calculated automatically. Multiple tax rates supported.",
                  },
                  {
                      icon: (
                          <CloudOutlined
                              style={{ fontSize: 28, color: "#13c2c2" }}
                          />
                      ),
                      title: "Cloud Sync",
                      desc: "Your data is securely stored in the cloud. Access from anywhere.",
                  },
                  {
                      icon: (
                          <MobileOutlined
                              style={{ fontSize: 28, color: "#eb2f96" }}
                          />
                      ),
                      title: "Mobile App",
                      desc: "Native Android app for on the go. iOS app coming soon.",
                  },
                  {
                      icon: (
                          <SafetyOutlined
                              style={{ fontSize: 28, color: "#f5222d" }}
                          />
                      ),
                      title: "GDPR Compliant",
                      desc: "Servers in Germany (Frankfurt). Your data stays in Europe.",
                  },
                  {
                      icon: (
                          <GlobalOutlined
                              style={{ fontSize: 28, color: "#1890ff" }}
                          />
                      ),
                      title: "Multilingual",
                      desc: "App and invoices available in German and English.",
                  },
              ];

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <Navbar />

            {/* Hero */}
            <section
                style={{
                    paddingTop: 120,
                    paddingBottom: 60,
                    paddingLeft: 24,
                    paddingRight: 24,
                    textAlign: "center",
                    maxWidth: 600,
                    margin: "0 auto",
                }}
            >
                <Title
                    style={{
                        fontSize: 40,
                        fontWeight: 700,
                        margin: "0 0 16px",
                        color: "#111",
                    }}
                >
                    {language === "de" ? "Funktionen" : "Features"}
                </Title>
                <Paragraph style={{ fontSize: 18, color: "#64748b" }}>
                    {language === "de"
                        ? "Alles was du brauchst, um professionelle Rechnungen zu erstellen."
                        : "Everything you need to create professional invoices."}
                </Paragraph>
            </section>

            {/* Features Grid */}
            <section
                style={{
                    padding: "0 24px 80px",
                    maxWidth: 900,
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 20,
                    }}
                >
                    {features.map((feature, i) => (
                        <Card
                            key={i}
                            style={{
                                borderRadius: 12,
                                border: "1px solid #f0f0f0",
                            }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ marginBottom: 16 }}>
                                {feature.icon}
                            </div>
                            <Title
                                level={5}
                                style={{ marginBottom: 8, fontWeight: 600 }}
                            >
                                {feature.title}
                            </Title>
                            <Text
                                style={{
                                    color: "#64748b",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                }}
                            >
                                {feature.desc}
                            </Text>
                        </Card>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
}
