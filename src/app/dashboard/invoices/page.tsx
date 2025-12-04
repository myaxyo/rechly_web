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
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { InvoiceWithClient, Invoice } from "@/types";

const statusColors: Record<string, string> = {
    draft: "default",
    sent: "processing",
    paid: "success",
    cancelled: "error",
};

export default function InvoicesPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [searchText, setSearchText] = useState("");

    const statusLabels: Record<string, string> = {
        draft: t("status.draft"),
        sent: t("status.sent"),
        paid: t("status.paid"),
        cancelled: t("status.cancelled"),
    };

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
            title: t("invoices.deleteConfirm"),
            content: t("invoices.deleteDesc"),
            okText: t("invoices.delete"),
            okType: "danger",
            cancelText: t("invoices.cancel"),
            onOk: async () => {
                try {
                    await removeInvoice(id);
                    message.success(t("invoices.deleted"));
                } catch (error) {
                    console.error("Error deleting invoice:", error);
                    message.error(t("invoices.deleteError"));
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
            message.success(t("invoices.statusUpdated"));
        } catch (error) {
            console.error("Error updating status:", error);
            message.error(t("invoices.updateError"));
        }
    };

    const getActionMenu = (record: InvoiceWithClient): MenuProps["items"] => [
        {
            key: "view",
            icon: <EyeOutlined />,
            label: t("invoices.view"),
            onClick: () => router.push(`/dashboard/invoices/${record.id}`),
        },
        {
            key: "edit",
            icon: <EditOutlined />,
            label: t("invoices.edit"),
            onClick: () => router.push(`/dashboard/invoices/${record.id}/edit`),
        },
        {
            key: "pdf",
            icon: <FilePdfOutlined />,
            label: t("invoices.downloadPdf"),
            onClick: () => router.push(`/dashboard/invoices/${record.id}/pdf`),
        },
        { type: "divider" },
        ...(record.status === "draft"
            ? [
                  {
                      key: "send",
                      icon: <SendOutlined />,
                      label: t("invoices.markSent"),
                      onClick: () => handleStatusChange(record.id!, "sent"),
                  },
              ]
            : []),
        ...(record.status === "sent"
            ? [
                  {
                      key: "paid",
                      icon: <CheckCircleOutlined />,
                      label: t("invoices.markPaid"),
                      onClick: () => handleStatusChange(record.id!, "paid"),
                  },
              ]
            : []),
        { type: "divider" },
        {
            key: "delete",
            icon: <DeleteOutlined />,
            label: t("invoices.delete"),
            danger: true,
            onClick: () => handleDelete(record.id!),
        },
    ];

    const columns: TableProps<InvoiceWithClient>["columns"] = [
        {
            title: t("invoices.number"),
            dataIndex: "invoice_number",
            key: "invoice_number",
            sorter: (a, b) => a.invoice_number.localeCompare(b.invoice_number),
        },
        {
            title: t("invoices.client"),
            dataIndex: ["client", "name"],
            key: "client",
            render: (_, record) => record.client?.name || "—",
        },
        {
            title: t("invoices.date"),
            dataIndex: "issue_date",
            key: "issue_date",
            render: (date) => formatDateGerman(date),
            sorter: (a, b) =>
                new Date(a.issue_date).getTime() -
                new Date(b.issue_date).getTime(),
        },
        {
            title: t("invoices.amount"),
            dataIndex: "total_gross",
            key: "total_gross",
            render: (amount) => formatCurrency(amount),
            sorter: (a, b) => a.total_gross - b.total_gross,
            align: "right",
        },
        {
            title: t("invoices.status"),
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
            ),
            filters: [
                { text: t("status.draft"), value: "draft" },
                { text: t("status.sent"), value: "sent" },
                { text: t("status.paid"), value: "paid" },
                { text: t("status.cancelled"), value: "cancelled" },
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
                        <Statistic
                            title={t("invoices.total")}
                            value={stats?.total ?? 0}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title={t("invoices.open")}
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
                            title={t("status.paid")}
                            value={stats?.paidAmount ?? 0}
                            precision={2}
                            suffix="€"
                            styles={{ content: { color: "#52c41a" } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title={t("dashboard.drafts")}
                            value={stats?.draft ?? 0}
                        />
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
                    placeholder={t("invoices.search")}
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
                    {t("invoices.new")}
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
                        t("invoices.pagination")
                            .replace("{0}", String(range[0]))
                            .replace("{1}", String(range[1]))
                            .replace("{2}", String(total)),
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
