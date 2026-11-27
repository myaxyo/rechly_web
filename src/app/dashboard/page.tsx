"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight, CalendarDays, CircleAlert, CircleCheck, Clock, FileText, FolderKanban, Plus,
    Settings, ShoppingBag, Tags, TrendingUp, Users, Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useInvoiceStore, useClientStore, useProductStore } from "@/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCompanyInfo } from "@/lib/companyService";
import { getDashboardAnalytics } from "@/lib/analyticsService";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import { isTermineEnabled, isWorkspaceEnabled } from "@/lib/features";
import type { DashboardAnalytics, UserCompany } from "@/types";

export default function DashboardPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const [company, setCompany] = useState<UserCompany | null>(null);
    const [companyLoading, setCompanyLoading] = useState(true);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [opsSummary, setOpsSummary] = useState<{
        todayBookings: number;
        pendingBookings: number;
        nextBooking?: { customerName: string; serviceNameSnapshot: string; startUtc: string };
        openTasks: number;
        activeProjects: number;
        unbilledTimeValue: number;
        timerRunning?: string;
    }>({
        todayBookings: 0,
        pendingBookings: 0,
        openTasks: 0,
        activeProjects: 0,
        unbilledTimeValue: 0,
    });

    const statusBadgeClass: Record<string, string> = {
        draft: "bg-secondary text-secondary-foreground",
        sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    };

    const statusLabels: Record<string, string> = {
        draft: t("status.draft"),
        sent: t("status.sent"),
        paid: t("status.paid"),
        cancelled: t("status.cancelled"),
    };

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
    const recentInvoices = invoices.slice(0, 6);
    const paidTotal = stats?.paidAmount ?? 0;
    const unpaidTotal = stats?.unpaidAmount ?? 0;
    const paidRatio =
        paidTotal + unpaidTotal > 0
            ? Math.round((paidTotal / (paidTotal + unpaidTotal)) * 100)
            : 0;

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        try {
            setCompanyLoading(true);
            await Promise.all([
                fetchInvoices(),
                fetchStats(),
                fetchClients(),
                fetchProducts(),
                getCompanyInfo().then(setCompany),
                getDashboardAnalytics().then(setAnalytics),
            ]);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setCompanyLoading(false);
        }
        // Non-blocking unified platform summary (Termine + Workspace)
        void (async () => {
            try {
                const todayPrefix = new Date().toISOString().slice(0, 10);
                const nowIso = new Date().toISOString();
                const [apptsRes, wsRes, workRes] = await Promise.all([
                    isTermineEnabled()
                        ? fetch(`/api/termine/appointments?from=${todayPrefix}T00:00:00.000Z`, {
                              cache: "no-store",
                          })
                              .then((r) => (r.ok ? r.json() : null))
                              .catch(() => null)
                        : Promise.resolve(null),
                    isWorkspaceEnabled()
                        ? fetch("/api/workspace", { cache: "no-store" })
                              .then((r) => (r.ok ? r.json() : null))
                              .catch(() => null)
                        : Promise.resolve(null),
                    isWorkspaceEnabled()
                        ? fetch("/api/workspace/work", { cache: "no-store" })
                              .then((r) => (r.ok ? r.json() : null))
                              .catch(() => null)
                        : Promise.resolve(null),
                ]);

                const appts: Array<{
                    customerName: string;
                    serviceNameSnapshot: string;
                    startUtc: string;
                    status: string;
                }> = apptsRes?.appointments || [];
                const activeAppts = appts.filter(
                    (a) => a.status === "PENDING" || a.status === "CONFIRMED",
                );
                const todayBookings = activeAppts.filter(
                    (a) => a.startUtc.slice(0, 10) === todayPrefix,
                ).length;
                const pendingBookings = appts.filter((a) => a.status === "PENDING").length;
                const nextBooking = activeAppts.find((a) => a.startUtc >= nowIso);

                const tasks: Array<{ status: string }> = wsRes?.data?.tasks || [];
                const projects: Array<{ status: string }> = wsRes?.data?.projects || [];
                const reports: Array<{ unbilled: number }> = workRes?.reports || [];
                const unbilledTimeValue = reports.reduce((s, r) => s + (r.unbilled || 0), 0);

                setOpsSummary({
                    todayBookings,
                    pendingBookings,
                    nextBooking,
                    openTasks: tasks.filter((tk) => tk.status !== "done").length,
                    activeProjects: projects.filter((p) => p.status === "active").length,
                    unbilledTimeValue,
                    timerRunning: workRes?.timer?.description,
                });
            } catch {
                // Keep dashboard resilient if optional endpoints are unavailable
            }
        })();
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="dashboard-kpi-grid" style={{ marginTop: 28 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="dashboard-panel">
                            <CardContent className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-7 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const kpis = [
        {
            label: t("dashboard.invoices"),
            value: String(stats?.total ?? 0),
            note: `${stats?.sent ?? 0} ${t("dashboard.sent")}`,
            icon: <FileText />,
            tone: "blue",
            path: "/dashboard/invoices",
        },
        {
            label: t("dashboard.clients"),
            value: String(clients.length),
            note: t("dashboard.manageClients"),
            icon: <Users />,
            tone: "teal",
            path: "/dashboard/clients",
        },
        {
            label: t("dashboard.products"),
            value: String(products.length),
            note: t("dashboard.manageProducts"),
            icon: <ShoppingBag />,
            tone: "violet",
            path: "/dashboard/products",
        },
        {
            label: t("dashboard.openAmounts"),
            value: formatCurrency(unpaidTotal),
            note: `${stats?.draft ?? 0} ${t("dashboard.drafts")}`,
            icon: <Clock />,
            tone: "amber",
            path: "/dashboard/invoices",
        },
    ];

    return (
        <div className="dashboard-page">
            <section className="dashboard-welcome">
                <div>
                    <div className="dashboard-eyebrow">{t("dashboard.overview")}</div>
                    <h1>
                        {company
                            ? `${t("dashboard.welcome")}, ${company.name}`
                            : t("dashboard.welcomeDefault")}
                    </h1>
                    <p>{t("dashboard.subtitle")}</p>
                </div>
                <Button type="button" size="lg" onClick={() => router.push("/dashboard/invoices/create")}>
                    <Plus />
                    {t("dashboard.newInvoice")}
                </Button>
            </section>

            {!loading && invoices.length === 0 && (
                <section className="dashboard-getting-started" aria-label={l("Erste Schritte", "Getting started")}>
                    <div className="dashboard-getting-started-head">
                        <h2>{l("In drei Schritten zur ersten Rechnung", "Your first invoice in three steps")}</h2>
                        <p>{l("Dauert etwa zwei Minuten. Du kannst jeden Schritt auch überspringen und später erledigen.", "Takes about two minutes. You can skip any step and finish it later.")}</p>
                    </div>
                    <ol className="dashboard-getting-started-list">
                        <li className={company?.name ? "is-done" : ""}>
                            <span className="dashboard-step-state">{company?.name ? <CircleCheck /> : "1"}</span>
                            <div>
                                <strong>{l("Firmendaten hinterlegen", "Add your company details")}</strong>
                                <span>{l("Erscheinen automatisch auf jeder Rechnung.", "They appear automatically on every invoice.")}</span>
                            </div>
                            {!company?.name && (
                                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/settings")}>{l("Ausfüllen", "Add now")}</Button>
                            )}
                        </li>
                        <li className={clients.length > 0 ? "is-done" : ""}>
                            <span className="dashboard-step-state">{clients.length > 0 ? <CircleCheck /> : "2"}</span>
                            <div>
                                <strong>{l("Ersten Kunden anlegen", "Add your first client")}</strong>
                                <span>{l("Oder Bestandskunden per CSV importieren.", "Or import existing clients via CSV.")}</span>
                            </div>
                            {clients.length === 0 && (
                                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/clients")}>{l("Kunde anlegen", "Add client")}</Button>
                            )}
                        </li>
                        <li>
                            <span className="dashboard-step-state">3</span>
                            <div>
                                <strong>{l("Erste Rechnung erstellen", "Create your first invoice")}</strong>
                                <span>{l("Als PDF, XRechnung oder ZUGFeRD exportieren.", "Export as PDF, XRechnung or ZUGFeRD.")}</span>
                            </div>
                            <Button type="button" onClick={() => router.push("/dashboard/invoices/create")}>
                                {t("dashboard.createFirst")}
                            </Button>
                        </li>
                    </ol>
                </section>
            )}

            <section className="dashboard-kpi-grid">
                {kpis.map((kpi) => (
                    <button
                        key={kpi.label}
                        className={`dashboard-kpi dashboard-kpi--${kpi.tone}`}
                        onClick={() => router.push(kpi.path)}
                        type="button"
                    >
                        <span className="dashboard-kpi-icon">{kpi.icon}</span>
                        <span className="dashboard-kpi-body">
                            <span className="dashboard-kpi-label">{kpi.label}</span>
                            <strong>{kpi.value}</strong>
                            <span className="dashboard-kpi-note">{kpi.note}</span>
                        </span>
                        <ArrowRight className="dashboard-kpi-arrow" />
                    </button>
                ))}
            </section>

            <section className="dashboard-finance-grid">
                <Card className="dashboard-panel dashboard-revenue-panel">
                    <CardContent>
                    <div className="dashboard-panel-heading">
                        <div>
                            <span className="dashboard-panel-icon"><TrendingUp /></span>
                            <h2>{t("dashboard.revenueOverview")}</h2>
                        </div>
                        <Badge className={paidRatio >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}>
                            {paidRatio}% {t("dashboard.paid")}
                        </Badge>
                    </div>
                    <div className="dashboard-revenue-values">
                        <div>
                            <span>{t("dashboard.totalPaid")}</span>
                            <strong className="text-positive">{formatCurrency(paidTotal)}</strong>
                        </div>
                        <div>
                            <span>{t("dashboard.openAmounts")}</span>
                            <strong className="text-warning">{formatCurrency(unpaidTotal)}</strong>
                        </div>
                    </div>
                    <Progress value={paidRatio} className="h-2 [&>[data-slot=progress-indicator]]:bg-emerald-500" />
                    <div className="dashboard-status-summary">
                        <span><i className="status-dot status-dot--draft" />{stats?.draft ?? 0} {t("dashboard.drafts")}</span>
                        <span><i className="status-dot status-dot--sent" />{stats?.sent ?? 0} {t("dashboard.sent")}</span>
                        <span><i className="status-dot status-dot--paid" />{stats?.paid ?? 0} {t("dashboard.paid")}</span>
                    </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-panel dashboard-actions-panel">
                    <CardContent>
                    <div className="dashboard-panel-heading">
                        <div>
                            <span className="dashboard-panel-icon"><Wallet /></span>
                            <h2>{t("dashboard.quickActions")}</h2>
                        </div>
                    </div>
                    <div className="dashboard-action-list">
                        <button type="button" onClick={() => router.push("/dashboard/calendar")}>
                            <CalendarDays />
                            <span>{l("Kalender & Termine", "Calendar & Scheduling")}</span>
                            <ArrowRight />
                        </button>
                        <button type="button" onClick={() => router.push("/dashboard/termine/buchungen")}>
                            <Clock />
                            <span>
                                {l("Terminbuchungen", "Bookings")}
                                {opsSummary.pendingBookings > 0 ? ` (${opsSummary.pendingBookings})` : ""}
                            </span>
                            <ArrowRight />
                        </button>
                        <button type="button" onClick={() => router.push("/dashboard/workspace")}>
                            <FolderKanban />
                            <span>
                                {l("Projekte & Aufgaben", "Projects & Tasks")}
                                {opsSummary.openTasks > 0 ? ` (${opsSummary.openTasks})` : ""}
                            </span>
                            <ArrowRight />
                        </button>
                        <button type="button" onClick={() => router.push("/dashboard/offers")}>
                            <Tags />
                            <span>{t("dashboard.offers")}</span>
                            <ArrowRight />
                        </button>
                        <button type="button" onClick={() => router.push("/dashboard/clients")}>
                            <Users />
                            <span>{t("dashboard.manageClients")}</span>
                            <ArrowRight />
                        </button>
                        <button type="button" onClick={() => router.push("/dashboard/products")}>
                            <ShoppingBag />
                            <span>{l("Produkte & Leistungen", "Products & Services")}</span>
                            <ArrowRight />
                        </button>
                        <button type="button" onClick={() => router.push("/dashboard/settings")}>
                            <Settings />
                            <span>{t("dashboard.settings")}</span>
                            <ArrowRight />
                        </button>
                    </div>
                    </CardContent>
                </Card>
            </section>

            <section className="dashboard-analytics-grid" style={{ marginBottom: 20 }}>
                <Card className="dashboard-panel">
                    <CardHeader className="dashboard-panel-head">
                        <CardTitle className="flex items-center gap-2"><CalendarDays className="size-4" /> {l("Termine & Online-Buchungen", "Appointments & Online Booking")}</CardTitle>
                        <Button type="button" variant="link" className="h-auto p-0" onClick={() => router.push("/dashboard/calendar")}>
                            {l("Zum Kalender", "Open Calendar")} <ArrowRight />
                        </Button>
                    </CardHeader>
                    <CardContent>
                    <div className="dashboard-forecast-values" style={{ marginBottom: 12 }}>
                        <div>
                            <span>{l("Heute geplant", "Today")}</span>
                            <strong>{opsSummary.todayBookings}</strong>
                        </div>
                        <div>
                            <span>{l("Offene Anfragen", "Pending approval")}</span>
                            <strong>{opsSummary.pendingBookings}</strong>
                        </div>
                    </div>
                    {opsSummary.nextBooking ? (
                        <div className="dashboard-anomaly-note" style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard/termine/buchungen")}>
                            <CalendarDays />{" "}
                            {l("Nächster Termin:", "Next appointment:")}{" "}
                            <strong>{opsSummary.nextBooking.customerName}</strong> ·{" "}
                            {opsSummary.nextBooking.serviceNameSnapshot} (
                            {new Date(opsSummary.nextBooking.startUtc).toLocaleString(
                                language === "de" ? "de-DE" : "en-GB",
                                { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" },
                            )}
                            )
                        </div>
                    ) : (
                        <p className="dashboard-empty-note">
                            {l("Keine anstehenden Buchungen.", "No upcoming customer bookings.")}
                        </p>
                    )}
                    </CardContent>
                </Card>

                <Card className="dashboard-panel">
                    <CardHeader className="dashboard-panel-head">
                        <CardTitle className="flex items-center gap-2"><FolderKanban className="size-4" /> {l("Projekte, Aufgaben & Zeiten", "Projects, Tasks & Time")}</CardTitle>
                        <Button type="button" variant="link" className="h-auto p-0" onClick={() => router.push("/dashboard/workspace")}>
                            {l("Zum Arbeitsbereich", "Open Projects")} <ArrowRight />
                        </Button>
                    </CardHeader>
                    <CardContent>
                    <div className="dashboard-forecast-values" style={{ marginBottom: 12 }}>
                        <div>
                            <span>{l("Offene Aufgaben", "Open tasks")}</span>
                            <strong>{opsSummary.openTasks}</strong>
                        </div>
                        <div>
                            <span>{l("Offene Zeiten (netto)", "Unbilled time (net)")}</span>
                            <strong>{formatCurrency(opsSummary.unbilledTimeValue)}</strong>
                        </div>
                    </div>
                    {opsSummary.timerRunning ? (
                        <div
                            className="dashboard-anomaly-note"
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push("/dashboard/workspace/time")}
                        >
                            <Clock /> {l("Timer läuft:", "Timer running:")}{" "}
                            <strong>{opsSummary.timerRunning}</strong>
                        </div>
                    ) : (
                        <p className="dashboard-empty-note">
                            {opsSummary.activeProjects}{" "}
                            {l("aktive(s) Projekt(e) · Zeiterfassung bereit", "active project(s) · Time tracking ready")}
                        </p>
                    )}
                    </CardContent>
                </Card>
            </section>

            <section className="dashboard-main-grid">
                <Card className="dashboard-panel dashboard-recent-panel">
                    <CardHeader className="dashboard-panel-head">
                        <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
                        <Button type="button" variant="link" className="h-auto p-0" onClick={() => router.push("/dashboard/invoices")}>
                            {t("dashboard.showAll")} <ArrowRight />
                        </Button>
                    </CardHeader>
                    <CardContent>
                    {recentInvoices.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <FileText className="size-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{t("dashboard.noInvoices")}</p>
                            <Button type="button" onClick={() => router.push("/dashboard/invoices/create")}>
                                {t("dashboard.createFirst")}
                            </Button>
                        </div>
                    ) : (
                        <div className="dashboard-invoice-list">
                            {recentInvoices.map((invoice) => (
                                <button
                                    type="button"
                                    key={invoice.id}
                                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                                    className="dashboard-invoice-row"
                                >
                                    <span className="dashboard-invoice-symbol"><FileText /></span>
                                    <span className="dashboard-invoice-info">
                                        <strong>{invoice.invoice_number}</strong>
                                        <small>
                                            {invoice.client?.name || t("dashboard.unknownClient")}
                                            {" · "}{formatDateGerman(invoice.issue_date)}
                                        </small>
                                    </span>
                                    <Badge className={cn("shrink-0", statusBadgeClass[invoice.status])}>
                                        {statusLabels[invoice.status]}
                                    </Badge>
                                    <strong className="dashboard-invoice-amount">
                                        {formatCurrency(invoice.total_gross)}
                                    </strong>
                                    <ArrowRight className="dashboard-row-arrow" />
                                </button>
                            ))}
                        </div>
                    )}
                    </CardContent>
                </Card>

                <div className="dashboard-side-stack">
                    <Card className="dashboard-panel dashboard-forecast-card">
                        <CardContent>
                        <div className="dashboard-panel-heading">
                            <div>
                                <span className="dashboard-panel-icon"><TrendingUp /></span>
                                <h2>Revenue Forecast</h2>
                            </div>
                            <span className="dashboard-confidence">
                                {analytics?.forecast.confidence ?? 0}% confidence
                            </span>
                        </div>
                        <div className="dashboard-forecast-values">
                            <div>
                                <span>Next 30 days</span>
                                <strong>{formatCurrency(analytics?.forecast.next30Days ?? 0)}</strong>
                            </div>
                            <div>
                                <span>Next 90 days</span>
                                <strong>{formatCurrency(analytics?.forecast.next90Days ?? 0)}</strong>
                            </div>
                        </div>
                        </CardContent>
                    </Card>

                    <Card className="dashboard-panel dashboard-insights-card">
                        <CardContent>
                        <div className="dashboard-panel-heading">
                            <div>
                                <span className="dashboard-panel-icon"><CircleAlert /></span>
                                <h2>KPI Intelligence</h2>
                            </div>
                        </div>
                        {analytics?.kpiInsights?.length ? (
                            <div className="dashboard-insight-list">
                                {analytics.kpiInsights.slice(0, 4).map((insight) => (
                                    <div key={insight.key} className="dashboard-insight-item">
                                        <span>{insight.value}</span>
                                        <i className={`insight-level insight-level--${insight.importance}`} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="dashboard-empty-note">No KPI insights generated yet.</p>
                        )}
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="dashboard-analytics-grid">
                <Card className="dashboard-panel">
                    <CardHeader className="dashboard-panel-head"><CardTitle>Late-Payment Risk</CardTitle></CardHeader>
                    <CardContent>
                    {analytics?.latePaymentRisk?.length ? (
                        <div className="dashboard-risk-list">
                            {analytics.latePaymentRisk.slice(0, 5).map((risk) => (
                                <div key={risk.clientId} className="dashboard-risk-row">
                                    <div>
                                        <strong>{risk.clientName}</strong>
                                        <small>Late rate {risk.lateRate}% · Avg {risk.averageDaysLate}d</small>
                                    </div>
                                    <Badge className={risk.riskLevel === "high" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : risk.riskLevel === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}>
                                        {(risk.riskScore * 100).toFixed(1)}%
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="dashboard-empty-note">Not enough data for risk scoring yet.</p>
                    )}
                    </CardContent>
                </Card>

                <Card className="dashboard-panel">
                    <CardHeader className="dashboard-panel-head"><CardTitle>Customer Segmentation &amp; Anomalies</CardTitle></CardHeader>
                    <CardContent>
                    <div className="dashboard-segment-list">
                        {analytics?.customerSegments?.length ? (
                            ["champions", "loyal", "at_risk", "new", "needs_attention"].map((segment) => {
                                const count = analytics.customerSegments.filter((entry) => entry.segment === segment).length;
                                return (
                                    <span key={segment}>
                                        {segment.replace("_", " ")} <strong>{count}</strong>
                                    </span>
                                );
                            })
                        ) : (
                            <p className="dashboard-empty-note">No segmentation data yet.</p>
                        )}
                    </div>
                    {analytics?.anomalies?.length ? (
                        <div className="dashboard-anomaly-note">
                            <CircleAlert className="inline size-4" /> {analytics.anomalies[0].message}
                        </div>
                    ) : (
                        <p className="dashboard-empty-note"><CircleCheck className="inline size-4" /> No anomalies detected.</p>
                    )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
