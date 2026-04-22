"use client";

import { Card, Typography } from "antd";
import {
    CheckCircleOutlined,
    SendOutlined,
    BarChartOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;

export default function WorkflowSection() {
    const { t } = useLanguage();

    const steps = [
        {
            icon: (
                <CheckCircleOutlined
                    style={{ fontSize: 22, color: "#0f766e" }}
                />
            ),
            title: t("workflow.step1.title"),
            desc: t("workflow.step1.desc"),
        },
        {
            icon: <SendOutlined style={{ fontSize: 22, color: "#b45309" }} />,
            title: t("workflow.step2.title"),
            desc: t("workflow.step2.desc"),
        },
        {
            icon: (
                <BarChartOutlined style={{ fontSize: 22, color: "#7c3aed" }} />
            ),
            title: t("workflow.step3.title"),
            desc: t("workflow.step3.desc"),
        },
    ];

    const bullets = [
        t("workflow.point1"),
        t("workflow.point2"),
        t("workflow.point3"),
    ];

    return (
        <section
            style={{
                padding: "92px 24px",
                background: "#ffffff",
            }}
            aria-label="Arbeitsablauf mit Rechly"
        >
            <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
                        gap: 24,
                        alignItems: "start",
                    }}
                >
                    <div>
                        <div className="landing-eyebrow">
                            {t("workflow.badge")}
                        </div>
                        <h2
                            style={{
                                marginTop: 18,
                                marginBottom: 16,
                                fontWeight: 700,
                                color: "#111827",
                                fontSize: 34,
                                lineHeight: 1.15,
                                maxWidth: 640,
                            }}
                        >
                            {t("workflow.title")}
                        </h2>
                        <p
                            style={{
                                maxWidth: 640,
                                marginBottom: 28,
                                color: "#5f6b7a",
                                fontSize: 17,
                                lineHeight: 1.7,
                            }}
                        >
                            {t("workflow.subtitle")}
                        </p>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(210px, 1fr))",
                                gap: 18,
                            }}
                        >
                            {steps.map((step, index) => (
                                <Card
                                    key={index}
                                    style={{
                                        borderRadius: 18,
                                        border: "1px solid rgba(15, 23, 42, 0.08)",
                                        boxShadow:
                                            "0 14px 30px rgba(15, 23, 42, 0.05)",
                                    }}
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <div
                                        style={{
                                            width: 46,
                                            height: 46,
                                            borderRadius: 14,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "#fff8ed",
                                            marginBottom: 16,
                                        }}
                                    >
                                        {step.icon}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 17,
                                            fontWeight: 700,
                                            color: "#111827",
                                            marginBottom: 10,
                                        }}
                                    >
                                        {step.title}
                                    </div>
                                    <Text
                                        style={{
                                            color: "#5f6b7a",
                                            fontSize: 14,
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {step.desc}
                                    </Text>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <Card
                        className="landing-highlight-card"
                        style={{
                            borderRadius: 24,
                            overflow: "hidden",
                            background:
                                "linear-gradient(160deg, #102a43 0%, #0f172a 50%, #1e293b 100%)",
                            border: "none",
                            boxShadow: "0 30px 60px rgba(15, 23, 42, 0.16)",
                        }}
                        styles={{ body: { padding: 28 } }}
                    >
                        <div
                            style={{
                                color: "#f8fafc",
                                fontSize: 22,
                                fontWeight: 700,
                                marginBottom: 10,
                            }}
                        >
                            {t("workflow.cardTitle")}
                        </div>
                        <p
                            style={{
                                color: "rgba(226, 232, 240, 0.88)",
                                marginBottom: 22,
                                lineHeight: 1.7,
                                fontSize: 15,
                            }}
                        >
                            {t("workflow.cardDesc")}
                        </p>

                        <div style={{ display: "grid", gap: 14 }}>
                            {bullets.map((bullet, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        alignItems: "flex-start",
                                        padding: "14px 16px",
                                        borderRadius: 16,
                                        background: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <CheckCircleOutlined
                                        style={{
                                            color: "#fbbf24",
                                            marginTop: 3,
                                            fontSize: 16,
                                        }}
                                    />
                                    <span
                                        style={{
                                            color: "#e2e8f0",
                                            fontSize: 14,
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {bullet}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    );
}
