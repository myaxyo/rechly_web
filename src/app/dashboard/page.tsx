"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Row,
    Col,
    Card,
    Statistic,
    Typography,
    Tag,
    Button,
    Skeleton,
    Empty,
    Space,
    Flex,
} from "antd";
import {
    FileTextOutlined,
    UserOutlined,
    ShoppingOutlined,
    EuroOutlined,
    PlusOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { useInvoiceStore, useClientStore, useProductStore } from "@/store";
import { getCompanyInfo } from "@/lib/companyService";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { UserCompany } from "@/types";

const { Title, Text } = Typography;

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

export default function DashboardPage() {
    const router = useRouter();
    const [company, setCompany] = useState<UserCompany | null>(null);
    const [companyLoading, setCompanyLoading] = useState(true);

    // Zustand stores
    const {
        invoices,
        stats,
        loading: invoicesLoading,
        fetchInvoices,
        fetchStats,
    } = useInvoiceStore();
    const { clients, loading: clientsLoading, fetchClients } = useClientStore();
    const {
        products,
        loading: productsLoading,
        fetchProducts,
    } = useProductStore();

    const loading =
        invoicesLoading || clientsLoading || productsLoading || companyLoading;
    const recentInvoices = invoices.slice(0, 5);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setCompanyLoading(true);
            // Fetch all data in parallel using Zustand stores
            await Promise.all([
                fetchInvoices(),
                fetchStats(),
                fetchClients(),
                fetchProducts(),
                getCompanyInfo().then(setCompany),
            ]);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setCompanyLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Skeleton active paragraph={{ rows: 2 }} />
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Col xs={24} sm={12} lg={6} key={i}>
                            <Card>
                                <Skeleton active paragraph={{ rows: 1 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ marginBottom: 4 }}>
                    {company
                        ? `Willkommen, ${company.name}`
                        : "Willkommen bei Rechly"}
                </Title>
                <Text type="secondary">
                    Hier ist Ihre Geschäftsübersicht auf einen Blick
                </Text>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        onClick={() => router.push("/dashboard/invoices")}
                    >
                        <Statistic
                            title="Rechnungen"
                            value={stats?.total ?? 0}
                            prefix={
                                <FileTextOutlined
                                    style={{ color: "#1976d2" }}
                                />
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        onClick={() => router.push("/dashboard/clients")}
                    >
                        <Statistic
                            title="Kunden"
                            value={clients.length}
                            prefix={
                                <UserOutlined style={{ color: "#52c41a" }} />
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        hoverable
                        onClick={() => router.push("/dashboard/products")}
                    >
                        <Statistic
                            title="Produkte"
                            value={products.length}
                            prefix={
                                <ShoppingOutlined
                                    style={{ color: "#722ed1" }}
                                />
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Bezahlt"
                            value={stats?.paidAmount ?? 0}
                            precision={2}
                            prefix={
                                <EuroOutlined style={{ color: "#52c41a" }} />
                            }
                            suffix="€"
                            styles={{ content: { color: "#52c41a" } }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Revenue Summary */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card title="Umsatzübersicht">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="Offene Beträge"
                                    value={stats?.unpaidAmount ?? 0}
                                    precision={2}
                                    suffix="€"
                                    styles={{ content: { color: "#fa8c16" } }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Gesamt bezahlt"
                                    value={stats?.paidAmount ?? 0}
                                    precision={2}
                                    suffix="€"
                                    styles={{ content: { color: "#52c41a" } }}
                                />
                            </Col>
                        </Row>
                        <div style={{ marginTop: 16 }}>
                            <Row gutter={8}>
                                <Col>
                                    <Tag color="default">
                                        {stats?.draft ?? 0} Entwürfe
                                    </Tag>
                                </Col>
                                <Col>
                                    <Tag color="processing">
                                        {stats?.sent ?? 0} Versendet
                                    </Tag>
                                </Col>
                                <Col>
                                    <Tag color="success">
                                        {stats?.paid ?? 0} Bezahlt
                                    </Tag>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title="Schnellaktionen"
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    router.push("/dashboard/invoices/create")
                                }
                            >
                                Neue Rechnung
                            </Button>
                        }
                    >
                        <Row gutter={[8, 8]}>
                            <Col span={12}>
                                <Button
                                    block
                                    icon={<UserOutlined />}
                                    onClick={() =>
                                        router.push("/dashboard/clients")
                                    }
                                >
                                    Kunden verwalten
                                </Button>
                            </Col>
                            <Col span={12}>
                                <Button
                                    block
                                    icon={<ShoppingOutlined />}
                                    onClick={() =>
                                        router.push("/dashboard/products")
                                    }
                                >
                                    Produkte verwalten
                                </Button>
                            </Col>
                            <Col span={12}>
                                <Button
                                    block
                                    icon={<FileTextOutlined />}
                                    onClick={() =>
                                        router.push("/dashboard/invoices")
                                    }
                                >
                                    Alle Rechnungen
                                </Button>
                            </Col>
                            <Col span={12}>
                                <Button
                                    block
                                    onClick={() =>
                                        router.push("/dashboard/settings")
                                    }
                                >
                                    Einstellungen
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Recent Invoices */}
            <Card
                title="Letzte Rechnungen"
                style={{ marginTop: 16 }}
                extra={
                    <Button
                        type="link"
                        onClick={() => router.push("/dashboard/invoices")}
                    >
                        Alle anzeigen <ArrowRightOutlined />
                    </Button>
                }
            >
                {recentInvoices.length === 0 ? (
                    <Empty
                        description="Keine Rechnungen vorhanden"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button
                            type="primary"
                            onClick={() =>
                                router.push("/dashboard/invoices/create")
                            }
                        >
                            Erste Rechnung erstellen
                        </Button>
                    </Empty>
                ) : (
                    <Space orientation="vertical" style={{ width: "100%" }}>
                        {recentInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/invoices/${invoice.id}`
                                    )
                                }
                                style={{
                                    padding: "12px 0",
                                    borderBottom: "1px solid #f0f0f0",
                                    cursor: "pointer",
                                }}
                            >
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    wrap="wrap"
                                    gap={8}
                                >
                                    <div>
                                        <Text strong>
                                            {invoice.invoice_number}
                                        </Text>
                                        <br />
                                        <Text type="secondary">
                                            {invoice.client?.name ||
                                                "Unbekannter Kunde"}{" "}
                                            •{" "}
                                            {formatDateGerman(
                                                invoice.issue_date
                                            )}
                                        </Text>
                                    </div>
                                    <Space>
                                        <Tag
                                            color={statusColors[invoice.status]}
                                        >
                                            {statusLabels[invoice.status]}
                                        </Tag>
                                        <Text strong>
                                            {formatCurrency(
                                                invoice.total_gross
                                            )}
                                        </Text>
                                    </Space>
                                </Flex>
                            </div>
                        ))}
                    </Space>
                )}
            </Card>
        </div>
    );
}
