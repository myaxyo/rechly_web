"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    Table,
    Button,
    Input,
    Tag,
    Dropdown,
    message,
    Typography,
    Row,
    Col,
    Statistic,
    Modal,
} from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    MoreOutlined,
    EyeOutlined,
    CheckOutlined,
    CloseOutlined,
    SwapOutlined,
    DeleteOutlined,
    SendOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfferStore } from "@/store/offerStore";
import { formatCurrency } from "@/lib/currencyUtils";
import { convertOfferToInvoice } from "@/lib/offerService";
import type { OfferWithClient, OfferStatus } from "@/types";

const { Title } = Typography;

const statusColorMap: Record<OfferStatus, string> = {
    draft: "default",
    sent: "blue",
    accepted: "success",
    rejected: "error",
    expired: "warning",
    converted: "purple",
};

export default function OffersPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { offers, loading, fetchOffers, updateStatus, removeOffer } =
        useOfferStore();

    const [search, setSearch] = useState("");
    const [converting, setConverting] = useState<string | null>(null);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const filtered = offers.filter(
        (o) =>
            search === "" ||
            o.offer_number?.toLowerCase().includes(search.toLowerCase()) ||
            o.client?.name?.toLowerCase().includes(search.toLowerCase()),
    );

    const handleStatusUpdate = useCallback(
        async (id: string, status: OfferStatus) => {
            try {
                await updateStatus(id, status);
                message.success(t("offers.statusUpdated"));
            } catch {
                message.error(t("offers.updateError"));
            }
        },
        [updateStatus, t],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await removeOffer(id);
                message.success(t("offers.deleted"));
            } catch {
                message.error(t("offers.deleteError"));
            }
        },
        [removeOffer, t],
    );

    const handleConvert = useCallback(
        async (id: string) => {
            Modal.confirm({
                title: t("offerDetail.convertTitle"),
                content: t("offerDetail.convertDesc"),
                okText: t("offerDetail.confirm"),
                cancelText: t("offers.cancel"),
                onOk: async () => {
                    setConverting(id);
                    try {
                        const invoiceId = await convertOfferToInvoice(id);
                        message.success(t("offers.converted"));
                        fetchOffers(true);
                        router.push(`/dashboard/invoices/${invoiceId}`);
                    } catch {
                        message.error(t("offers.convertError"));
                    } finally {
                        setConverting(null);
                    }
                },
            });
        },
        [t, fetchOffers, router],
    );

    const totalOffers = offers.length;
    const sentOffers = offers.filter((o) => o.status === "sent").length;
    const acceptedOffers = offers.filter((o) => o.status === "accepted").length;
    const expiredOffers = offers.filter((o) => o.status === "expired").length;

    const columns: ColumnsType<OfferWithClient> = [
        {
            title: t("offers.number"),
            dataIndex: "offer_number",
            key: "offer_number",
            sorter: (a, b) => a.offer_number.localeCompare(b.offer_number),
        },
        {
            title: t("offers.client"),
            key: "client",
            render: (_, record) => record.client?.name || "—",
        },
        {
            title: t("offers.date"),
            dataIndex: "issue_date",
            key: "issue_date",
            sorter: (a, b) => a.issue_date.localeCompare(b.issue_date),
        },
        {
            title: t("offers.validUntil"),
            dataIndex: "valid_until",
            key: "valid_until",
            render: (val) => val || "—",
        },
        {
            title: t("offers.amount"),
            key: "amount",
            align: "right",
            render: (_, record) => formatCurrency(record.total_gross),
            sorter: (a, b) => a.total_gross - b.total_gross,
        },
        {
            title: t("offers.status"),
            key: "status",
            render: (_, record) => (
                <Tag color={statusColorMap[record.status]}>
                    {t(`status.${record.status}`) || record.status}
                </Tag>
            ),
        },
        {
            title: t("offers.actions"),
            key: "actions",
            align: "right",
            render: (_, record) => {
                const menuItems = [
                    {
                        key: "view",
                        icon: <EyeOutlined />,
                        label: t("offers.view"),
                        onClick: () =>
                            router.push(`/dashboard/offers/${record.id}`),
                    },
                    record.status === "draft" && {
                        key: "markSent",
                        icon: <SendOutlined />,
                        label: t("offers.markSent"),
                        onClick: () => handleStatusUpdate(record.id!, "sent"),
                    },
                    (record.status === "sent" || record.status === "draft") && {
                        key: "markAccepted",
                        icon: <CheckOutlined />,
                        label: t("offers.markAccepted"),
                        onClick: () =>
                            handleStatusUpdate(record.id!, "accepted"),
                    },
                    record.status === "sent" && {
                        key: "markRejected",
                        icon: <CloseOutlined />,
                        label: t("offers.markRejected"),
                        onClick: () =>
                            handleStatusUpdate(record.id!, "rejected"),
                    },
                    (record.status === "accepted" ||
                        record.status === "sent") && {
                        key: "convert",
                        icon: <SwapOutlined />,
                        label:
                            converting === record.id
                                ? t("offers.converting")
                                : t("offers.convertToInvoice"),
                        onClick: () => handleConvert(record.id!),
                        disabled: converting === record.id,
                    },
                    { type: "divider" as const },
                    {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: t("offers.delete"),
                        danger: true,
                        onClick: () =>
                            Modal.confirm({
                                title: t("offers.deleteConfirm"),
                                content: t("offers.deleteDesc"),
                                okText: t("offers.delete"),
                                okType: "danger",
                                cancelText: t("offers.cancel"),
                                onOk: () => handleDelete(record.id!),
                            }),
                    },
                ].filter(Boolean);

                return (
                    <Dropdown
                        menu={{ items: menuItems as [] }}
                        trigger={["click"]}
                    >
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <div>
            <Title level={4}>{t("offers.title")}</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title={t("offers.total")}
                            value={totalOffers}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title={t("offers.sent")}
                            value={sentOffers}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title={t("offers.accepted")}
                            value={acceptedOffers}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title={t("offers.expired")}
                            value={expiredOffers}
                            valueStyle={{ color: "#faad14" }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={16} md={12}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder={t("offers.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col
                    xs={24}
                    sm={8}
                    md={12}
                    style={{ display: "flex", justifyContent: "flex-end" }}
                >
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => router.push("/dashboard/offers/create")}
                    >
                        {t("offers.new")}
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={filtered}
                rowKey="id"
                loading={loading}
                onRow={(record) => ({
                    onClick: () =>
                        router.push(`/dashboard/offers/${record.id}`),
                    style: { cursor: "pointer" },
                })}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                        t("offers.pagination")
                            .replace("{0}", String(range[0]))
                            .replace("{1}", String(range[1]))
                            .replace("{2}", String(total)),
                }}
            />
        </div>
    );
}
