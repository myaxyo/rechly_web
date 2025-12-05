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
    Row,
    Col,
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
import { useLanguage } from "@/contexts/LanguageContext";
import type { UserCompany } from "@/types";

const { Title, Text } = Typography;

export default function SettingsPage() {
    const { user, logout, deleteAccount } = useAuth();
    const { t } = useLanguage();
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
            message.success(t("settings.saved"));
        } catch (error) {
            console.error("Error saving settings:", error);
            message.error(t("settings.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload: UploadProps["beforeUpload"] = (file) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error(t("settings.imageOnly"));
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error(t("settings.imageTooLarge"));
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
            title: t("settings.deleteAccountTitle"),
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>{t("settings.deleteAccountConfirm")}</p>
                    <p style={{ color: "#ff4d4f", fontWeight: 500 }}>
                        {t("settings.deleteAccountWarning")}
                    </p>
                </div>
            ),
            okText: t("settings.deleteAccountButton"),
            okType: "danger",
            cancelText: t("settings.deleteAccountCancel"),
            onOk: async () => {
                setDeleting(true);
                try {
                    await deleteAccount();
                    message.success(t("settings.accountDeleted"));
                    window.location.href = "/";
                } catch (error) {
                    console.error("Error deleting account:", error);
                    message.error(t("settings.deleteError"));
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
                    <BankOutlined /> {t("settings.company")}
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
                            <Space direction="vertical">
                                <Upload
                                    beforeUpload={handleLogoUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />}>
                                        {t("settings.uploadLogo")}
                                    </Button>
                                </Upload>
                                {logoPreview && (
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={handleRemoveLogo}
                                    >
                                        {t("settings.removeLogo")}
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </Card>

                    {/* Company Name */}
                    <Form.Item
                        name="name"
                        label={t("settings.companyName")}
                        rules={[
                            { required: true, message: t("settings.required") },
                        ]}
                    >
                        <Input placeholder={t("settings.companyName")} />
                    </Form.Item>

                    <Form.Item
                        name="legal_form"
                        label={t("settings.legalForm")}
                    >
                        <Input
                            placeholder={t("settings.legalFormPlaceholder")}
                        />
                    </Form.Item>

                    <Divider>{t("settings.address")}</Divider>

                    <Form.Item
                        name="address_line1"
                        label={t("settings.address")}
                        rules={[
                            { required: true, message: t("settings.required") },
                        ]}
                    >
                        <Input placeholder={t("settings.streetNumber")} />
                    </Form.Item>

                    <Form.Item
                        name="address_line2"
                        label={t("settings.addressExtra")}
                    >
                        <Input placeholder={t("settings.addressExtra")} />
                    </Form.Item>

                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="postal_code"
                                label={t("settings.postalCode")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("settings.required"),
                                    },
                                ]}
                            >
                                <Input placeholder="12345" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={16}>
                            <Form.Item
                                name="city"
                                label={t("settings.city")}
                                rules={[
                                    {
                                        required: true,
                                        message: t("settings.required"),
                                    },
                                ]}
                            >
                                <Input placeholder={t("settings.city")} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="country" label={t("settings.country")}>
                        <Input placeholder={t("settings.country")} />
                    </Form.Item>

                    <Divider>{t("settings.contact")}</Divider>

                    <Form.Item
                        name="email"
                        label={t("settings.email")}
                        rules={[
                            { required: true, message: t("settings.required") },
                            {
                                type: "email",
                                message: t("settings.invalidEmail"),
                            },
                        ]}
                    >
                        <Input placeholder="info@company.com" />
                    </Form.Item>

                    <Form.Item name="phone" label={t("settings.phone")}>
                        <Input placeholder="+49 30 123456" />
                    </Form.Item>

                    <Form.Item name="website" label={t("settings.website")}>
                        <Input placeholder="https://www.company.com" />
                    </Form.Item>

                    <Divider>{t("settings.taxInfo")}</Divider>

                    <Row gutter={[12, 0]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="vat_id"
                                label={t("settings.vatId")}
                            >
                                <Input placeholder="DE123456789" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="tax_number"
                                label={t("settings.taxNumber")}
                            >
                                <Input placeholder="12/345/67890" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="commercial_register_number"
                        label={t("settings.commercialRegister")}
                    >
                        <Input placeholder="HRB 12345" />
                    </Form.Item>

                    <Form.Item
                        name="registry_court"
                        label={t("settings.registryCourt")}
                    >
                        <Input placeholder={t("settings.registryCourt")} />
                    </Form.Item>

                    <Form.Item
                        name="managing_directors"
                        label={t("settings.managingDirectors")}
                    >
                        <Input placeholder={t("settings.managingDirectors")} />
                    </Form.Item>

                    <Divider>{t("settings.bankDetails")}</Divider>

                    <Form.Item name="bank_name" label={t("settings.bankName")}>
                        <Input placeholder={t("settings.bankName")} />
                    </Form.Item>

                    <Form.Item
                        name="bank_iban"
                        label={t("settings.iban")}
                        rules={[
                            { required: true, message: t("settings.required") },
                        ]}
                    >
                        <Input placeholder="DE89 3704 0044 0532 0130 00" />
                    </Form.Item>

                    <Form.Item name="bank_bic" label={t("settings.bic")}>
                        <Input placeholder="COBADEFFXXX" />
                    </Form.Item>

                    <Divider>{t("settings.invoiceSettings")}</Divider>

                    <Form.Item
                        name="payment_terms_default"
                        label={t("settings.paymentTerms")}
                        rules={[
                            { required: true, message: t("settings.required") },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={t("settings.paymentTermsPlaceholder")}
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
                            {t("settings.save")}
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: "account",
            label: (
                <span>
                    <UserOutlined /> {t("settings.account")}
                </span>
            ),
            children: (
                <div>
                    <Card>
                        <Title level={5}>{t("settings.accountInfo")}</Title>
                        <Space direction="vertical" style={{ width: "100%" }}>
                            <div>
                                <Text type="secondary">
                                    {t("settings.accountEmail")}
                                </Text>
                                <br />
                                <Text strong>
                                    {user?.email || t("settings.guest")}
                                </Text>
                            </div>
                            <div>
                                <Text type="secondary">
                                    {t("settings.accountId")}
                                </Text>
                                <br />
                                <Text code>{user?.$id}</Text>
                            </div>
                        </Space>
                    </Card>

                    <Card style={{ marginTop: 16 }}>
                        <Title level={5}>{t("settings.logout")}</Title>
                        <Text type="secondary">{t("settings.logoutDesc")}</Text>
                        <div style={{ marginTop: 16 }}>
                            <Button danger onClick={handleLogout}>
                                {t("settings.logout")}
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
                            {t("settings.deleteAccount")}
                        </Title>
                        <Text type="secondary">
                            {t("settings.deleteAccountWarning")}
                        </Text>
                        <div style={{ marginTop: 16 }}>
                            <Button
                                danger
                                type="primary"
                                onClick={handleDeleteAccount}
                                loading={deleting}
                                icon={<DeleteOutlined />}
                            >
                                {t("settings.deleteAccount")}
                            </Button>
                        </div>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>{t("settings.title")}</Title>
            <Tabs items={tabItems} />
        </div>
    );
}
