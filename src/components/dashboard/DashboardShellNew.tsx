"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ArrowLeftRight, Calculator, CalendarDays, CalendarClock, CircleHelp, Clock, FileText, FolderKanban,
    Landmark, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Repeat,
    Search, Settings, ShoppingBag, Star, Tags, Users, Wallet, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isDesktopRuntime } from "@/lib/runtime";
import { isTermineEnabled, isWorkspaceEnabled } from "@/lib/features";
import { getRepoUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TriangleAlert } from "lucide-react";
import WorkspaceActivity from "@/components/workspace/WorkspaceActivity";
import CommandPalette from "@/components/dashboard/CommandPalette";
import UpdateBanner from "@/components/dashboard/UpdateBanner";
import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmail";
import { AppearanceSelectNew } from "./DashboardAppearance";
import { BackToOldUiButton, NewUiBadge } from "./UiModeToggle";
import LanguageSelectNew from "./LanguageSelectNew";

interface NavItem { key: string; icon: ReactNode; label: string }
interface NavGroup { label: string; items: NavItem[] }

const pageTitles: Record<string, string> = {
    "/dashboard": "dashboard.home",
    "/dashboard/invoices": "dashboard.invoices",
    "/dashboard/offers": "dashboard.offers",
    "/dashboard/recurring": "dashboard.recurring",
    "/dashboard/clients": "dashboard.clients",
    "/dashboard/products": "dashboard.products",
    "/dashboard/expenses": "dashboard.expenses",
    "/dashboard/bank": "dashboard.bank",
    "/dashboard/reports": "dashboard.reports",
    "/dashboard/settings": "dashboard.settings",
    "/dashboard/migration": "dashboard.migration",
};

