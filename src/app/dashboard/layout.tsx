"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Layout,
    Menu,
    Button,
    Dropdown,
    Avatar,
    Spin,
    theme,
    Alert,
} from "antd";
import {
    DashboardOutlined,
    FileTextOutlined,
    UserOutlined,
    ShoppingOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const { Header, Sider, Content } = Layout;

const menuItems = [
    {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Dashboard",
    },
    {
        key: "/dashboard/invoices",
        icon: <FileTextOutlined />,
        label: "Rechnungen",
    },
    {
        key: "/dashboard/clients",
        icon: <UserOutlined />,
        label: "Kunden",
    },
    {
        key: "/dashboard/products",
        icon: <ShoppingOutlined />,
        label: "Produkte",
    },
    {
        key: "/dashboard/settings",
        icon: <SettingOutlined />,
        label: "Einstellungen",
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, logout, isAnonymous } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setCollapsed(true);
            }
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const userMenuItems = [
        {
            key: "profile",
            label: user?.email || "Gast",
            disabled: true,
        },
        {
            type: "divider" as const,
        },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Abmelden",
            onClick: handleLogout,
        },
    ];

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                breakpoint="lg"
                collapsedWidth={isMobile ? 0 : 80}
                style={{
                    overflow: "auto",
                    height: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <span
                        style={{
                            color: "#fff",
                            fontSize: collapsed ? 18 : 24,
                            fontWeight: "bold",
                        }}
                    >
                        {collapsed ? "R" : "Rechly"}
                    </span>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    onClick={({ key }) => router.push(key)}
                />
            </Sider>
            <Layout
                style={{
                    marginLeft: collapsed ? (isMobile ? 0 : 80) : 200,
                    transition: "margin-left 0.2s",
                }}
            >
                <Header
                    style={{
                        padding: "0 24px",
                        background: colorBgContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 99,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <Button
                        type="text"
                        icon={
                            collapsed ? (
                                <MenuUnfoldOutlined />
                            ) : (
                                <MenuFoldOutlined />
                            )
                        }
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: 16 }}
                    />
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                    >
                        <Avatar
                            style={{
                                backgroundColor: "#1976d2",
                                cursor: "pointer",
                            }}
                            icon={<UserOutlined />}
                        />
                    </Dropdown>
                </Header>
                {isAnonymous && (
                    <Alert
                        message="Gastmodus aktiv"
                        description={
                            <span>
                                Deine Daten werden gelöscht, wenn du den Tab
                                schließt.{" "}
                                <Link
                                    href="/register"
                                    style={{ fontWeight: 500 }}
                                >
                                    Jetzt registrieren
                                </Link>
                                , um deine Daten zu speichern.
                            </span>
                        }
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        style={{
                            margin: "16px 24px 0 24px",
                            borderRadius: 8,
                        }}
                    />
                )}
                <Content
                    style={{
                        margin: 24,
                        padding: 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        minHeight: isAnonymous
                            ? "calc(100vh - 180px)"
                            : "calc(100vh - 112px)",
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
