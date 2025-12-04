"use client";

import { useState, useEffect } from "react";
import { Button, Space, Typography, Select, Drawer } from "antd";
import { GithubOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const { Title } = Typography;

interface NavbarProps {
    showAuth?: boolean;
}

export default function Navbar({ showAuth = true }: NavbarProps) {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleNavigation = (path: string) => {
        setMobileMenuOpen(false);
        router.push(path);
    };

    return (
        <nav
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid #f0f0f0",
                zIndex: 1000,
                padding: "12px 24px",
            }}
        >
            <div
                style={{
                    maxWidth: 1000,
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                    }}
                    onClick={() => handleNavigation("/")}
                >
                    <Image
                        src="/logo.png"
                        alt="Rechly"
                        width={32}
                        height={32}
                        style={{ borderRadius: 6 }}
                    />
                    <Title
                        level={5}
                        style={{ margin: 0, fontWeight: 600, color: "#111" }}
                    >
                        Rechly
                    </Title>
                </div>

                {/* Desktop Navigation */}
                {!isMobile && (
                    <Space size="small">
                        <Select
                            value={language}
                            onChange={setLanguage}
                            variant="borderless"
                            style={{ width: 80 }}
                            options={[
                                { value: "de", label: "DE" },
                                { value: "en", label: "EN" },
                            ]}
                        />
                        <Button
                            type="text"
                            icon={<GithubOutlined />}
                            href="https://github.com/myaxyo/rechly"
                            target="_blank"
                        />
                        {showAuth && (
                            <>
                                <Button
                                    type="text"
                                    onClick={() => router.push("/login")}
                                >
                                    {t("nav.login")}
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => router.push("/register")}
                                    style={{ borderRadius: 6 }}
                                >
                                    {t("nav.register")}
                                </Button>
                            </>
                        )}
                    </Space>
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                    <Button
                        type="text"
                        icon={<MenuOutlined style={{ fontSize: 20 }} />}
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ padding: "4px 8px" }}
                    />
                )}

                {/* Mobile Drawer Menu */}
                <Drawer
                    title={
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <Image
                                src="/logo.png"
                                alt="Rechly"
                                width={28}
                                height={28}
                                style={{ borderRadius: 6 }}
                            />
                            <span style={{ fontWeight: 600 }}>Rechly</span>
                        </div>
                    }
                    placement="right"
                    onClose={() => setMobileMenuOpen(false)}
                    open={mobileMenuOpen}
                    width={280}
                    closeIcon={<CloseOutlined />}
                    styles={{
                        body: {
                            padding: "16px 0",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        },
                    }}
                >
                    {/* Language Selector */}
                    <div style={{ padding: "8px 24px" }}>
                        <Select
                            value={language}
                            onChange={setLanguage}
                            style={{ width: "100%" }}
                            options={[
                                { value: "de", label: "🇩🇪 Deutsch" },
                                { value: "en", label: "🇬🇧 English" },
                            ]}
                        />
                    </div>

                    {/* Navigation Links */}
                    <div
                        style={{
                            padding: "8px 24px",
                            borderTop: "1px solid #f0f0f0",
                            marginTop: 8,
                        }}
                    >
                        <Button
                            type="text"
                            icon={<GithubOutlined />}
                            href="https://github.com/myaxyo/rechly"
                            target="_blank"
                            style={{
                                width: "100%",
                                justifyContent: "flex-start",
                                height: 44,
                            }}
                        >
                            GitHub
                        </Button>
                    </div>

                    {/* Auth Buttons */}
                    {showAuth && (
                        <div
                            style={{
                                padding: "16px 24px",
                                borderTop: "1px solid #f0f0f0",
                                marginTop: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            <Button
                                block
                                size="large"
                                onClick={() => handleNavigation("/login")}
                                style={{ borderRadius: 8 }}
                            >
                                {t("nav.login")}
                            </Button>
                            <Button
                                type="primary"
                                block
                                size="large"
                                onClick={() => handleNavigation("/register")}
                                style={{ borderRadius: 8 }}
                            >
                                {t("nav.register")}
                            </Button>
                        </div>
                    )}
                </Drawer>
            </div>
        </nav>
    );
}
