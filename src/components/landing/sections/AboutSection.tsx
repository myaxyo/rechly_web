"use client";

import { Space, Typography } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;

export default function AboutSection() {
    const { t } = useLanguage();

    const aboutPoints = [
        t("about.point1"),
        t("about.point2"),
        t("about.point3"),
        t("about.point4"),
    ];

    return (
        <section
            style={{
                padding: "80px 24px",
                maxWidth: 700,
                margin: "0 auto",
            }}
            aria-label="Über das Open-Source Rechnungsprogramm"
        >
            <div
                style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "#f0fdf4",
                    borderRadius: 4,
                    marginBottom: 16,
                }}
            >
                <Text
                    style={{
                        color: "#166534",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                    }}
                >
                    {t("about.badge")}
                </Text>
            </div>

            <h2
                style={{
                    marginBottom: 16,
                    fontWeight: 600,
                    color: "#111",
                    fontSize: 28,
                }}
            >
                {t("about.title")}
            </h2>

            <p
                style={{
                    fontSize: 16,
                    color: "#64748b",
                    marginBottom: 32,
                    lineHeight: 1.8,
                }}
            >
                {t("about.description")}
            </p>

            <Space direction="vertical" size={12}>
                {aboutPoints.map((point, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <CheckOutlined
                            style={{ color: "#22c55e", fontSize: 16 }}
                        />
                        <Text style={{ color: "#374151", fontSize: 15 }}>
                            {point}
                        </Text>
                    </div>
                ))}
            </Space>
        </section>
    );
}
