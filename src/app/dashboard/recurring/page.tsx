"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Switch,
    Typography,
    Row,
    Col,
    Statistic,
    Modal,
    message,
    Tooltip,
} from "antd";
import {
    PlusOutlined,
    PlayCircleOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRecurringStore } from "@/store/recurringStore";
import { generateNextInvoice } from "@/lib/recurringService";
import { formatCurrency } from "@/lib/currencyUtils";
import type { RecurringInvoiceWithDetails, RecurringInterval } from "@/types";

const { Title } = Typography;

const intervalColors: Record<RecurringInterval, string> = {
    weekly: "cyan",
    monthly: "blue",
    quarterly: "purple",
    annually: "gold",
};

export default function RecurringPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { templates, loading, fetchTemplates, toggleActive, removeTemplate } =
        useRecurringStore();
    const [generating, setGenerating] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleGenerate = async (id: string) => {
        setGenerating(id);
        try {
            const invoiceId = await generateNextInvoice(id);
            message.success(t("recurring.invoiceGenerated"));
            fetchTemplates(true);
            router.push(`/dashboard/invoices/${invoiceId}`);
        } catch {
            message.error(t("recurring.generateError"));
        } finally {
            setGenerating(null);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Modal.confirm({
            title: t("recurring.deleteConfirm"),
            content: `"${name}" ${t("recurring.deleteDesc")}`,
            okText: t("recurring.delete"),
            okType: "danger",
            cancelText: t("recurring.cancel"),
            onOk: async () => {
                try {
                    await removeTemplate(id);
                    message.success(t("recurring.deleted"));
                } catch {
                    message.error(t("recurring.deleteError"));
                }
            },
        });
    };

    const activeCount = templates.filter((t) => t.is_active).length;

    const columns: ColumnsType<RecurringInvoiceWithDetails> = [
        {
            title: t("recurring.name"),
            dataIndex: "template_name",
            key: "template_name",
        },
        {
            title: t("recurring.client"),
            key: "client",
            render: (_, r) => r.client?.name || "—",
        },
        {
            title: t("recurring.interval"),
            dataIndex: "interval",
            key: "interval",
            render: (val: RecurringInterval) => (
                <Tag color={intervalColors[val]}>
                    {t(`recurring.interval.${val}`) || val}
                </Tag>
            ),
        },
        {
            title: t("recurring.nextDue"),
            dataIndex: "next_due_date",
            key: "next_due_date",
            render: (val) => {
                if (!val) return "—";
                const isOverdue = dayjs(val).isBefore(dayjs(), "day");
                return (
                    <Tag color={isOverdue ? "warning" : "default"}>{val}</Tag>
                );
            },
        },
        {
            title: t("recurring.amount"),
            key: "amount",
            align: "right",
            render: (_, r) => formatCurrency(r.total_gross),
        },
        {
            title: t("recurring.active"),
            key: "active",
            render: (_, r) => (
                <Switch
                    checked={r.is_active}
                    onChange={(checked) => toggleActive(r.id!, checked)}
                    size="small"
                />
            ),
        },
        {
            key: "actions",
            align: "right",
            render: (_, r) => (
                <Space>
                    <Tooltip title={t("recurring.generate")}>
                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            size="small"
                            loading={generating === r.id}
                            onClick={() => handleGenerate(r.id!)}
                        />
                    </Tooltip>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDelete(r.id!, r.template_name)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>{t("recurring.title")}</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title={t("recurring.total")}
                            value={templates.length}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title={t("recurring.active")}
                            value={activeCount}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title={t("recurring.overdue")}
                            value={
                                templates.filter(
                                    (t) =>
                                        t.is_active &&
                                        dayjs(t.next_due_date).isBefore(
                                            dayjs(),
                                            "day",
                                        ),
                                ).length
                            }
                            valueStyle={{ color: "#faad14" }}
                        />
                    </Card>
                </Col>
            </Row>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 16,
                }}
            >
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/dashboard/recurring/create")}
                >
                    {t("recurring.new")}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={templates}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}
