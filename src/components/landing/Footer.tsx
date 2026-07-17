"use client";

import { Typography, Space, Divider } from "antd";
import { GithubOutlined, HeartOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRepoUrl } from "@/lib/env";

const { Text } = Typography;
const repoUrl = getRepoUrl();

export default function Footer() {
    const { t } = useLanguage();

    const linkStyle = {
        color: "#64748b",
        fontSize: 14,
        transition: "color 0.2s",
    };

    return (
        <footer
            style={{
                background: "#fafafa",
                borderTop: "1px solid #f0f0f0",
                padding: "48px 24px 32px",
            }}
        >
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 32,
                        marginBottom: 32,
                    }}
                >
                    {/* Brand */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 12,
                            }}
                        >
                            <Image
                                src="/logo.png"
                                alt="Rechly"
                                width={24}
                                height={24}
                                style={{ borderRadius: 4 }}
                            />
                            <Text strong style={{ margin: 0, fontSize: 16 }}>
                                Rechly
                            </Text>
                        </div>
                        <Text style={{ color: "#64748b", fontSize: 14 }}>
                            {t("footer.tagline")}
                        </Text>
                    </div>

                    {/* Product */}
                    <div>
                        <Text
                            strong
                            style={{
                                display: "block",
                                marginBottom: 12,
                                fontSize: 13,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#374151",
                            }}
                        >
                            {t("footer.product")}
                        </Text>
                        <Space direction="vertical" size={8}>
                            <Link href="/features" style={linkStyle}>
                                {t("nav.features")}
                            </Link>
                            <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={linkStyle}
                            >
                                GitHub
                            </a>
                        </Space>
                    </div>

                    {/* Ratgeber: sitewide links to the SEO landing pages */}
                    <div>
                        <Text
                            strong
                            style={{
                                display: "block",
                                marginBottom: 12,
                                fontSize: 13,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#374151",
                            }}
                        >
                            Ratgeber
                        </Text>
                        <Space direction="vertical" size={8}>
                            <Link href="/rechnung-schreiben" style={linkStyle}>
                                Rechnung schreiben
                            </Link>
                            <Link
                                href="/rechnungsprogramm-kostenlos"
                                style={linkStyle}
                            >
                                Rechnungsprogramm kostenlos
                            </Link>
                            <Link
                                href="/kostenlose-rechnungssoftware"
                                style={linkStyle}
                            >
                                Kostenlose Rechnungssoftware
                            </Link>
                            <Link href="/rechnungsvorlage" style={linkStyle}>
                                Rechnungsvorlage
                            </Link>
                            <Link
                                href="/kleinunternehmer-rechnung"
                                style={linkStyle}
                            >
                                Kleinunternehmer-Rechnung
                            </Link>
                            <Link
                                href="/e-rechnung-software"
                                style={linkStyle}
                            >
                                E-Rechnung-Software
                            </Link>
                        </Space>
                    </div>

                    {/* Vergleiche */}
                    <div>
                        <Text
                            strong
                            style={{
                                display: "block",
                                marginBottom: 12,
                                fontSize: 13,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#374151",
                            }}
                        >
                            Vergleiche
                        </Text>
                        <Space direction="vertical" size={8}>
                            <Link
                                href="/lexoffice-alternative"
                                style={linkStyle}
                            >
                                lexoffice Alternative
                            </Link>
                            <Link
                                href="/sevdesk-alternative"
                                style={linkStyle}
                            >
                                sevdesk Alternative
                            </Link>
                            <Link
                                href="/rechnungssoftware-fuer-freelancer"
                                style={linkStyle}
                            >
                                Software für Freelancer
                            </Link>
                            <Link
                                href="/zahlungserinnerung-schreiben"
                                style={linkStyle}
                            >
                                Zahlungserinnerung schreiben
                            </Link>
                        </Space>
                    </div>

                    {/* Legal */}
                    <div>
                        <Text
                            strong
                            style={{
                                display: "block",
                                marginBottom: 12,
                                fontSize: 13,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#374151",
                            }}
                        >
                            {t("footer.legal")}
                        </Text>
                        <Space direction="vertical" size={8}>
                            <Link href="/impressum" style={linkStyle}>
                                {t("footer.impressum")}
                            </Link>
                            <Link href="/datenschutz" style={linkStyle}>
                                {t("footer.privacy")}
                            </Link>
                            <Link href="/agb" style={linkStyle}>
                                {t("footer.terms")}
                            </Link>
                        </Space>
                    </div>
                </div>

                <Divider style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                    }}
                >
                    <Text style={{ color: "#64748b", fontSize: 13 }}>
                        <HeartOutlined style={{ marginRight: 6 }} />
                        {t("footer.madeBy")}
                    </Text>
                    <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#64748b" }}
                    >
                        <GithubOutlined style={{ fontSize: 18 }} />
                    </a>
                </div>
            </div>
        </footer>
    );
}
