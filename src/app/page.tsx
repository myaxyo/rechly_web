"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Typography, Space, Card } from "antd";
import {
    FileTextOutlined,
    TeamOutlined,
    CloudOutlined,
    MobileOutlined,
    GithubOutlined,
    CheckOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const { Title, Text, Paragraph } = Typography;

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push("/dashboard");
            } else {
                setShowContent(true);
            }
        }
    }, [user, loading, router]);

    if (loading || (!showContent && !user)) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    background: "#fff",
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "3px solid #f0f0f0",
                        borderTopColor: "#1890ff",
                        animation: "spin 0.8s linear infinite",
                    }}
                />
                <style jsx>{`
                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

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

    const aboutPoints = [
        t("about.point1"),
        t("about.point2"),
        t("about.point3"),
        t("about.point4"),
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <Navbar />

            {/* Hero Section */}
            <section
                style={{
                    paddingTop: 140,
                    paddingBottom: 80,
                    paddingLeft: 24,
                    paddingRight: 24,
                    textAlign: "center",
                    maxWidth: 700,
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        padding: "6px 14px",
                        background: "#f0f9ff",
                        borderRadius: 20,
                        marginBottom: 24,
                    }}
                >
                    <Text
                        style={{
                            color: "#0369a1",
                            fontSize: 13,
                            fontWeight: 500,
                        }}
                    >
                        {t("hero.badge")}
                    </Text>
                </div>

                <Title
                    style={{
                        fontSize: 48,
                        fontWeight: 700,
                        margin: "0 0 16px",
                        lineHeight: 1.2,
                        color: "#111",
                    }}
                >
                    {t("hero.title")}
                    <br />
                    <span style={{ color: "#1890ff" }}>
                        {t("hero.titleHighlight")}
                    </span>
                </Title>

                <Paragraph
                    style={{
                        fontSize: 18,
                        color: "#64748b",
                        marginBottom: 32,
                        lineHeight: 1.7,
                    }}
                >
                    {t("hero.subtitle")}
                </Paragraph>

                <Space size="middle" wrap style={{ justifyContent: "center" }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => router.push("/register")}
                        style={{
                            height: 48,
                            paddingInline: 28,
                            fontSize: 15,
                            borderRadius: 8,
                            fontWeight: 500,
                        }}
                    >
                        {t("hero.cta")}
                        <ArrowRightOutlined />
                    </Button>
                    <Button
                        size="large"
                        icon={<GithubOutlined />}
                        href="https://github.com/myaxyo/rechly"
                        target="_blank"
                        style={{
                            height: 48,
                            paddingInline: 24,
                            fontSize: 15,
                            borderRadius: 8,
                        }}
                    >
                        {t("hero.secondary")}
                    </Button>
                </Space>
            </section>

            {/* Features Section */}
            <section
                style={{
                    padding: "60px 24px 80px",
                    background: "#fafafa",
                }}
            >
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <Title
                        level={2}
                        style={{
                            textAlign: "center",
                            marginBottom: 48,
                            fontWeight: 600,
                            color: "#111",
                        }}
                    >
                        {t("features.title")}
                    </Title>

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
                                <Title
                                    level={5}
                                    style={{ marginBottom: 8, fontWeight: 600 }}
                                >
                                    {feature.title}
                                </Title>
                                <Text
                                    style={{ color: "#64748b", fontSize: 14 }}
                                >
                                    {feature.desc}
                                </Text>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section
                style={{
                    padding: "80px 24px",
                    maxWidth: 700,
                    margin: "0 auto",
                }}
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

                <Title
                    level={2}
                    style={{ marginBottom: 16, fontWeight: 600, color: "#111" }}
                >
                    {t("about.title")}
                </Title>

                <Paragraph
                    style={{
                        fontSize: 16,
                        color: "#64748b",
                        marginBottom: 32,
                        lineHeight: 1.8,
                    }}
                >
                    {t("about.description")}
                </Paragraph>

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

            {/* CTA Section */}
            <section
                style={{
                    padding: "64px 24px",
                    background: "#f8fafc",
                    textAlign: "center",
                }}
            >
                <div style={{ maxWidth: 500, margin: "0 auto" }}>
                    <Title
                        level={3}
                        style={{
                            marginBottom: 12,
                            fontWeight: 600,
                            color: "#111",
                        }}
                    >
                        {t("cta.title")}
                    </Title>
                    <Paragraph
                        style={{
                            color: "#64748b",
                            marginBottom: 24,
                            fontSize: 16,
                        }}
                    >
                        {t("cta.subtitle")}
                    </Paragraph>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => router.push("/register")}
                        style={{
                            height: 48,
                            paddingInline: 32,
                            fontSize: 15,
                            borderRadius: 8,
                            fontWeight: 500,
                        }}
                    >
                        {t("cta.button")}
                    </Button>
                    <div style={{ marginTop: 16 }}>
                        <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                            {t("cta.note")}
                        </Text>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
