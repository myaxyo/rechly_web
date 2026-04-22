"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    Form,
    Input,
    Button,
    Space,
    message,
    Typography,
    Divider,
    Select,
    InputNumber,
    Table,
    DatePicker,
    Steps,
    Result,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckOutlined,
    FileTextOutlined,
    RobotOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getAllClients } from "@/lib/clientService";
import { getAllProducts } from "@/lib/productService";
import { createInvoice } from "@/lib/invoiceService";
import { getCompanyInfo } from "@/lib/companyService";
import { runInvoiceAssistant } from "@/lib/aiService";
import {
    formatCurrency,
    calculateInvoiceTotals,
    type InvoiceTotals,
} from "@/lib/currencyUtils";
import type {
    Client,
    Product,
    InvoiceFormData,
    InvoiceItemFormData,
    UserCompany,
} from "@/types";

const { Title, Text } = Typography;

interface LineItem {
    key: string;
    description: string;
    quantity: number;
    unit_of_measure: string;
    price: number;
    tax_rate_percent: number;
    discount_percent: number;
}

export default function InvoiceCreatePage() {
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [company, setCompany] = useState<UserCompany | null>(null);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(dayjs());
    const [dueDate, setDueDate] = useState(dayjs().add(14, "day"));
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("");
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [generatingPaymentTerms, setGeneratingPaymentTerms] = useState(false);

    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        loadData();
        generateInvoiceNumber();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clientsData, productsData, companyData] = await Promise.all([
                getAllClients(),
                getAllProducts(),
                getCompanyInfo(),
            ]);
            setClients(clientsData);
            setProducts(productsData);
            setCompany(companyData);
            setPaymentTerms(companyData?.payment_terms_default || "");
        } catch (error) {
            console.error("Error loading data:", error);
            message.error("Fehler beim Laden der Daten");
        } finally {
            setLoading(false);
        }
    };

    const generateInvoiceNumber = () => {
        const year = dayjs().format("YYYY");
        const month = dayjs().format("MM");
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
        setInvoiceNumber(`RE-${year}${month}-${random}`);
    };

    const addLineItem = () => {
        const newItem: LineItem = {
            key: Date.now().toString(),
            description: "",
            quantity: 1,
            unit_of_measure: "Stück",
            price: 0,
            tax_rate_percent: 19,
            discount_percent: 0,
        };
        setLineItems([...lineItems, newItem]);
    };

    const updateLineItem = (
        key: string,
        field: keyof LineItem,
        value: unknown,
    ) => {
        setLineItems(
            lineItems.map((item) => {
                if (item.key === key) {
                    return { ...item, [field]: value };
                }
                return item;
            }),
        );
    };

    const removeLineItem = (key: string) => {
        setLineItems(lineItems.filter((item) => item.key !== key));
    };

    const addProductAsLineItem = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const newItem: LineItem = {
            key: Date.now().toString(),
            description: product.name,
            quantity: 1,
            unit_of_measure: product.unit_of_measure || "Stück",
            price: product.price,
            tax_rate_percent: product.tax_rate_percent || 19,
            discount_percent: 0,
        };
        setLineItems([...lineItems, newItem]);
    };

    const totals: InvoiceTotals = calculateInvoiceTotals(
        lineItems.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            tax_rate_percent: item.tax_rate_percent,
            discount_percent: item.discount_percent,
        })),
    );

    const handleCreateInvoice = async () => {
        if (!selectedClient || !selectedClient.id) {
            message.error("Bitte wählen Sie einen Kunden aus");
            return;
        }
        if (lineItems.length === 0) {
            message.error("Bitte fügen Sie mindestens eine Position hinzu");
            return;
        }

        setSaving(true);
        try {
            const items: InvoiceItemFormData[] = lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit_of_measure: item.unit_of_measure,
                price: item.price,
                tax_rate_percent: item.tax_rate_percent,
                discount_percent: item.discount_percent,
            }));

            const invoiceData: InvoiceFormData = {
                client_id: selectedClient.id,
                invoice_number: invoiceNumber,
                issue_date: invoiceDate.format("YYYY-MM-DD"),
                due_date: dueDate.format("YYYY-MM-DD"),
                notes: notes || undefined,
                payment_terms: paymentTerms || undefined,
                items,
            };

            const newInvoiceId = await createInvoice(invoiceData);

            setCreatedInvoiceId(newInvoiceId);
            setCurrentStep(3);
            message.success("Rechnung erstellt");
        } catch (error) {
            console.error("Error creating invoice:", error);
            message.error("Fehler beim Erstellen der Rechnung");
        } finally {
            setSaving(false);
        }
    };

    const buildAssistantPayload = () => ({
        companyName: company?.name,
        clientName: selectedClient?.name,
        clientEmail: selectedClient?.email,
        invoiceNumber,
        issueDate: invoiceDate.format("YYYY-MM-DD"),
        dueDate: dueDate.format("YYYY-MM-DD"),
        totalGross: totals.totalGross,
        currency: "EUR",
        notes: notes || undefined,
        paymentTerms: paymentTerms || undefined,
        lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_of_measure: item.unit_of_measure,
            price: item.price,
        })),
    });

    const handleGenerateNotes = async () => {
        if (!selectedClient) {
            message.warning("Bitte zuerst einen Kunden auswählen");
            return;
        }

        setGeneratingNotes(true);
        try {
            const result = await runInvoiceAssistant({
                action: "invoice_note",
                ...buildAssistantPayload(),
            });
            setNotes(result.content);
            message.success("Notizen mit KI erstellt");
        } catch (error) {
            console.error("Error generating invoice notes:", error);
            message.error(
                error instanceof Error
                    ? error.message
                    : "KI-Notizen konnten nicht erstellt werden",
            );
        } finally {
            setGeneratingNotes(false);
        }
    };

    const handleGeneratePaymentTerms = async () => {
        if (!selectedClient) {
            message.warning("Bitte zuerst einen Kunden auswählen");
            return;
        }

        setGeneratingPaymentTerms(true);
        try {
            const result = await runInvoiceAssistant({
                action: "payment_terms",
                ...buildAssistantPayload(),
            });
            setPaymentTerms(result.content);
            message.success("Zahlungsbedingungen mit KI erstellt");
        } catch (error) {
            console.error("Error generating payment terms:", error);
            message.error(
                error instanceof Error
                    ? error.message
                    : "KI-Zahlungsbedingungen konnten nicht erstellt werden",
            );
        } finally {
            setGeneratingPaymentTerms(false);
        }
    };

    const columns = [
        {
            title: "Beschreibung",
            dataIndex: "description",
            key: "description",
            render: (_: unknown, record: LineItem) => (
                <Input
                    value={record.description}
                    onChange={(e) =>
                        updateLineItem(
                            record.key,
                            "description",
                            e.target.value,
                        )
                    }
                    placeholder="Beschreibung"
                />
            ),
        },
        {
            title: "Menge",
            dataIndex: "quantity",
            key: "quantity",
            width: 100,
            render: (_: unknown, record: LineItem) => (
                <InputNumber
                    value={record.quantity}
                    min={0}
                    onChange={(val) =>
                        updateLineItem(record.key, "quantity", val || 0)
                    }
                    style={{ width: "100%" }}
                />
            ),
        },
        {
            title: "Einheit",
            dataIndex: "unit_of_measure",
            key: "unit_of_measure",
            width: 100,
            render: (_: unknown, record: LineItem) => (
                <Select
                    value={record.unit_of_measure}
                    onChange={(val) =>
                        updateLineItem(record.key, "unit_of_measure", val)
                    }
                    style={{ width: "100%" }}
                    options={[
                        { value: "Stück", label: "Stück" },
                        { value: "Stunde", label: "Stunde" },
                        { value: "Tag", label: "Tag" },
                        { value: "Monat", label: "Monat" },
                        { value: "Pauschal", label: "Pauschal" },
                        { value: "m²", label: "m²" },
                        { value: "kg", label: "kg" },
                    ]}
                />
            ),
        },
        {
            title: "Einzelpreis",
            dataIndex: "price",
            key: "price",
            width: 120,
            render: (_: unknown, record: LineItem) => (
                <Space.Compact style={{ width: "100%" }}>
                    <InputNumber
                        value={record.price}
                        min={0}
                        step={0.01}
                        precision={2}
                        onChange={(val) =>
                            updateLineItem(record.key, "price", val || 0)
                        }
                        style={{ width: "100%" }}
                    />
                    <Button disabled style={{ pointerEvents: "none" }}>
                        €
                    </Button>
                </Space.Compact>
            ),
        },
        {
            title: "MwSt.",
            dataIndex: "tax_rate_percent",
            key: "tax_rate_percent",
            width: 100,
            render: (_: unknown, record: LineItem) => (
                <Select
                    value={record.tax_rate_percent}
                    onChange={(val) =>
                        updateLineItem(record.key, "tax_rate_percent", val)
                    }
                    style={{ width: "100%" }}
                    options={[
                        { value: 0, label: "0%" },
                        { value: 7, label: "7%" },
                        { value: 19, label: "19%" },
                    ]}
                />
            ),
        },
        {
            title: "Gesamt",
            key: "line_total",
            width: 100,
            render: (_: unknown, record: LineItem) => {
                const lineTotal = record.quantity * record.price;
                return <Text strong>{formatCurrency(lineTotal)}</Text>;
            },
        },
        {
            title: "",
            key: "actions",
            width: 50,
            render: (_: unknown, record: LineItem) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeLineItem(record.key)}
                />
            ),
        },
    ];

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Card title="Kunde auswählen">
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder="Kunde suchen..."
                            optionFilterProp="label"
                            value={selectedClient?.id}
                            onChange={(value) => {
                                const client = clients.find(
                                    (c) => c.id === value,
                                );
                                setSelectedClient(client || null);
                            }}
                            options={clients.map((c) => ({
                                value: c.id,
                                label: `${c.name} ${
                                    c.contact_person
                                        ? `(${c.contact_person})`
                                        : ""
                                }`,
                            }))}
                            size="large"
                        />
                        {selectedClient && (
                            <Card size="small" style={{ marginTop: 16 }}>
                                <Title level={5}>{selectedClient.name}</Title>
                                {selectedClient.contact_person && (
                                    <Text>{selectedClient.contact_person}</Text>
                                )}
                                <br />
                                <Text type="secondary">
                                    {selectedClient.address_line1}
                                    <br />
                                    {selectedClient.postal_code}{" "}
                                    {selectedClient.city}
                                </Text>
                                <br />
                                <Text type="secondary">
                                    {selectedClient.email}
                                </Text>
                            </Card>
                        )}
                    </Card>
                );

            case 1:
                return (
                    <Card title="Positionen hinzufügen">
                        <Space style={{ marginBottom: 16 }}>
                            <Select
                                style={{ width: 300 }}
                                placeholder="Produkt hinzufügen..."
                                onChange={addProductAsLineItem}
                                value={undefined}
                                options={products.map((p) => ({
                                    value: p.id,
                                    label: `${p.name} - ${formatCurrency(
                                        p.price,
                                    )}`,
                                }))}
                            />
                            <Button
                                icon={<PlusOutlined />}
                                onClick={addLineItem}
                            >
                                Freie Position
                            </Button>
                        </Space>

                        <Table
                            columns={columns}
                            dataSource={lineItems}
                            pagination={false}
                            rowKey="key"
                            locale={{ emptyText: "Keine Positionen" }}
                        />

                        <Divider />

                        <div style={{ textAlign: "right" }}>
                            <Space direction="vertical" align="end">
                                <Text>
                                    Zwischensumme:{" "}
                                    <Text strong>
                                        {formatCurrency(
                                            totals.netAfterDiscount,
                                        )}
                                    </Text>
                                </Text>
                                <Text>
                                    MwSt.:{" "}
                                    <Text strong>
                                        {formatCurrency(totals.totalVAT)}
                                    </Text>
                                </Text>
                                <Title level={4} style={{ margin: 0 }}>
                                    Gesamt: {formatCurrency(totals.totalGross)}
                                </Title>
                            </Space>
                        </div>
                    </Card>
                );

            case 2:
                return (
                    <Card title="Rechnungsdetails">
                        <Form layout="vertical">
                            <Space style={{ width: "100%" }}>
                                <Form.Item
                                    label="Rechnungsnummer"
                                    style={{ flex: 1 }}
                                >
                                    <Input
                                        value={invoiceNumber}
                                        onChange={(e) =>
                                            setInvoiceNumber(e.target.value)
                                        }
                                    />
                                </Form.Item>
                            </Space>

                            <Space style={{ width: "100%" }}>
                                <Form.Item
                                    label="Rechnungsdatum"
                                    style={{ flex: 1 }}
                                >
                                    <DatePicker
                                        value={invoiceDate}
                                        onChange={(date) =>
                                            date && setInvoiceDate(date)
                                        }
                                        format="DD.MM.YYYY"
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Fälligkeitsdatum"
                                    style={{ flex: 1 }}
                                >
                                    <DatePicker
                                        value={dueDate}
                                        onChange={(date) =>
                                            date && setDueDate(date)
                                        }
                                        format="DD.MM.YYYY"
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Space>

                            <Form.Item label="Notizen (optional)">
                                <Space style={{ marginBottom: 8 }}>
                                    <Button
                                        icon={<RobotOutlined />}
                                        loading={generatingNotes}
                                        onClick={handleGenerateNotes}
                                    >
                                        Mit KI generieren
                                    </Button>
                                </Space>
                                <Input.TextArea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Zusätzliche Hinweise für diese Rechnung..."
                                />
                            </Form.Item>

                            <Form.Item label="Zahlungsbedingungen (optional)">
                                <Space style={{ marginBottom: 8 }}>
                                    <Button
                                        icon={<RobotOutlined />}
                                        loading={generatingPaymentTerms}
                                        onClick={handleGeneratePaymentTerms}
                                    >
                                        Mit KI generieren
                                    </Button>
                                    {company?.payment_terms_default ? (
                                        <Button
                                            onClick={() =>
                                                setPaymentTerms(
                                                    company.payment_terms_default,
                                                )
                                            }
                                        >
                                            Standard wiederherstellen
                                        </Button>
                                    ) : null}
                                </Space>
                                <Input.TextArea
                                    value={paymentTerms}
                                    onChange={(e) =>
                                        setPaymentTerms(e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Zum Beispiel: Bitte zahlen Sie innerhalb von 14 Tagen ohne Abzug."
                                />
                            </Form.Item>
                        </Form>

                        <Divider>Zusammenfassung</Divider>

                        <Card size="small" style={{ background: "#f5f5f5" }}>
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                <div>
                                    <Text type="secondary">Kunde:</Text>
                                    <br />
                                    <Text strong>{selectedClient?.name}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">Positionen:</Text>
                                    <br />
                                    <Text strong>{lineItems.length}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">Gesamtbetrag:</Text>
                                    <br />
                                    <Title level={4} style={{ margin: 0 }}>
                                        {formatCurrency(totals.totalGross)}
                                    </Title>
                                </div>
                            </Space>
                        </Card>
                    </Card>
                );

            case 3:
                return (
                    <Result
                        status="success"
                        icon={<FileTextOutlined style={{ color: "#1976d2" }} />}
                        title="Rechnung erstellt!"
                        subTitle={`Rechnungsnummer: ${invoiceNumber}`}
                        extra={[
                            <Button
                                type="primary"
                                key="view"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/invoices/${createdInvoiceId}`,
                                    )
                                }
                            >
                                Rechnung ansehen
                            </Button>,
                            <Button
                                key="pdf"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/invoices/${createdInvoiceId}/pdf`,
                                    )
                                }
                            >
                                PDF erstellen
                            </Button>,
                            <Button
                                key="new"
                                onClick={() => window.location.reload()}
                            >
                                Neue Rechnung
                            </Button>,
                        ]}
                    />
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return !!selectedClient;
            case 1:
                return lineItems.length > 0;
            case 2:
                return !!invoiceNumber;
            default:
                return true;
        }
    };

    if (loading) {
        return <Card loading />;
    }

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/dashboard/invoices")}
                >
                    Zurück
                </Button>
                <Title level={4} style={{ margin: 0 }}>
                    Neue Rechnung erstellen
                </Title>
            </Space>

            <Steps
                current={currentStep}
                style={{ marginBottom: 24 }}
                items={[
                    { title: "Kunde" },
                    { title: "Positionen" },
                    { title: "Details" },
                    { title: "Fertig" },
                ]}
            />

            {renderStepContent()}

            {currentStep < 3 && (
                <div style={{ marginTop: 24, textAlign: "right" }}>
                    <Space>
                        {currentStep > 0 && (
                            <Button
                                onClick={() => setCurrentStep(currentStep - 1)}
                            >
                                <ArrowLeftOutlined /> Zurück
                            </Button>
                        )}
                        {currentStep < 2 && (
                            <Button
                                type="primary"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!canProceed()}
                            >
                                Weiter <ArrowRightOutlined />
                            </Button>
                        )}
                        {currentStep === 2 && (
                            <Button
                                type="primary"
                                onClick={handleCreateInvoice}
                                loading={saving}
                                disabled={!canProceed()}
                            >
                                <CheckOutlined /> Rechnung erstellen
                            </Button>
                        )}
                    </Space>
                </div>
            )}
        </div>
    );
}
