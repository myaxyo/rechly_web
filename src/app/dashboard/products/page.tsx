"use client";

import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Input,
    Space,
    Modal,
    Form,
    InputNumber,
    Select,
    message,
    Popconfirm,
    Typography,
} from "antd";
import type { TableProps } from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useProductStore } from "@/store";
import { formatCurrency } from "@/lib/currencyUtils";
import type { Product, ProductFormData } from "@/types";

const { Title } = Typography;

const unitOptions = [
    { value: "Stück", label: "Stück" },
    { value: "Stunde", label: "Stunde" },
    { value: "Tag", label: "Tag" },
    { value: "Monat", label: "Monat" },
    { value: "Pauschal", label: "Pauschal" },
    { value: "kg", label: "kg" },
    { value: "m", label: "m" },
    { value: "m²", label: "m²" },
    { value: "Liter", label: "Liter" },
];

const taxRateOptions = [
    { value: 19, label: "19% (Standard)" },
    { value: 7, label: "7% (Ermäßigt)" },
    { value: 0, label: "0% (Steuerfrei)" },
];

export default function ProductsPage() {
    const [searchText, setSearchText] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Zustand store
    const {
        products,
        loading,
        fetchProducts,
        addProduct,
        editProduct,
        removeProduct,
    } = useProductStore();

    // Filter products based on search
    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchText.toLowerCase()) ||
            product.description
                ?.toLowerCase()
                .includes(searchText.toLowerCase())
    );

    useEffect(() => {
        fetchProducts();
    }, []);

    const openCreateModal = () => {
        setEditingProduct(null);
        form.resetFields();
        form.setFieldsValue({
            tax_rate_percent: 19,
            unit_of_measure: "Stück",
        });
        setModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        form.setFieldsValue(product);
        setModalOpen(true);
    };

    const handleSubmit = async (values: ProductFormData) => {
        setSubmitting(true);
        try {
            if (editingProduct) {
                await editProduct(editingProduct.id!, values);
                message.success("Produkt aktualisiert");
            } else {
                await addProduct(values);
                message.success("Produkt erstellt");
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            message.error("Fehler beim Speichern");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await removeProduct(id);
            message.success("Produkt gelöscht");
        } catch (error) {
            console.error("Error deleting product:", error);
            message.error("Fehler beim Löschen");
        }
    };

    const columns: TableProps<Product>["columns"] = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Beschreibung",
            dataIndex: "description",
            key: "description",
            responsive: ["md"],
            ellipsis: true,
        },
        {
            title: "Preis",
            dataIndex: "price",
            key: "price",
            render: (price) => formatCurrency(price),
            sorter: (a, b) => a.price - b.price,
            align: "right",
        },
        {
            title: "MwSt.",
            dataIndex: "tax_rate_percent",
            key: "tax_rate_percent",
            render: (rate) => `${rate}%`,
            responsive: ["sm"],
        },
        {
            title: "Einheit",
            dataIndex: "unit_of_measure",
            key: "unit_of_measure",
            responsive: ["lg"],
        },
        {
            title: "Aktionen",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    />
                    <Popconfirm
                        title="Produkt löschen?"
                        description="Diese Aktion kann nicht rückgängig gemacht werden."
                        onConfirm={() => handleDelete(record.id!)}
                        okText="Löschen"
                        cancelText="Abbrechen"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>Produkte & Dienstleistungen</Title>

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
                    onClick={openCreateModal}
                >
                    Neues Produkt
                </Button>
            </div>

            {/* Table */}
            <Table
                columns={columns}
                dataSource={filteredProducts}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} von ${total} Produkten`,
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={editingProduct ? "Produkt bearbeiten" : "Neues Produkt"}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input placeholder="Produktname" />
                    </Form.Item>

                    <Form.Item name="description" label="Beschreibung">
                        <Input.TextArea
                            placeholder="Beschreibung des Produkts oder der Dienstleistung"
                            rows={3}
                        />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="price"
                            label="Preis (€)"
                            rules={[{ required: true, message: "Pflichtfeld" }]}
                            style={{ flex: 1 }}
                        >
                            <InputNumber
                                placeholder="0.00"
                                min={0}
                                precision={2}
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        "."
                                    )
                                }
                                parser={(value) =>
                                    Number(
                                        value
                                            ?.replace(/\./g, "")
                                            .replace(",", ".")
                                    ) as unknown as 0
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            name="tax_rate_percent"
                            label="MwSt.-Satz"
                            rules={[{ required: true, message: "Pflichtfeld" }]}
                            style={{ width: 160 }}
                        >
                            <Select options={taxRateOptions} />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="unit_of_measure"
                        label="Einheit"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Select options={unitOptions} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                        <Space>
                            <Button onClick={() => setModalOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                            >
                                {editingProduct ? "Speichern" : "Erstellen"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
