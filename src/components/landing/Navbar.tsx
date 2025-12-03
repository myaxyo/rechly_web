"use client";

import { Button, Space, Typography, Select } from "antd";
import { GithubOutlined } from "@ant-design/icons";
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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                    }}
                    onClick={() => router.push("/")}
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
            </div>
        </nav>
    );
}
