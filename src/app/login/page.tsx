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
    message,
    Space,
    Modal,
} from "antd";
import {
    MailOutlined,
    LockOutlined,
    GoogleOutlined,
    UserOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
    const router = useRouter();
    const { login, googleLogin, loginAnonymously } = useAuth();
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const [guestModalVisible, setGuestModalVisible] = useState(false);

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            message.success("Erfolgreich angemeldet!");
            router.push("/dashboard");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Login fehlgeschlagen";
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setGuestLoading(true);
        try {
            await loginAnonymously();
            message.success("Als Gast angemeldet!");
            router.push("/dashboard");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Gastanmeldung fehlgeschlagen";
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
                    <Text type="secondary">
                        Professionelle Rechnungsverwaltung
                    </Text>
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
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Passwort"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                        >
                            Anmelden
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
                        Mit Google anmelden
                    </Button>

                    <Button
                        icon={<UserOutlined />}
                        block
                        size="large"
                        onClick={showGuestWarning}
                        loading={guestLoading}
                    >
                        Als Gast fortfahren
                    </Button>
                </Space>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Text type="secondary">
                        Noch kein Konto?{" "}
                        <Link href="/register" style={{ color: "#1976d2" }}>
                            Jetzt registrieren
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
                        Warnung: Gastzugang
                    </span>
                }
                open={guestModalVisible}
                onOk={handleGuestLogin}
                onCancel={() => setGuestModalVisible(false)}
                okText="Verstanden, fortfahren"
                cancelText="Abbrechen"
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
                        Deine Daten werden gelöscht, wenn du den Tab schließt!
                    </Text>
                    <Text style={{ color: "#666" }}>
                        Als Gast kannst du Rechly ausprobieren, aber:
                    </Text>
                    <ul style={{ marginTop: 8, color: "#666" }}>
                        <li>Alle Rechnungen und Kundendaten gehen verloren</li>
                        <li>Du kannst deine Daten nicht wiederherstellen</li>
                        <li>Du kannst später nicht auf dein Konto zugreifen</li>
                    </ul>
                    <Text
                        type="secondary"
                        style={{ display: "block", marginTop: 12 }}
                    >
                        Für dauerhafte Nutzung empfehlen wir die Registrierung
                        mit E-Mail oder Google.
                    </Text>
                </div>
            </Modal>
        </div>
    );
}
