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
    PrinterOutlined,
    RobotOutlined,
    CopyOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import {
    getInvoiceById,
    updateInvoiceStatus,
    deleteInvoice,
} from "@/lib/invoiceService";
import { getCompanyInfo } from "@/lib/companyService";
import { runInvoiceAssistant } from "@/lib/aiService";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { InvoiceWithDetails, UserCompany } from "@/types";

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
    const [company, setCompany] = useState<UserCompany | null>(null);
    const [draftingReminder, setDraftingReminder] = useState(false);
    const [reminderDraft, setReminderDraft] = useState("");
    const [reminderModalOpen, setReminderModalOpen] = useState(false);

    useEffect(() => {
        if (invoiceId) {
            loadInvoice();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const [data, companyData] = await Promise.all([
                getInvoiceById(invoiceId),
                getCompanyInfo(),
            ]);
            setInvoice(data);
            setCompany(companyData);
        } catch (error) {
            console.error("Error loading invoice:", error);
            message.error("Rechnung nicht gefunden");
            router.push("/dashboard/invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleDraftReminder = async () => {
        if (!invoice) {
            return;
        }

        setDraftingReminder(true);
        try {
            const result = await runInvoiceAssistant({
                action: "payment_reminder",
                companyName: company?.name,
                clientName: invoice.client?.name,
                clientEmail: invoice.client?.email,
                invoiceNumber: invoice.invoice_number,
                issueDate: invoice.issue_date,
                dueDate: invoice.due_date,
                totalGross: invoice.total_gross,
                currency: "EUR",
                notes: invoice.notes,
                paymentTerms: invoice.payment_terms,
                lineItems: invoice.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_of_measure: item.unit_of_measure,
                    price: item.price,
                })),
            });
            setReminderDraft(result.content);
            setReminderModalOpen(true);
            message.success("Zahlungserinnerung erstellt");
        } catch (error) {
            console.error("Error drafting payment reminder:", error);
            message.error(
                error instanceof Error
                    ? error.message
                    : "KI-Zahlungserinnerung konnte nicht erstellt werden",
            );
        } finally {
            setDraftingReminder(false);
        }
    };

    const copyReminderDraft = async () => {
        try {
            await navigator.clipboard.writeText(reminderDraft);
            message.success("Entwurf kopiert");
        } catch (error) {
            console.error("Error copying reminder draft:", error);
            message.error("Kopieren fehlgeschlagen");
        }
    };

    const openReminderAsEmail = () => {
        if (!invoice?.client?.email || !reminderDraft) {
            message.warning("Keine E-Mail-Adresse oder kein Entwurf vorhanden");
            return;
        }

        const lines = reminderDraft.split("\n");
        const subjectLine = lines.find((line) =>
            line.toLowerCase().startsWith("betreff:"),
        );
        const subject = subjectLine
            ? subjectLine.replace(/^Betreff:\s*/i, "").trim()
            : `Zahlungserinnerung ${invoice.invoice_number}`;
        const body = reminderDraft.replace(/^Betreff:\s*.*$/im, "").trim();

        window.open(
            `mailto:${invoice.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            "_blank",
        );
    };

    const handleStatusChange = async (
        newStatus: "draft" | "sent" | "paid" | "cancelled",
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

    const [correctionLoading, setCorrectionLoading] = useState(false);
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [correctionType, setCorrectionType] = useState<
        "credit_note" | "correction"
    >("credit_note");

    const handleCreateCorrection = async () => {
        setCorrectionLoading(true);
        try {
            const res = await fetch(`/api/invoices/${invoiceId}/correction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: correctionType }),
            });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            message.success("Korrekturdokument erstellt");
            setCorrectionModalOpen(false);
            router.push(`/dashboard/invoices/${data.invoiceId}`);
        } catch {
            message.error("Fehler beim Erstellen des Korrekturdokuments");
        } finally {
            setCorrectionLoading(false);
        }
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

            {invoice.payment_terms && (
                <Card title="Zahlungsbedingungen" style={{ marginTop: 24 }}>
                    <Text style={{ whiteSpace: "pre-line" }}>
                        {invoice.payment_terms}
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
                                `/dashboard/invoices/${invoice.id}/pdf?print=true`,
                            );
                        }}
                    >
                        Drucken
                    </Button>
                    <Button
                        icon={<RollbackOutlined />}
                        onClick={() => setCorrectionModalOpen(true)}
                        disabled={invoice.status === "draft"}
                    >
                        Storno / Korrektur
                    </Button>
                    <Button
                        icon={<RobotOutlined />}
                        loading={draftingReminder}
                        onClick={handleDraftReminder}
                    >
                        KI-Zahlungserinnerung
                    </Button>
                    <Button
                        icon={<MailOutlined />}
                        onClick={() => {
                            if (invoice.client?.email) {
                                window.open(
                                    `mailto:${invoice.client.email}?subject=Rechnung ${invoice.invoice_number}`,
                                    "_blank",
                                );
                            } else {
                                message.warning(
                                    "Keine E-Mail-Adresse hinterlegt",
                                );
                            }
                        }}
                    >
                        Per E-Mail senden
                    </Button>
                </Space>
            </Card>

            <Modal
                title="Korrekturdokument erstellen"
                open={correctionModalOpen}
                onCancel={() => setCorrectionModalOpen(false)}
                onOk={handleCreateCorrection}
                okText="Erstellen"
                cancelText="Abbrechen"
                confirmLoading={correctionLoading}
            >
                <p>Wähle die Art des Korrekturdokuments:</p>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        marginTop: 12,
                    }}
                >
                    <label style={{ cursor: "pointer" }}>
                        <input
                            type="radio"
                            name="correctionType"
                            value="credit_note"
                            checked={correctionType === "credit_note"}
                            onChange={() => setCorrectionType("credit_note")}
                            style={{ marginRight: 8 }}
                        />
                        <strong>Gutschrift (GS-...)</strong> — Storniert die
                        Rechnung mit negierten Beträgen
                    </label>
                    <label style={{ cursor: "pointer" }}>
                        <input
                            type="radio"
                            name="correctionType"
                            value="correction"
                            checked={correctionType === "correction"}
                            onChange={() => setCorrectionType("correction")}
                            style={{ marginRight: 8 }}
                        />
                        <strong>Korrekturrechnung (KR-...)</strong> — Kopie zum
                        Bearbeiten
                    </label>
                </div>
            </Modal>

            <Modal
                title="KI-Zahlungserinnerung"
                open={reminderModalOpen}
                onCancel={() => setReminderModalOpen(false)}
                footer={[
                    <Button
                        key="copy"
                        icon={<CopyOutlined />}
                        onClick={copyReminderDraft}
                    >
                        Kopieren
                    </Button>,
                    <Button
                        key="mail"
                        type="primary"
                        icon={<MailOutlined />}
                        onClick={openReminderAsEmail}
                        disabled={!invoice.client?.email}
                    >
                        Als E-Mail öffnen
                    </Button>,
                ]}
                width={760}
            >
                <div style={{ whiteSpace: "pre-wrap" }}>{reminderDraft}</div>
            </Modal>
        </div>
    );
}
