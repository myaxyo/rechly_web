"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    Divider,
    Space,
    message,
} from "antd";
import {
    MailOutlined,
    LockOutlined,
    UserOutlined,
    GoogleOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

const { Title, Text } = Typography;

export default function RegisterPage() {
    const router = useRouter();
    const { register, googleLogin } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: {
        name: string;
        email: string;
        password: string;
    }) => {
        setLoading(true);
        try {
            await register(values.email, values.password, values.name);
            message.success(t("auth.registerSuccess"));
            router.push("/onboarding");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t("auth.registerFailed");
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
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
                        {t("auth.createAccount")}
                    </Title>
                    <Text type="secondary">{t("auth.startWithRechly")}</Text>
                </div>

                <Form
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="name"
                        rules={[
                            { required: true, message: t("auth.nameRequired") },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={t("auth.fullName")}
                        />
                    </Form.Item>

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
                            { min: 8, message: t("auth.passwordMin") },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={t("auth.password")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: true,
                                message: t("auth.confirmPasswordRequired"),
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (
                                        !value ||
                                        getFieldValue("password") === value
                                    ) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error(t("auth.passwordMismatch"))
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={t("auth.confirmPassword")}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            {t("auth.register")}
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
                        href="/api/auth/google"
                    >
                        {t("auth.registerWithGoogle")}
                    </Button>
                </Space>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Text type="secondary">
                        {t("auth.hasAccount")}{" "}
                        <Link href="/login" style={{ color: "#1976d2" }}>
                            {t("auth.signInNow")}
                        </Link>
                    </Text>
                </div>
            </Card>
        </div>
    );
}
