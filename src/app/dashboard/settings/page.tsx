"use client";

import { useEffect, useState } from "react";
import {
    Card,
    Form,
    Input,
    Button,
    Space,
    message,
    Typography,
    Divider,
    Upload,
    Image,
    Tabs,
    Switch,
    Modal,
} from "antd";
import {
    SaveOutlined,
    UploadOutlined,
    DeleteOutlined,
    UserOutlined,
    BankOutlined,
    FileTextOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { getCompanyInfo, saveCompanyInfo } from "@/lib/companyService";
import { useAuth } from "@/contexts/AuthContext";
import type { UserCompany } from "@/types";

const { Title, Text } = Typography;

export default function SettingsPage() {
    const { user, logout, deleteAccount } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [company, setCompany] = useState<UserCompany | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadCompanyInfo();
    }, []);

    const loadCompanyInfo = async () => {
        try {
            setLoading(true);
            const data = await getCompanyInfo();
            setCompany(data);
            if (data) {
                form.setFieldsValue(data);
                setLogoPreview(data.logo_base64 || null);
            }
        } catch (error) {
            console.error("Error loading company info:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (
        values: Omit<UserCompany, "id" | "created_at" | "updated_at">
    ) => {
        setSaving(true);
        try {
            await saveCompanyInfo({
                ...values,
                logo_base64: logoPreview || undefined,
            });
            message.success("Einstellungen gespeichert");
        } catch (error) {
            console.error("Error saving settings:", error);
            message.error("Fehler beim Speichern");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload: UploadProps["beforeUpload"] = (file) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("Nur Bilddateien sind erlaubt");
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error("Bild muss kleiner als 2MB sein");
            return false;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        return false; // Prevent auto upload
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
    };

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const handleDeleteAccount = () => {
        Modal.confirm({
            title: "Konto löschen",
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Sind Sie sicher, dass Sie Ihr Konto löschen möchten?</p>
                    <p style={{ color: "#ff4d4f", fontWeight: 500 }}>
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle
                        Ihre Daten werden unwiderruflich gelöscht.
                    </p>
                </div>
            ),
            okText: "Ja, Konto löschen",
            okType: "danger",
            cancelText: "Abbrechen",
            onOk: async () => {
                setDeleting(true);
                try {
                    await deleteAccount();
                    message.success("Ihr Konto wurde gelöscht");
                    window.location.href = "/";
                } catch (error) {
                    console.error("Error deleting account:", error);
                    message.error("Fehler beim Löschen des Kontos");
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    const tabItems = [
        {
            key: "company",
            label: (
                <span>
                    <BankOutlined /> Unternehmen
                </span>
            ),
            children: (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    disabled={loading}
                >
                    {/* Logo */}
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            {logoPreview ? (
                                <Image
                                    src={logoPreview}
                                    alt="Logo"
                                    width={80}
                                    height={80}
                                    style={{ objectFit: "contain" }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        background: "#f0f0f0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 8,
                                    }}
                                >
                                    <BankOutlined
                                        style={{ fontSize: 32, color: "#999" }}
                                    />
                                </div>
                            )}
                            <Space orientation="vertical">
                                <Upload
                                    beforeUpload={handleLogoUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />}>
                                        Logo hochladen
                                    </Button>
                                </Upload>
                                {logoPreview && (
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleRemoveLogo}
                                    >
                                        Entfernen
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </Card>

                    {/* Company Name */}
                    <Form.Item
                        name="name"
                        label="Firmenname"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input placeholder="Meine Firma GmbH" />
                    </Form.Item>

                    <Form.Item name="legal_form" label="Rechtsform">
                        <Input placeholder="GmbH, UG, Einzelunternehmen, etc." />
                    </Form.Item>

                    <Divider>Adresse</Divider>

                    <Form.Item
                        name="address_line1"
                        label="Adresse"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input placeholder="Straße und Hausnummer" />
                    </Form.Item>

                    <Form.Item name="address_line2" label="Adresszusatz">
                        <Input placeholder="Gebäude, Etage, etc." />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="postal_code"
                            label="PLZ"
                            rules={[{ required: true, message: "Pflichtfeld" }]}
                            style={{ width: 120 }}
                        >
                            <Input placeholder="12345" />
                        </Form.Item>

                        <Form.Item
                            name="city"
                            label="Stadt"
                            rules={[{ required: true, message: "Pflichtfeld" }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Berlin" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="country" label="Land">
                        <Input placeholder="Deutschland" />
                    </Form.Item>

                    <Divider>Kontakt</Divider>

                    <Form.Item
                        name="email"
                        label="E-Mail"
                        rules={[
                            { required: true, message: "Pflichtfeld" },
                            { type: "email", message: "Ungültige E-Mail" },
                        ]}
                    >
                        <Input placeholder="info@firma.de" />
                    </Form.Item>

                    <Form.Item name="phone" label="Telefon">
                        <Input placeholder="+49 30 123456" />
                    </Form.Item>

                    <Form.Item name="website" label="Website">
                        <Input placeholder="https://www.firma.de" />
                    </Form.Item>

                    <Divider>Steuerinformationen</Divider>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="vat_id"
                            label="USt-IdNr."
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="DE123456789" />
                        </Form.Item>

                        <Form.Item
                            name="tax_number"
                            label="Steuernummer"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="12/345/67890" />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="commercial_register_number"
                        label="Handelsregisternummer"
                    >
                        <Input placeholder="HRB 12345" />
                    </Form.Item>

                    <Form.Item name="registry_court" label="Registergericht">
                        <Input placeholder="Amtsgericht Berlin-Charlottenburg" />
                    </Form.Item>

                    <Form.Item
                        name="managing_directors"
                        label="Geschäftsführer"
                    >
                        <Input placeholder="Max Mustermann" />
                    </Form.Item>

                    <Divider>Bankverbindung</Divider>

                    <Form.Item name="bank_name" label="Bank">
                        <Input placeholder="Deutsche Bank" />
                    </Form.Item>

                    <Form.Item
                        name="bank_iban"
                        label="IBAN"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input placeholder="DE89 3704 0044 0532 0130 00" />
                    </Form.Item>

                    <Form.Item name="bank_bic" label="BIC">
                        <Input placeholder="COBADEFFXXX" />
                    </Form.Item>

                    <Divider>Rechnungseinstellungen</Divider>

                    <Form.Item
                        name="payment_terms_default"
                        label="Standard-Zahlungsbedingungen"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input.TextArea
                            placeholder="Zahlbar innerhalb von 14 Tagen ohne Abzug."
                            rows={2}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={saving}
                            size="large"
                        >
                            Speichern
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: "account",
            label: (
                <span>
                    <UserOutlined /> Konto
                </span>
            ),
            children: (
                <div>
                    <Card>
                        <Title level={5}>Kontoinformationen</Title>
                        <Space orientation="vertical" style={{ width: "100%" }}>
                            <div>
                                <Text type="secondary">E-Mail:</Text>
                                <br />
                                <Text strong>{user?.email || "Gast"}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Konto-ID:</Text>
                                <br />
                                <Text code>{user?.$id}</Text>
                            </div>
                        </Space>
                    </Card>

                    <Card style={{ marginTop: 16 }}>
                        <Title level={5}>Abmelden</Title>
                        <Text type="secondary">
                            Sie werden von Ihrem Konto abgemeldet und zur
                            Anmeldeseite weitergeleitet.
                        </Text>
                        <div style={{ marginTop: 16 }}>
                            <Button danger onClick={handleLogout}>
                                Abmelden
                            </Button>
                        </div>
                    </Card>

                    <Card
                        style={{
                            marginTop: 16,
                            borderColor: "#ff4d4f",
                        }}
                    >
                        <Title level={5} style={{ color: "#ff4d4f" }}>
                            Konto löschen
                        </Title>
                        <Text type="secondary">
                            Wenn Sie Ihr Konto löschen, werden alle Ihre Daten
                            unwiderruflich entfernt. Dies umfasst alle
                            Rechnungen, Kunden, Produkte und
                            Unternehmenseinstellungen.
                        </Text>
                        <div style={{ marginTop: 16 }}>
                            <Button
                                danger
                                type="primary"
                                onClick={handleDeleteAccount}
                                loading={deleting}
                                icon={<DeleteOutlined />}
                            >
                                Konto löschen
                            </Button>
                        </div>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>Einstellungen</Title>
            <Tabs items={tabItems} />
        </div>
    );
}
