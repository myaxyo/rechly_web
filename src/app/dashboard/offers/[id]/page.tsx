"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    Button,
    Space,
    Tag,
    Typography,
    Descriptions,
    Table,
    Modal,
    message,
    Divider,
    Row,
    Col,
} from "antd";
import {
    ArrowLeftOutlined,
    SwapOutlined,
    CheckOutlined,
    CloseOutlined,
    SendOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    getOfferById,
    updateOfferStatus,
    deleteOffer,
    convertOfferToInvoice,
} from "@/lib/offerService";
import { formatCurrency } from "@/lib/currencyUtils";
import type { OfferWithDetails, OfferStatus } from "@/types";

const { Title, Text } = Typography;

const statusColorMap: Record<OfferStatus, string> = {
    draft: "default",
    sent: "blue",
    accepted: "success",
    rejected: "error",
    expired: "warning",
    converted: "purple",
};

export default function OfferDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useLanguage();

    const [offer, setOffer] = useState<OfferWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        loadOffer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadOffer = async () => {
        setLoading(true);
        try {
            const data = await getOfferById(id);
            setOffer(data);
        } catch {
            message.error(t("offers.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: OfferStatus) => {
        if (!offer) return;
        try {
            await updateOfferStatus(offer.id!, status);
            setOffer({ ...offer, status });
            message.success(t("offers.statusUpdated"));
        } catch {
            message.error(t("offers.updateError"));
        }
    };

    const handleConvert = () => {
        Modal.confirm({
            title: t("offerDetail.convertTitle"),
            content: t("offerDetail.convertDesc"),
            okText: t("offerDetail.confirm"),
            cancelText: t("offers.cancel"),
            onOk: async () => {
                setConverting(true);
                try {
                    const invoiceId = await convertOfferToInvoice(offer!.id!);
                    message.success(t("offers.converted"));
                    router.push(`/dashboard/invoices/${invoiceId}`);
                } catch {
                    message.error(t("offers.convertError"));
                } finally {
                    setConverting(false);
                }
            },
        });
    };

    const handleDelete = () => {
        Modal.confirm({
            title: t("offers.deleteConfirm"),
            content: t("offers.deleteDesc"),
            okText: t("offers.delete"),
            okType: "danger",
            cancelText: t("offers.cancel"),
            onOk: async () => {
                try {
                    await deleteOffer(offer!.id!);
                    message.success(t("offers.deleted"));
                    router.push("/dashboard/offers");
                } catch {
                    message.error(t("offers.deleteError"));
                }
            },
        });
    };

    if (loading) return <Card loading />;
    if (!offer)
        return (
            <Card>
                <Text>{t("offers.loadError")}</Text>
            </Card>
        );

    const canConvert = offer.status === "accepted" || offer.status === "sent";

    const itemColumns = [
        {
            title: t("invoiceCreate.description"),
            dataIndex: "description",
            key: "description",
        },
        {
            title: t("invoiceCreate.quantity"),
            dataIndex: "quantity",
            key: "quantity",
            width: 80,
            align: "right" as const,
        },
        {
            title: t("invoiceCreate.unitPrice"),
            key: "price",
            width: 120,
            align: "right" as const,
            render: (_: unknown, r: { price: number }) =>
                formatCurrency(r.price),
        },
        {
            title: "MwSt.",
            dataIndex: "tax_rate_percent",
            key: "vat",
            width: 70,
            align: "right" as const,
            render: (v: number) => `${v}%`,
        },
        {
            title: t("invoiceCreate.lineTotal"),
            key: "total",
            width: 120,
            align: "right" as const,
            render: (_: unknown, r: { total: number }) =>
                formatCurrency(r.total),
        },
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/dashboard/offers")}
                >
                    {t("offerDetail.backToOffers")}
                </Button>
            </Space>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={16}>
                    <Card
                        title={
                            <Space>
                                <Title level={5} style={{ margin: 0 }}>
                                    {offer.offer_number}
                                </Title>
                                <Tag color={statusColorMap[offer.status]}>
                                    {t(`status.${offer.status}`) ||
                                        offer.status}
                                </Tag>
                            </Space>
                        }
                        extra={
                            <Space wrap>
                                {offer.status === "draft" && (
                                    <Button
                                        icon={<SendOutlined />}
                                        onClick={() =>
                                            handleStatusUpdate("sent")
                                        }
                                    >
                                        {t("offers.markSent")}
                                    </Button>
                                )}
                                {(offer.status === "sent" ||
                                    offer.status === "draft") && (
                                    <Button
                                        icon={<CheckOutlined />}
                                        type="primary"
                                        ghost
                                        onClick={() =>
                                            handleStatusUpdate("accepted")
                                        }
                                    >
                                        {t("offers.markAccepted")}
                                    </Button>
                                )}
                                {offer.status === "sent" && (
                                    <Button
                                        icon={<CloseOutlined />}
                                        danger
                                        onClick={() =>
                                            handleStatusUpdate("rejected")
                                        }
                                    >
                                        {t("offers.markRejected")}
                                    </Button>
                                )}
                                {canConvert && (
                                    <Button
                                        type="primary"
                                        icon={<SwapOutlined />}
                                        loading={converting}
                                        onClick={handleConvert}
                                    >
                                        {t("offers.convertToInvoice")}
                                    </Button>
                                )}
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={handleDelete}
                                />
                            </Space>
                        }
                    >
                        <Descriptions
                            column={{ xs: 1, sm: 2 }}
                            bordered
                            size="small"
                        >
                            <Descriptions.Item label={t("offers.client")}>
                                {offer.client?.name || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("offers.date")}>
                                {offer.issue_date}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("offers.validUntil")}>
                                {offer.valid_until || "—"}
                            </Descriptions.Item>
                            {offer.purchase_order_ref && (
                                <Descriptions.Item label="Referenz">
                                    {offer.purchase_order_ref}
                                </Descriptions.Item>
                            )}
                            {offer.payment_terms && (
                                <Descriptions.Item
                                    label={t("offerCreate.paymentTerms")}
                                    span={2}
                                >
                                    {offer.payment_terms}
                                </Descriptions.Item>
                            )}
                            {offer.notes && (
                                <Descriptions.Item
                                    label={t("offerCreate.notes")}
                                    span={2}
                                >
                                    {offer.notes}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        <Divider>{t("offerDetail.positions")}</Divider>

                        <Table
                            dataSource={offer.items}
                            columns={itemColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />

                        <div style={{ textAlign: "right", marginTop: 16 }}>
                            <Space direction="vertical" align="end">
                                <Text>
                                    {t("invoiceCreate.subtotal")}:{" "}
                                    {formatCurrency(offer.subtotal)}
                                </Text>
                                <Text>
                                    MwSt.: {formatCurrency(offer.total_vat)}
                                </Text>
                                <Title level={5}>
                                    {t("invoiceCreate.total")}:{" "}
                                    {formatCurrency(offer.total_gross)}
                                </Title>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {offer.converted_invoice_id && (
                    <Col xs={24} md={8}>
                        <Card size="small">
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                <Text type="secondary">
                                    {t("status.converted")}
                                </Text>
                                <Button
                                    block
                                    type="link"
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/invoices/${offer.converted_invoice_id}`,
                                        )
                                    }
                                >
                                    {t("correction.viewDoc")}
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
}
