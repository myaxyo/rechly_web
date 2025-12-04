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
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/currencyUtils";
import type { Product, ProductFormData } from "@/types";

const { Title } = Typography;

export default function ProductsPage() {
    const { t } = useLanguage();
    const [searchText, setSearchText] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const unitOptions = [
        { value: "Stück", label: t("products.unit.piece") },
        { value: "Stunde", label: t("products.unit.hour") },
        { value: "Tag", label: t("products.unit.day") },
        { value: "Monat", label: t("products.unit.month") },
        { value: "Pauschal", label: t("products.unit.flatRate") },
        { value: "kg", label: t("products.unit.kg") },
        { value: "m", label: t("products.unit.m") },
        { value: "m²", label: t("products.unit.sqm") },
        { value: "Liter", label: t("products.unit.liter") },
    ];

    const taxRateOptions = [
        { value: 19, label: t("products.vat.standard") },
        { value: 7, label: t("products.vat.reduced") },
        { value: 0, label: t("products.vat.exempt") },
    ];

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
                message.success(t("products.updated"));
            } else {
                await addProduct(values);
                message.success(t("products.created"));
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            message.error(t("products.saveError"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await removeProduct(id);
            message.success(t("products.deleted"));
        } catch (error) {
            console.error("Error deleting product:", error);
            message.error(t("products.deleteError"));
        }
    };

    const columns: TableProps<Product>["columns"] = [
        {
            title: t("products.name"),
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: t("products.description"),
            dataIndex: "description",
            key: "description",
            responsive: ["md"],
            ellipsis: true,
        },
        {
            title: t("products.price"),
            dataIndex: "price",
            key: "price",
            render: (price) => formatCurrency(price),
            sorter: (a, b) => a.price - b.price,
            align: "right",
        },
        {
            title: t("products.vat"),
            dataIndex: "tax_rate_percent",
            key: "tax_rate_percent",
            render: (rate) => `${rate}%`,
            responsive: ["sm"],
        },
        {
            title: t("products.unit"),
            dataIndex: "unit_of_measure",
            key: "unit_of_measure",
            responsive: ["lg"],
        },
        {
            title: t("products.actions"),
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
                        title={t("products.deleteConfirm")}
                        description={t("products.deleteDesc")}
                        onConfirm={() => handleDelete(record.id!)}
                        okText={t("products.delete")}
                        cancelText={t("products.cancel")}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>{t("products.title")}</Title>

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
                    placeholder={t("products.search")}
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
                    {t("products.new")}
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
                        t("products.pagination")
                            .replace("{0}", String(range[0]))
                            .replace("{1}", String(range[1]))
                            .replace("{2}", String(total)),
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={
                    editingProduct
                        ? t("products.editTitle")
                        : t("products.newTitle")
                }
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
                        label={t("products.name")}
                        rules={[
                            { required: true, message: t("products.required") },
                        ]}
                    >
                        <Input placeholder={t("products.productName")} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={t("products.description")}
                    >
                        <Input.TextArea
                            placeholder={t("products.descPlaceholder")}
                            rows={3}
                        />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="price"
                            label={t("products.priceLabel")}
                            rules={[
                                {
                                    required: true,
                                    message: t("products.required"),
                                },
                            ]}
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
                            label={t("products.vatRate")}
                            rules={[
                                {
                                    required: true,
                                    message: t("products.required"),
                                },
                            ]}
                            style={{ width: 160 }}
                        >
                            <Select options={taxRateOptions} />
                        </Form.Item>
                    </Space>

                    <Form.Item
                        name="unit_of_measure"
                        label={t("products.unit")}
                        rules={[
                            { required: true, message: t("products.required") },
                        ]}
                    >
                        <Select options={unitOptions} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                        <Space>
                            <Button onClick={() => setModalOpen(false)}>
                                {t("products.cancel")}
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                            >
                                {editingProduct
                                    ? t("products.save")
                                    : t("products.create")}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
