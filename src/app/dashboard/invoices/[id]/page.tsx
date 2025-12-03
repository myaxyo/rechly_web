"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Card,
    Button,
    Space,
    message,
    Typography,
    Divider,
    Table,
    Tag,
    Descriptions,
    Dropdown,
    Spin,
    Modal,
} from "antd";
import {
    ArrowLeftOutlined,
    FilePdfOutlined,
    MailOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import {
    getInvoiceById,
    updateInvoiceStatus,
    deleteInvoice,
} from "@/lib/invoiceService";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { InvoiceWithDetails } from "@/types";

const { Title, Text } = Typography;

const statusConfig: Record<
    string,
    { color: string; label: string; icon: React.ReactNode }
> = {
    draft: { color: "default", label: "Entwurf", icon: <EditOutlined /> },
    sent: { color: "processing", label: "Gesendet", icon: <MailOutlined /> },
    paid: { color: "success", label: "Bezahlt", icon: <CheckCircleOutlined /> },
    cancelled: {
        color: "default",
        label: "Storniert",
        icon: <ClockCircleOutlined />,
    },
};

export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);

    useEffect(() => {
        if (invoiceId) {
            loadInvoice();
        }
    }, [invoiceId]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const data = await getInvoiceById(invoiceId);
            setInvoice(data);
        } catch (error) {
            console.error("Error loading invoice:", error);
            message.error("Rechnung nicht gefunden");
            router.push("/dashboard/invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (
        newStatus: "draft" | "sent" | "paid" | "cancelled"
    ) => {
        if (!invoice || !invoice.id) return;

        try {
            await updateInvoiceStatus(invoice.id, newStatus);
            setInvoice({ ...invoice, status: newStatus });
            message.success("Status aktualisiert");
        } catch (error) {
            console.error("Error updating status:", error);
            message.error("Fehler beim Aktualisieren");
        }
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Rechnung löschen?",
            content: "Diese Aktion kann nicht rückgängig gemacht werden.",
            okText: "Löschen",
            okType: "danger",
            cancelText: "Abbrechen",
            onOk: async () => {
                try {
                    await deleteInvoice(invoiceId);
                    message.success("Rechnung gelöscht");
                    router.push("/dashboard/invoices");
                } catch (error) {
                    console.error("Error deleting invoice:", error);
                    message.error("Fehler beim Löschen");
                }
            },
        });
    };

    const statusMenuItems = [
        {
            key: "draft",
            label: "Als Entwurf markieren",
            onClick: () => handleStatusChange("draft"),
        },
        {
            key: "sent",
            label: "Als Gesendet markieren",
            onClick: () => handleStatusChange("sent"),
        },
        {
            key: "paid",
            label: "Als Bezahlt markieren",
            onClick: () => handleStatusChange("paid"),
        },
        {
            key: "cancelled",
            label: "Stornieren",
            onClick: () => handleStatusChange("cancelled"),
        },
    ];

    const columns = [
        {
            title: "Beschreibung",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Menge",
            dataIndex: "quantity",
            key: "quantity",
            width: 100,
            align: "right" as const,
        },
        {
            title: "Einheit",
            dataIndex: "unit_of_measure",
            key: "unit_of_measure",
            width: 100,
        },
        {
            title: "Einzelpreis",
            dataIndex: "price",
            key: "price",
            width: 120,
            align: "right" as const,
            render: (val: number) => formatCurrency(val),
        },
        {
            title: "MwSt.",
            dataIndex: "tax_rate_percent",
            key: "tax_rate_percent",
            width: 80,
            align: "right" as const,
            render: (val: number) => `${val}%`,
        },
        {
            title: "Gesamt",
            dataIndex: "total",
            key: "total",
            width: 120,
            align: "right" as const,
            render: (val: number) => <Text strong>{formatCurrency(val)}</Text>,
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!invoice) {
        return null;
    }

    const config = statusConfig[invoice.status] || statusConfig.draft;
    const clientAddress = invoice.client
        ? `${invoice.client.address_line1}\n${invoice.client.postal_code} ${invoice.client.city}`
        : "";

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push("/dashboard/invoices")}
                    >
                        Zurück
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>
                        {invoice.invoice_number}
                    </Title>
                    <Tag color={config.color} icon={config.icon}>
                        {config.label}
                    </Tag>
                </Space>

                <Space wrap>
                    <Dropdown
                        menu={{ items: statusMenuItems }}
                        trigger={["click"]}
                    >
                        <Button>Status ändern</Button>
                    </Dropdown>
                    <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        onClick={() =>
                            router.push(`/dashboard/invoices/${invoice.id}/pdf`)
                        }
                    >
                        PDF
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                    >
                        Löschen
                    </Button>
                </Space>
            </div>

            {/* Invoice Info */}
            <Card style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                        <Text type="secondary">Rechnungsempfänger</Text>
                        <Title level={5} style={{ margin: "8px 0 4px" }}>
                            {invoice.client?.name || "Unbekannter Kunde"}
                        </Title>
                        <Text style={{ whiteSpace: "pre-line" }}>
                            {clientAddress}
                        </Text>
                        <br />
                        {invoice.client?.email && (
                            <Text type="secondary">{invoice.client.email}</Text>
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: 250 }}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Rechnungsnummer">
                                <Text strong>{invoice.invoice_number}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Rechnungsdatum">
                                {formatDateGerman(invoice.issue_date)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fälligkeitsdatum">
                                {invoice.due_date
                                    ? formatDateGerman(invoice.due_date)
                                    : "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Währung">
                                EUR
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                </div>
            </Card>

            {/* Line Items */}
            <Card title="Positionen" style={{ marginBottom: 24 }}>
                <Table
                    columns={columns}
                    dataSource={invoice.items || []}
                    pagination={false}
                    rowKey="id"
                    locale={{ emptyText: "Keine Positionen" }}
                />

                <Divider />

                <div style={{ textAlign: "right" }}>
                    <Space direction="vertical" align="end" size={8}>
                        <div>
                            <Text type="secondary">Zwischensumme: </Text>
                            <Text
                                style={{
                                    minWidth: 100,
                                    display: "inline-block",
                                    textAlign: "right",
                                }}
                            >
                                {formatCurrency(invoice.subtotal)}
                            </Text>
                        </div>
                        <div>
                            <Text type="secondary">MwSt.: </Text>
                            <Text
                                style={{
                                    minWidth: 100,
                                    display: "inline-block",
                                    textAlign: "right",
                                }}
                            >
                                {formatCurrency(invoice.total_vat)}
                            </Text>
                        </div>
                        <Divider style={{ margin: "8px 0" }} />
                        <div>
                            <Text strong style={{ fontSize: 18 }}>
                                Gesamt:{" "}
                            </Text>
                            <Text
                                strong
                                style={{
                                    fontSize: 18,
                                    minWidth: 100,
                                    display: "inline-block",
                                    textAlign: "right",
                                }}
                            >
                                {formatCurrency(invoice.total_gross)}
                            </Text>
                        </div>
                    </Space>
                </div>
            </Card>

            {/* Notes */}
            {invoice.notes && (
                <Card title="Notizen">
                    <Text style={{ whiteSpace: "pre-line" }}>
                        {invoice.notes}
                    </Text>
                </Card>
            )}

            {/* Actions */}
            <Card title="Aktionen" style={{ marginTop: 24 }}>
                <Space wrap>
                    <Button
                        icon={<FilePdfOutlined />}
                        onClick={() =>
                            router.push(`/dashboard/invoices/${invoice.id}/pdf`)
                        }
                    >
                        PDF anzeigen
                    </Button>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={() => {
                            router.push(
                                `/dashboard/invoices/${invoice.id}/pdf?print=true`
                            );
                        }}
                    >
                        Drucken
                    </Button>
                    <Button
                        icon={<MailOutlined />}
                        onClick={() => {
                            if (invoice.client?.email) {
                                window.open(
                                    `mailto:${invoice.client.email}?subject=Rechnung ${invoice.invoice_number}`,
                                    "_blank"
                                );
                            } else {
                                message.warning(
                                    "Keine E-Mail-Adresse hinterlegt"
                                );
                            }
                        }}
                    >
                        Per E-Mail senden
                    </Button>
                </Space>
            </Card>
        </div>
    );
}
