"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    Button,
    Input,
    Space,
    Modal,
    Form,
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
import { useClientStore } from "@/store";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Client, ClientFormData } from "@/types";

const { Title } = Typography;

export default function ClientsPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [searchText, setSearchText] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Zustand store
    const {
        clients,
        loading,
        fetchClients,
        addClient,
        editClient,
        removeClient,
    } = useClientStore();

    // Filter clients based on search
    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchText.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchText.toLowerCase()) ||
            client.city?.toLowerCase().includes(searchText.toLowerCase())
    );

    useEffect(() => {
        fetchClients();
    }, []);

    const openCreateModal = () => {
        setEditingClient(null);
        form.resetFields();
        form.setFieldsValue({ country: "Deutschland" });
        setModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        form.setFieldsValue(client);
        setModalOpen(true);
    };

    const handleSubmit = async (values: ClientFormData) => {
        setSubmitting(true);
        try {
            if (editingClient) {
                await editClient(editingClient.id!, values);
                message.success(t("clients.updated"));
            } else {
                await addClient(values);
                message.success(t("clients.created"));
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving client:", error);
            message.error(t("clients.saveError"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await removeClient(id);
            message.success(t("clients.deleted"));
        } catch (error) {
            console.error("Error deleting client:", error);
            message.error(t("clients.deleteError"));
        }
    };

    const columns: TableProps<Client>["columns"] = [
        {
            title: t("clients.name"),
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: t("clients.contactPerson"),
            dataIndex: "contact_person",
            key: "contact_person",
            responsive: ["md"],
        },
        {
            title: t("clients.city"),
            dataIndex: "city",
            key: "city",
            responsive: ["sm"],
        },
        {
            title: t("clients.email"),
            dataIndex: "email",
            key: "email",
            responsive: ["lg"],
        },
        {
            title: t("clients.phone"),
            dataIndex: "phone",
            key: "phone",
            responsive: ["xl"],
        },
        {
            title: t("clients.actions"),
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(record);
                        }}
                    />
                    <Popconfirm
                        title={t("clients.deleteConfirm")}
                        description={t("clients.deleteDesc")}
                        onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDelete(record.id!);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText={t("clients.delete")}
                        cancelText={t("clients.cancel")}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={4}>{t("clients.title")}</Title>

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
                    placeholder={t("clients.search")}
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
                    {t("clients.new")}
                </Button>
            </div>

            {/* Table */}
            <Table
                columns={columns}
                dataSource={filteredClients}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                        t("clients.pagination")
                            .replace("{0}", String(range[0]))
                            .replace("{1}", String(range[1]))
                            .replace("{2}", String(total)),
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={
                    editingClient
                        ? t("clients.editTitle")
                        : t("clients.newTitle")
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="name"
                        label={t("clients.companyName")}
                        rules={[
                            { required: true, message: t("clients.required") },
                        ]}
                    >
                        <Input placeholder={t("clients.companyName")} />
                    </Form.Item>

                    <Form.Item
                        name="contact_person"
                        label={t("clients.contactPerson")}
                    >
                        <Input placeholder={t("clients.contactPerson")} />
                    </Form.Item>

                    <Form.Item
                        name="address_line1"
                        label={t("clients.address")}
                        rules={[
                            { required: true, message: t("clients.required") },
                        ]}
                    >
                        <Input placeholder={t("clients.streetNumber")} />
                    </Form.Item>

                    <Form.Item
                        name="address_line2"
                        label={t("clients.addressExtra")}
                    >
                        <Input placeholder={t("clients.addressExtra")} />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="postal_code"
                            label={t("clients.postalCode")}
                            rules={[
                                {
                                    required: true,
                                    message: t("clients.required"),
                                },
                            ]}
                            style={{ width: 120 }}
                        >
                            <Input placeholder={t("clients.postalCode")} />
                        </Form.Item>

                        <Form.Item
                            name="city"
                            label={t("clients.city")}
                            rules={[
                                {
                                    required: true,
                                    message: t("clients.required"),
                                },
                            ]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder={t("clients.city")} />
                        </Form.Item>
                    </Space>

                    <Form.Item name="country" label={t("clients.country")}>
                        <Input placeholder={t("clients.country")} />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="email"
                            label={t("clients.email")}
                            style={{ flex: 1 }}
                        >
                            <Input
                                placeholder="email@example.com"
                                type="email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label={t("clients.phone")}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="+49 123 456789" />
                        </Form.Item>
                    </Space>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="vat_id"
                            label={t("clients.vatId")}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="DE123456789" />
                        </Form.Item>

                        <Form.Item
                            name="tax_number"
                            label={t("clients.taxNumber")}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="12/345/67890" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="leitweg_id" label={t("clients.leitwegId")}>
                        <Input placeholder={t("clients.leitwegPlaceholder")} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                        <Space>
                            <Button onClick={() => setModalOpen(false)}>
                                {t("clients.cancel")}
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                            >
                                {editingClient
                                    ? t("clients.save")
                                    : t("clients.create")}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
