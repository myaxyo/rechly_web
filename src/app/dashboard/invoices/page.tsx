"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    Button,
    Input,
    Space,
    Tag,
    Dropdown,
    Modal,
    message,
    Card,
    Row,
    Col,
    Statistic,
} from "antd";
import type { TableProps, MenuProps } from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    MoreOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    FilePdfOutlined,
    CheckCircleOutlined,
    SendOutlined,
} from "@ant-design/icons";
import { useInvoiceStore } from "@/store";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { InvoiceWithClient, Invoice } from "@/types";

const statusColors: Record<string, string> = {
    draft: "default",
    sent: "processing",
    paid: "success",
    cancelled: "error",
};

const statusLabels: Record<string, string> = {
    draft: "Entwurf",
    sent: "Versendet",
    paid: "Bezahlt",
    cancelled: "Storniert",
};

export default function InvoicesPage() {
    const router = useRouter();
    const [searchText, setSearchText] = useState("");

    // Zustand store
    const {
        invoices,
        stats,
        loading,
        fetchInvoices,
        fetchStats,
        updateStatus,
        removeInvoice,
    } = useInvoiceStore();

    // Filter invoices based on search
    const filteredInvoices = invoices.filter(
        (invoice) =>
            invoice.invoice_number
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
            invoice.client?.name
                ?.toLowerCase()
                .includes(searchText.toLowerCase())
    );

    useEffect(() => {
        fetchInvoices();
        fetchStats();
    }, []);

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: "Rechnung löschen?",
            content: "Diese Aktion kann nicht rückgängig gemacht werden.",
            okText: "Löschen",
            okType: "danger",
            cancelText: "Abbrechen",
            onOk: async () => {
                try {
                    await removeInvoice(id);
                    message.success("Rechnung gelöscht");
                } catch (error) {
                    console.error("Error deleting invoice:", error);
                    message.error("Fehler beim Löschen");
                }
            },
        });
    };

    const handleStatusChange = async (
        id: string,
        status: Invoice["status"]
    ) => {
        try {
            await updateStatus(id, status);
            message.success("Status aktualisiert");
        } catch (error) {
            console.error("Error updating status:", error);
            message.error("Fehler beim Aktualisieren");
        }
    };

    const getActionMenu = (record: InvoiceWithClient): MenuProps["items"] => [
        {
            key: "view",
            icon: <EyeOutlined />,
            label: "Anzeigen",
            onClick: () => router.push(`/dashboard/invoices/${record.id}`),
        },
        {
            key: "edit",
            icon: <EditOutlined />,
            label: "Bearbeiten",
            onClick: () => router.push(`/dashboard/invoices/${record.id}/edit`),
        },
        {
            key: "pdf",
            icon: <FilePdfOutlined />,
            label: "PDF herunterladen",
            onClick: () => router.push(`/dashboard/invoices/${record.id}/pdf`),
        },
        { type: "divider" },
        ...(record.status === "draft"
            ? [
                  {
                      key: "send",
                      icon: <SendOutlined />,
                      label: "Als versendet markieren",
                      onClick: () => handleStatusChange(record.id!, "sent"),
                  },
              ]
            : []),
        ...(record.status === "sent"
            ? [
                  {
                      key: "paid",
                      icon: <CheckCircleOutlined />,
                      label: "Als bezahlt markieren",
                      onClick: () => handleStatusChange(record.id!, "paid"),
                  },
              ]
            : []),
        { type: "divider" },
        {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Löschen",
            danger: true,
            onClick: () => handleDelete(record.id!),
        },
    ];

    const columns: TableProps<InvoiceWithClient>["columns"] = [
        {
            title: "Rechnungsnr.",
            dataIndex: "invoice_number",
            key: "invoice_number",
            sorter: (a, b) => a.invoice_number.localeCompare(b.invoice_number),
        },
        {
            title: "Kunde",
            dataIndex: ["client", "name"],
            key: "client",
            render: (_, record) => record.client?.name || "—",
        },
        {
            title: "Datum",
            dataIndex: "issue_date",
            key: "issue_date",
            render: (date) => formatDateGerman(date),
            sorter: (a, b) =>
                new Date(a.issue_date).getTime() -
                new Date(b.issue_date).getTime(),
        },
        {
            title: "Betrag",
            dataIndex: "total_gross",
            key: "total_gross",
            render: (amount) => formatCurrency(amount),
            sorter: (a, b) => a.total_gross - b.total_gross,
            align: "right",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
            ),
            filters: [
                { text: "Entwurf", value: "draft" },
                { text: "Versendet", value: "sent" },
                { text: "Bezahlt", value: "paid" },
                { text: "Storniert", value: "cancelled" },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: "",
            key: "actions",
            width: 50,
            render: (_, record) => (
                <Dropdown
                    menu={{ items: getActionMenu(record) }}
                    trigger={["click"]}
                >
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <div>
            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Gesamt" value={stats?.total ?? 0} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title="Offen"
                            value={stats?.unpaidAmount ?? 0}
                            precision={2}
                            suffix="€"
                            styles={{ content: { color: "#fa8c16" } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title="Bezahlt"
                            value={stats?.paidAmount ?? 0}
                            precision={2}
                            suffix="€"
                            styles={{ content: { color: "#52c41a" } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Entwürfe" value={stats?.draft ?? 0} />
                    </Card>
                </Col>
            </Row>

            {/* Toolbar */}
            <div
                style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                }}
            >
                <Input
                    placeholder="Suchen..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/dashboard/invoices/create")}
                >
                    Neue Rechnung
                </Button>
            </div>

            {/* Table */}
            <Table
                columns={columns}
                dataSource={filteredInvoices}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} von ${total} Rechnungen`,
                }}
                onRow={(record) => ({
                    onClick: () =>
                        router.push(`/dashboard/invoices/${record.id}`),
                    style: { cursor: "pointer" },
                })}
            />
        </div>
    );
}
