"use client";

import { Card, Typography } from "antd";
import {
    FileTextOutlined,
    TeamOutlined,
    CloudOutlined,
    MobileOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;

export default function FeaturesSection() {
    const { t } = useLanguage();

    const features = [
        {
            icon: (
                <FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            ),
            title: t("features.invoices.title"),
            desc: t("features.invoices.desc"),
        },
        {
            icon: <TeamOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
            title: t("features.clients.title"),
            desc: t("features.clients.desc"),
        },
        {
            icon: <CloudOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
            title: t("features.sync.title"),
            desc: t("features.sync.desc"),
        },
        {
            icon: <MobileOutlined style={{ fontSize: 24, color: "#eb2f96" }} />,
            title: t("features.mobile.title"),
            desc: t("features.mobile.desc"),
        },
    ];

    return (
        <section
            style={{
                padding: "60px 24px 80px",
                background: "#fafafa",
            }}
            aria-label="Funktionen der Rechnungssoftware"
        >
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <h2
                    style={{
                        textAlign: "center",
                        marginBottom: 48,
                        fontWeight: 600,
                        color: "#111",
                        fontSize: 28,
                    }}
                >
                    {t("features.title")}
                </h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
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
                            <h3
                                style={{
                                    marginBottom: 8,
                                    fontWeight: 600,
                                    fontSize: 16,
                                }}
                            >
                                {feature.title}
                            </h3>
                            <Text style={{ color: "#64748b", fontSize: 14 }}>
                                {feature.desc}
                            </Text>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
