"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    Divider,
    message,
    Space,
    Modal,
    Spin,
} from "antd";
import {
    MailOutlined,
    LockOutlined,
    GoogleOutlined,
    UserOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

const { Title, Text } = Typography;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, googleLogin, loginAnonymously } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const [guestModalVisible, setGuestModalVisible] = useState(false);

    // Handle OAuth errors from URL
    useEffect(() => {
        // Log all URL params for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        if (Object.keys(allParams).length > 0) {
            console.log("Login page URL params:", allParams);
        }

        const errorParam = searchParams.get("error");
        if (errorParam) {
            console.log("OAuth error param:", errorParam);
            try {
                const error = JSON.parse(decodeURIComponent(errorParam));
                if (error.type === "user_already_exists") {
                    message.info(t("auth.accountExists"));
                } else {
                    message.error(error.message || t("auth.loginFailed"));
                }
            } catch {
                // If it's not JSON, show the raw error
                message.error(errorParam || t("auth.loginFailed"));
            }
            // Clear the error from URL
            router.replace("/login");
        }
    }, [searchParams, router, t]);

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            message.success(t("auth.loginSuccess"));
            router.push("/dashboard");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : t("auth.loginFailed");
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setGuestLoading(true);
        try {
            await loginAnonymously();
            message.success(t("auth.guestSuccess"));
            router.push("/dashboard");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : t("auth.guestFailed");
            message.error(errorMessage);
        } finally {
            setGuestLoading(false);
            setGuestModalVisible(false);
        }
    };

    const showGuestWarning = () => {
        setGuestModalVisible(true);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)",
                padding: 20,
            }}
        >
            <Card
                style={{
                    width: "100%",
                    maxWidth: 420,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <Title
                        level={2}
                        style={{ marginBottom: 8, color: "#1976d2" }}
                    >
                        Rechly
                    </Title>
                    <Text type="secondary">{t("auth.subtitle")}</Text>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: t("auth.emailRequired"),
                            },
                            {
                                type: "email",
                                message: t("auth.emailInvalid"),
                            },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder={t("auth.email")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: t("auth.passwordRequired"),
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={t("auth.password")}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            {t("auth.login")}
                        </Button>
                    </Form.Item>
                </Form>

                <Divider>{t("auth.or")}</Divider>

                <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                >
                    <Button
                        icon={<GoogleOutlined />}
                        block
                        size="large"
                        onClick={googleLogin}
                    >
                        {t("auth.withGoogle")}
                    </Button>

                    <Button
                        icon={<UserOutlined />}
                        block
                        size="large"
                        onClick={showGuestWarning}
                        loading={guestLoading}
                    >
                        {t("auth.asGuest")}
                    </Button>
                </Space>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Text type="secondary">
                        {t("auth.noAccount")}{" "}
                        <Link href="/register" style={{ color: "#1976d2" }}>
                            {t("auth.signUpNow")}
                        </Link>
                    </Text>
                </div>
            </Card>

            <Modal
                title={
                    <span>
                        <WarningOutlined
                            style={{ color: "#faad14", marginRight: 8 }}
                        />
                        {t("guest.warningTitle")}
                    </span>
                }
                open={guestModalVisible}
                onOk={handleGuestLogin}
                onCancel={() => setGuestModalVisible(false)}
                okText={t("guest.continue")}
                cancelText={t("guest.cancel")}
                okButtonProps={{ loading: guestLoading, danger: true }}
            >
                <div style={{ padding: "16px 0" }}>
                    <Text
                        strong
                        style={{
                            fontSize: 15,
                            display: "block",
                            marginBottom: 12,
                        }}
                    >
                        {t("guest.warningMain")}
                    </Text>
                    <Text style={{ color: "#666" }}>
                        {t("guest.warningIntro")}
                    </Text>
                    <ul style={{ marginTop: 8, color: "#666" }}>
                        <li>{t("guest.warningPoint1")}</li>
                        <li>{t("guest.warningPoint2")}</li>
                        <li>{t("guest.warningPoint3")}</li>
                    </ul>
                    <Text
                        type="secondary"
                        style={{ display: "block", marginTop: 12 }}
                    >
                        {t("guest.warningNote")}
                    </Text>
                </div>
            </Modal>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                            "linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)",
                    }}
                >
                    <Spin size="large" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
