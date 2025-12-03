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
import Link from "next/link";

const { Title, Text } = Typography;

export default function RegisterPage() {
    const router = useRouter();
    const { register, googleLogin } = useAuth();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: {
        name: string;
        email: string;
        password: string;
    }) => {
        setLoading(true);
        try {
            await register(values.email, values.password, values.name);
            message.success("Registrierung erfolgreich!");
            router.push("/onboarding");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Registrierung fehlgeschlagen";
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
                        Konto erstellen
                    </Title>
                    <Text type="secondary">Starten Sie mit Rechly</Text>
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
                            { required: true, message: "Bitte Name eingeben" },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Vollständiger Name"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: "Bitte E-Mail eingeben",
                            },
                            {
                                type: "email",
                                message: "Ungültige E-Mail-Adresse",
                            },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="E-Mail" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Bitte Passwort eingeben",
                            },
                            { min: 8, message: "Mindestens 8 Zeichen" },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Passwort"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: true,
                                message: "Bitte Passwort bestätigen",
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
                                        new Error(
                                            "Die Passwörter stimmen nicht überein"
                                        )
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Passwort bestätigen"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            Registrieren
                        </Button>
                    </Form.Item>
                </Form>

                <Divider>oder</Divider>

                <Space
                    orientation="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                >
                    <Button
                        icon={<GoogleOutlined />}
                        block
                        size="large"
                        onClick={googleLogin}
                    >
                        Mit Google registrieren
                    </Button>
                </Space>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Text type="secondary">
                        Bereits ein Konto?{" "}
                        <Link href="/login" style={{ color: "#1976d2" }}>
                            Jetzt anmelden
                        </Link>
                    </Text>
                </div>
            </Card>
        </div>
    );
}
