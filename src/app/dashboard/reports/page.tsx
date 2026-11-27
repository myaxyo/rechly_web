"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Euro, FolderKanban, Info, Loader2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/currencyUtils";
import { isTermineEnabled, isWorkspaceEnabled } from "@/lib/features";
import ProjectReports from "@/components/workspace/ProjectReports";
import type { UstvaReport, EuerReport } from "@/lib/taxReports";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

interface BookingMetricRow {
    $id: string;
    serviceNameSnapshot: string;
    servicePriceCents: number;
    currency: string;
    status: string;
    startUtc: string;
    linkedInvoiceId?: string;
}

export default function ReportsPage() {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);
    const now = new Date();
    const [activeTab, setActiveTab] = useState("tax");
    const [year, setYear] = useState(now.getFullYear());
    const [part, setPart] = useState<string>(`Q${Math.floor(now.getMonth() / 3) + 1}`);
    const [loading, setLoading] = useState(true);
    const [ustva, setUstva] = useState<UstvaReport | null>(null);
    const [euer, setEuer] = useState<EuerReport | null>(null);
    const [bookings, setBookings] = useState<BookingMetricRow[]>([]);

    useEffect(() => {
        const tabParam = new URLSearchParams(window.location.search).get("tab");
        if (tabParam && ["tax", "projects", "bookings"].includes(tabParam)) {
            setActiveTab(tabParam);
        }
        if (isTermineEnabled()) {
            void fetch("/api/termine/appointments", { cache: "no-store" })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => {
                    if (d?.appointments) setBookings(d.appointments);
                })
                .catch(() => {});
        }
    }, []);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/reports/tax?year=${year}&part=${part}`);
            if (!res.ok) throw new Error("failed");
            const data = await res.json();
            setUstva(data.ustva);
            setEuer(data.euer);
        } catch (error) {
            console.error("Error loading reports:", error);
        } finally {
            setLoading(false);
        }
    }, [year, part]);

    useEffect(() => {
        void load();
    }, [load]);

    const ustvaRows = ustva
        ? [
              {
                  key: "81",
                  kz: "81",
                  label: "Steuerpflichtige Umsätze 19 % (netto)",
                  value: ustva.kz81Net,
              },
              {
                  key: "81t",
                  kz: "",
                  label: "Umsatzsteuer 19 %",
                  value: ustva.kz81Tax,
              },
              {
                  key: "86",
                  kz: "86",
                  label: "Steuerpflichtige Umsätze 7 % (netto)",
                  value: ustva.kz86Net,
              },
              {
                  key: "86t",
                  kz: "",
                  label: "Umsatzsteuer 7 %",
                  value: ustva.kz86Tax,
              },
              ...(ustva.flatRate24Net !== 0
                  ? [
                        {
                            key: "24",
                            kz: "–",
                            label: "Umsätze Durchschnittssatz § 24 UStG (netto, nur Info)",
                            value: ustva.flatRate24Net,
                        },
                        {
                            key: "24t",
                            kz: "",
                            label: "Ausgewiesene Steuer § 24 UStG (verbleibt beim Betrieb)",
                            value: ustva.flatRate24Tax,
                        },
                    ]
                  : []),
              ...(ustva.taxFreeNet !== 0
                  ? [
                        {
                            key: "free",
                            kz: "–",
                            label: "Steuerfreie Umsätze (netto)",
                            value: ustva.taxFreeNet,
                        },
                    ]
                  : []),
              {
                  key: "66",
                  kz: "66",
                  label: "Vorsteuer aus Ausgaben",
                  value: ustva.kz66Vorsteuer,
              },
              {
                  key: "83",
                  kz: "83",
                  label: "Zahllast (+) / Erstattung (−)",
                  value: ustva.kz83Zahllast,
              },
          ]
        : [];

    const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
    const unbilledBookings = completedBookings.filter((b) => !b.linkedInvoiceId);
    const completedValueEur = completedBookings.reduce((s, b) => s + (b.servicePriceCents || 0) / 100, 0);
    const unbilledValueEur = unbilledBookings.reduce((s, b) => s + (b.servicePriceCents || 0) / 100, 0);
    const cancelledOrNoShowCount = bookings.filter((b) =>
        ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "NO_SHOW"].includes(b.status),
    ).length;

    const serviceBreakdownMap = new Map<string, { service: string; count: number; revenue: number }>();
    for (const b of completedBookings) {
        const key = b.serviceNameSnapshot || "—";
        const cur = serviceBreakdownMap.get(key) || { service: key, count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += (b.servicePriceCents || 0) / 100;
        serviceBreakdownMap.set(key, cur);
    }
    const serviceBreakdown = [...serviceBreakdownMap.values()].sort((a, b) => b.revenue - a.revenue);

    const stat = (label: string, value: string) => (
        <Card key={label}>
            <CardContent className="pt-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex max-w-[1200px] flex-col gap-4">
            <div>
                <h2 className="text-2xl font-semibold">{l("Berichte, Steuern & Controlling", "Reports, Tax & Controlling")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {l(
                        "Steuerauswertungen (UStVA & EÜR), Projektcontrolling und Terminbuchungs-Auswertungen an einem zentralen Ort.",
                        "Tax reports (VAT & EÜR), project profitability and appointment booking analytics in one place.",
                    )}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap">
                    <TabsTrigger value="tax"><Euro />{l("Steuern (UStVA & EÜR)", "Tax (UStVA & EÜR)")}</TabsTrigger>
                    {isWorkspaceEnabled() && (
                        <TabsTrigger value="projects"><FolderKanban />{l("Projektcontrolling", "Project Controlling")}</TabsTrigger>
                    )}
                    {isTermineEnabled() && (
                        <TabsTrigger value="bookings"><CalendarDays />{l("Termin-Auswertung", "Booking Analytics")}</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="tax" className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                            <SelectTrigger className="w-[110px]" aria-label="Year"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[year - 1, year, year + 1]
                                    .filter((y) => y <= now.getFullYear())
                                    .map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label="Quarter">
                            {QUARTERS.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => setPart(q)}
                                    aria-pressed={part === q}
                                    className={cn(
                                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                        part === q ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card>
                                <CardHeader><CardTitle>{`Umsatzsteuervoranmeldung ${part}/${year}`}</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px]">KZ</TableHead>
                                                <TableHead>Position</TableHead>
                                                <TableHead className="text-right">Betrag</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ustvaRows.map((row) => (
                                                <TableRow key={row.key}>
                                                    <TableCell>{row.kz}</TableCell>
                                                    <TableCell>{row.label}</TableCell>
                                                    <TableCell className={cn("text-right", row.value === ustva?.kz83Zahllast && "font-semibold")}>
                                                        {formatCurrency(row.value, "de")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>{`EÜR ${year} (vereinfacht)`}</CardTitle></CardHeader>
                                <CardContent>
                                    {euer && (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Position</TableHead>
                                                    <TableHead className="text-right">Betrag</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {[
                                                    ...euer.incomeByRate.map((item) => ({
                                                        key: `in-${item.rate}`,
                                                        label: `Einnahmen ${item.rate} % (netto)`,
                                                        value: item.net,
                                                    })),
                                                    { key: "vat-in", label: "Vereinnahmte Umsatzsteuer", value: euer.collectedVat },
                                                    { key: "sum-in", label: "Summe Betriebseinnahmen", value: euer.totalIncome },
                                                    ...euer.expenseGroups.map((group) => ({
                                                        key: `ex-${group.category}`,
                                                        label: `Ausgaben: ${group.category}`,
                                                        value: -group.net,
                                                    })),
                                                    { key: "vat-out", label: "Gezahlte Vorsteuer", value: -euer.paidVorsteuer },
                                                    { key: "profit", label: "Gewinn / Verlust", value: euer.profit },
                                                ].map((row) => (
                                                    <TableRow key={row.key}>
                                                        <TableCell>{row.label}</TableCell>
                                                        <TableCell className={cn("text-right", (row.key === "profit" || row.key === "sum-in") && "font-semibold")}>
                                                            {formatCurrency(row.value, "de")}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                            <Alert className="lg:col-span-2">
                                <Info />
                                <AlertTitle>Direkt in ELSTER übertragen</AlertTitle>
                                <AlertDescription>
                                    Die Kennzahlen (KZ) entsprechen den Feldern der Umsatzsteuervoranmeldung in ELSTER. Eine direkte Übermittlung ist mit Open-Source-Software derzeit nicht möglich (die ELSTER-Schnittstelle ERiC ist proprietär) – kopieren Sie die Werte in Ihr ELSTER-Formular.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </TabsContent>

                {isWorkspaceEnabled() && (
                    <TabsContent value="projects">
                        <ProjectReports embedded />
                    </TabsContent>
                )}

                {isTermineEnabled() && (
                    <TabsContent value="bookings" className="flex flex-col gap-4">
                        <div className="grid gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                            {stat(l("Abgeschlossene Termine", "Completed bookings"), String(completedBookings.length))}
                            {stat(l("Leistungswert abgeschlossen", "Completed service value"), formatCurrency(completedValueEur, "de"))}
                            {stat(l("Noch nicht abgerechnet", "Unbilled completed"), `${unbilledBookings.length} (${formatCurrency(unbilledValueEur, "de")})`)}
                            {stat(l("Storno / Nicht erschienen", "Cancelled / No-show"), String(cancelledOrNoShowCount))}
                        </div>

                        {unbilledBookings.length > 0 && (
                            <Alert>
                                <TriangleAlert />
                                <AlertTitle>
                                    {l(
                                        `${unbilledBookings.length} abgeschlossene(r) Termin(e) noch ohne Rechnung (${formatCurrency(unbilledValueEur, "de")})`,
                                        `${unbilledBookings.length} completed appointment(s) not yet billed (${formatCurrency(unbilledValueEur, "de")})`,
                                    )}
                                </AlertTitle>
                                <AlertDescription>
                                    <Button type="button" size="sm" className="mt-2" asChild>
                                        <Link href="/dashboard/termine/buchungen?status=COMPLETED">
                                            {l("Jetzt abrechnen →", "Bill now →")}
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        <Card>
                            <CardHeader><CardTitle>{l("Umsatz nach Leistung (abgeschlossen)", "Completed value by service")}</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{l("Leistung", "Service")}</TableHead>
                                            <TableHead className="w-[120px]">{l("Termine", "Appointments")}</TableHead>
                                            <TableHead className="text-right">{l("Wert", "Value")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {serviceBreakdown.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                                                    {l("Noch keine abgeschlossenen Termine.", "No completed bookings yet.")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            serviceBreakdown.map((row) => (
                                                <TableRow key={row.service}>
                                                    <TableCell>{row.service}</TableCell>
                                                    <TableCell>{row.count}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                            {formatCurrency(row.revenue, "de")}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
