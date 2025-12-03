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
import type { Client, ClientFormData } from "@/types";

const { Title } = Typography;

export default function ClientsPage() {
    const router = useRouter();
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
                message.success("Kunde aktualisiert");
            } else {
                await addClient(values);
                message.success("Kunde erstellt");
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving client:", error);
            message.error("Fehler beim Speichern");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await removeClient(id);
            message.success("Kunde gelöscht");
        } catch (error) {
            console.error("Error deleting client:", error);
            message.error("Fehler beim Löschen");
        }
    };

    const columns: TableProps<Client>["columns"] = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Kontaktperson",
            dataIndex: "contact_person",
            key: "contact_person",
            responsive: ["md"],
        },
        {
            title: "Stadt",
            dataIndex: "city",
            key: "city",
            responsive: ["sm"],
        },
        {
            title: "E-Mail",
            dataIndex: "email",
            key: "email",
            responsive: ["lg"],
        },
        {
            title: "Telefon",
            dataIndex: "phone",
            key: "phone",
            responsive: ["xl"],
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
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(record);
                        }}
                    />
                    <Popconfirm
                        title="Kunde löschen?"
                        description="Diese Aktion kann nicht rückgängig gemacht werden."
                        onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDelete(record.id!);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="Löschen"
                        cancelText="Abbrechen"
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
            <Title level={4}>Kunden</Title>

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
                    Neuer Kunde
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
                        `${range[0]}-${range[1]} von ${total} Kunden`,
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={editingClient ? "Kunde bearbeiten" : "Neuer Kunde"}
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
                        label="Firmenname"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input placeholder="Firmenname" />
                    </Form.Item>

                    <Form.Item name="contact_person" label="Kontaktperson">
                        <Input placeholder="Ansprechpartner" />
                    </Form.Item>

                    <Form.Item
                        name="address_line1"
                        label="Adresse"
                        rules={[{ required: true, message: "Pflichtfeld" }]}
                    >
                        <Input placeholder="Straße und Hausnummer" />
                    </Form.Item>

                    <Form.Item name="address_line2" label="Adresszusatz">
                        <Input placeholder="Zusätzliche Adressangaben" />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="postal_code"
                            label="PLZ"
                            rules={[{ required: true, message: "Pflichtfeld" }]}
                            style={{ width: 120 }}
                        >
                            <Input placeholder="PLZ" />
                        </Form.Item>

                        <Form.Item
                            name="city"
                            label="Stadt"
                            rules={[{ required: true, message: "Pflichtfeld" }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Stadt" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="country" label="Land">
                        <Input placeholder="Land" />
                    </Form.Item>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="email"
                            label="E-Mail"
                            style={{ flex: 1 }}
                        >
                            <Input
                                placeholder="email@beispiel.de"
                                type="email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Telefon"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="+49 123 456789" />
                        </Form.Item>
                    </Space>

                    <Space style={{ width: "100%" }}>
                        <Form.Item
                            name="vat_id"
                            label="USt-IdNr."
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="DE123456789" />
                        </Form.Item>

                        <Form.Item
                            name="tax_number"
                            label="Steuernummer"
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="12/345/67890" />
                        </Form.Item>
                    </Space>

                    <Form.Item name="leitweg_id" label="Leitweg-ID">
                        <Input placeholder="Leitweg-ID für E-Rechnung" />
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
                                {editingClient ? "Speichern" : "Erstellen"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