export default function DashboardShellNew({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, logout, isAnonymous } = useAuth();
    const { language, t } = useLanguage();
    const de = language === "de";
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [betaDismissed, setBetaDismissed] = useState(() => {
        try { return sessionStorage.getItem("rechly.new-ui-beta-dismissed") === "1"; } catch { return false; }
    });

    const workspaceEnabled = isWorkspaceEnabled();
    const termineEnabled = isTermineEnabled();

    const groups: NavGroup[] = [
        { label: "", items: [{ key: "/dashboard", icon: <LayoutDashboard />, label: t("dashboard.home") }] },
        ...((workspaceEnabled || termineEnabled)
            ? [{
                  label: de ? "Planung & Projekte" : "Scheduling & Projects",
                  items: [
                      { key: "/dashboard/calendar", icon: <CalendarDays />, label: de ? "Kalender & Termine" : "Calendar" },
                      ...(termineEnabled ? [{ key: "/dashboard/termine/buchungen", icon: <CalendarClock />, label: de ? "Buchungen & Zeiten" : "Bookings & Hours" }] : []),
                      ...(workspaceEnabled
                          ? [
                                { key: "/dashboard/workspace", icon: <FolderKanban />, label: de ? "Projekte & Aufgaben" : "Projects & Tasks" },
                                { key: "/dashboard/workspace/time", icon: <Clock />, label: de ? "Zeiterfassung" : "Time & Billing" },
                            ]
                          : []),
                  ],
              }]
            : []),
        {
            label: t("dashboard.navDocuments"),
            items: [
                { key: "/dashboard/offers", icon: <Tags />, label: t("dashboard.offers") },
                { key: "/dashboard/invoices", icon: <FileText />, label: t("dashboard.invoices") },
                { key: "/dashboard/recurring", icon: <Repeat />, label: t("dashboard.recurring") },
            ],
        },
        {
            label: t("dashboard.navAccounting"),
            items: [
                { key: "/dashboard/expenses", icon: <Wallet />, label: t("dashboard.expenses") },
                { key: "/dashboard/bank", icon: <Landmark />, label: t("dashboard.bank") },
                { key: "/dashboard/reports", icon: <Calculator />, label: de ? "Berichte & Controlling" : "Reports & Controlling" },
            ],
        },
        {
            label: de ? "Stammdaten & System" : "Contacts & Catalog",
            items: [
                { key: "/dashboard/clients", icon: <Users />, label: t("dashboard.clients") },
                { key: "/dashboard/products", icon: <ShoppingBag />, label: de ? "Produkte & Leistungen" : "Products & Services" },
                { key: "/dashboard/migration", icon: <ArrowLeftRight />, label: t("dashboard.migration") },
            ],
        },
    ];

    const selectedKey = (() => {
        if (pathname === "/dashboard/calendar" || pathname === "/dashboard/workspace/calendar" || pathname === "/dashboard/termine/kalender") return "/dashboard/calendar";
        if (pathname.startsWith("/dashboard/termine")) return "/dashboard/termine/buchungen";
        if (pathname.startsWith("/dashboard/workspace/time")) return "/dashboard/workspace/time";
        if (pathname.startsWith("/dashboard/workspace/reports")) return "/dashboard/reports";
        if (pathname.startsWith("/dashboard/workspace/overview")) return "/dashboard";
        if (pathname.startsWith("/dashboard/workspace")) return "/dashboard/workspace";
        for (const prefix of ["/dashboard/invoices", "/dashboard/offers", "/dashboard/recurring", "/dashboard/expenses", "/dashboard/bank", "/dashboard/reports", "/dashboard/clients", "/dashboard/products", "/dashboard/migration"]) {
            if (pathname.startsWith(prefix)) return prefix;
        }
        return pathname;
    })();

    const settingsSelected = pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/");
    const headerTitle = settingsSelected
        ? t("dashboard.settings")
        : selectedKey === "/dashboard/calendar"
          ? de ? "Kalender & Termine" : "Calendar"
          : selectedKey === "/dashboard/termine/buchungen"
            ? de ? "Buchungen & Verfügbarkeit" : "Bookings & Availability"
            : selectedKey === "/dashboard/workspace"
              ? de ? "Projekte & Aufgaben" : "Projects & Tasks"
              : selectedKey === "/dashboard/workspace/time"
                ? de ? "Zeiterfassung" : "Time & Billing"
                : selectedKey === "/dashboard/reports"
                  ? de ? "Berichte & Controlling" : "Reports & Controlling"
                  : selectedKey === "/dashboard/products"
                    ? de ? "Produkte & Leistungen" : "Products & Services"
                    : pageTitles[selectedKey]
                      ? t(pageTitles[selectedKey])
                      : t("dashboard.home");

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setPaletteOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const handleLogout = async () => { await logout(); router.push("/login"); };
    const go = (key: string) => { setMobileOpen(false); router.push(key); };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }
    if (!user) return null;

    const nav = (isCollapsed: boolean) => (
        <nav className="flex flex-col gap-4" aria-label="Dashboard">
            {groups.map((group, gi) => (
                <div key={gi} className="flex flex-col gap-1">
                    {group.label && !isCollapsed && (
                        <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{group.label}</p>
                    )}
                    {group.items.map((item) => {
                        const active = selectedKey === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => go(item.key)}
                                aria-current={active ? "page" : undefined}
                                title={isCollapsed ? item.label : undefined}
                                className={cn(
                                    "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0",
                                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                                    isCollapsed && "justify-center px-0",
                                )}
                            >
                                {item.icon}
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        );
                    })}
                </div>
            ))}
        </nav>
    );

    const sidebarFooter = (isCollapsed: boolean) => (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
            <button type="button" onClick={() => go("/dashboard/settings")} aria-current={settingsSelected ? "page" : undefined}
                className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium [&_svg]:size-[18px]",
                    settingsSelected ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-accent", isCollapsed && "justify-center px-0")}
                title={isCollapsed ? t("dashboard.settings") : undefined}>
                <Settings />{!isCollapsed && <span>{t("dashboard.settings")}</span>}
            </button>
            <Link href="/hilfe" target="_blank" rel="noopener noreferrer"
                className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground/80 hover:bg-accent [&_svg]:size-[18px]", isCollapsed && "justify-center px-0")}
                title={isCollapsed ? (de ? "Hilfe & Anleitungen" : "Help (German)") : undefined}>
                <CircleHelp />{!isCollapsed && <span>{de ? "Hilfe & Anleitungen" : "Help (German)"}</span>}
            </Link>
            <a href={getRepoUrl()} target="_blank" rel="noopener noreferrer"
                className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground/80 hover:bg-accent [&_svg]:size-[18px]", isCollapsed && "justify-center px-0")}
                title={t("dashboard.starOnGithub")}>
                <Star />{!isCollapsed && <span>{t("dashboard.starOnGithub")}</span>}
            </a>
            <a href="mailto:admin@rechly.de" className={cn("px-3 py-2 text-sm text-muted-foreground hover:text-foreground", isCollapsed && "px-0 text-center")}>
                {isCollapsed ? "✉" : t("dashboard.feedbackCta")}
            </a>
        </div>
    );

    const sidebar = (isCollapsed: boolean) => (
        <div className="flex h-full flex-col gap-4 p-3">
            <div className={cn("flex items-center gap-2.5 px-2 pt-1", isCollapsed && "justify-center px-0")}>
                <Image src="/logo.png" alt="" width={36} height={36} priority className="rounded-lg" />
                {!isCollapsed && <span className="text-lg font-bold tracking-tight">Rechly</span>}
            </div>
            <Button type="button" onClick={() => go("/dashboard/invoices/create")} className={cn("w-full", isCollapsed && "px-0")}>
                <Plus />{!isCollapsed && t("dashboard.newInvoice")}
            </Button>
            <div className="min-h-0 flex-1 overflow-y-auto">{nav(isCollapsed)}</div>
            {sidebarFooter(isCollapsed)}
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-sidebar text-sidebar-foreground lg:block", collapsed ? "w-[76px]" : "w-60")}>
                {sidebar(collapsed)}
            </aside>

            {/* Mobile drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-[290px] p-0">
                    <SheetHeader className="sr-only"><SheetTitle>Rechly</SheetTitle></SheetHeader>
                    {sidebar(false)}
                </SheetContent>
            </Sheet>

            <div className={cn("flex min-h-screen flex-col", collapsed ? "lg:pl-[76px]" : "lg:pl-60")}>
                <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
                    <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label={de ? "Navigation öffnen" : "Open navigation"}>
                        <Menu />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? (de ? "Navigation ausklappen" : "Expand navigation") : (de ? "Navigation einklappen" : "Collapse navigation")}>
                        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                    </Button>
                    <h1 className="truncate text-base font-semibold sm:text-lg">{headerTitle}</h1>
                    <NewUiBadge />
                    {isDesktopRuntime && <Badge variant="secondary" className="hidden sm:inline-flex">Offline · Local</Badge>}

                    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setPaletteOpen(true)}
                            className="hidden h-9 w-44 justify-start gap-2 text-muted-foreground md:inline-flex" aria-label={de ? "Suche öffnen (Strg+K)" : "Open search (Ctrl+K)"}>
                            <Search className="size-4" />
                            <span className="flex-1 text-left">{de ? "Suchen …" : "Search …"}</span>
                            <kbd className="text-[11px]">⌘K</kbd>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setPaletteOpen(true)} className="md:hidden" aria-label={de ? "Suche öffnen" : "Open search"}>
                            <Search />
                        </Button>
                        <span className="hidden xl:inline-flex"><BackToOldUiButton /></span>
                        <span className="xl:hidden"><BackToOldUiButton compact /></span>
                        <AppearanceSelectNew />
                        <span className="hidden sm:block"><LanguageSelectNew /></span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" className="h-9 gap-2 px-1.5">
                                    <Avatar className="size-7"><AvatarFallback>{(user?.email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                                    <span className="hidden max-w-44 truncate text-sm md:inline">{user?.email || t("settings.guest")}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="truncate">{user?.email || t("settings.guest")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => go("/dashboard/settings")}><Settings />{t("dashboard.settings")}</DropdownMenuItem>
                                {!isDesktopRuntime && (
                                    <DropdownMenuItem onClick={handleLogout}><LogOut />{t("auth.logout")}</DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-5 sm:py-6">
                    {!betaDismissed && (
                        <Alert className="mb-4 border-primary/30 bg-primary/5">
                            <TriangleAlert className="hidden" />
                            <AlertTitle className="flex items-center justify-between gap-2">
                                <span>{de ? "Du nutzt die neue Rechly-Oberfläche (Beta)" : "You're using the new Rechly interface (Beta)"}</span>
                                <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label={de ? "Hinweis schließen" : "Dismiss"}
                                    onClick={() => { setBetaDismissed(true); try { sessionStorage.setItem("rechly.new-ui-beta-dismissed", "1"); } catch {} }}>
                                    <X className="size-4" />
                                </Button>
                            </AlertTitle>
                            <AlertDescription>
                                {de
                                    ? "Gleicher Funktionsumfang, neues Design. Falls etwas ungewohnt aussieht, wechsle jederzeit über „Zur alten UI“ zurück und gib uns Feedback."
                                    : "Same features, new design. If anything looks off, switch back any time with “Back to old UI” and send us feedback."}{" "}
                                <a className="font-medium underline underline-offset-2" href="mailto:admin@rechly.de">{t("dashboard.feedbackCta")}</a>
                            </AlertDescription>
                        </Alert>
                    )}
                    {isAnonymous && (
                        <Alert className="mb-4">
                            <AlertTitle>{t("dashboard.guestModeActive")}</AlertTitle>
                            <AlertDescription>
                                {t("dashboard.guestModeDesc")}
                                <Link href="/register" className="font-semibold underline underline-offset-2">{t("dashboard.guestModeRegister")}</Link>
                                {t("dashboard.guestModeSuffix")}
                            </AlertDescription>
                        </Alert>
                    )}
                    <UpdateBanner />
                    <VerifyEmailBanner />
                    <WorkspaceActivity />
                    {children}
                </main>
            </div>
            <CommandPalette key={String(paletteOpen)} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
}
