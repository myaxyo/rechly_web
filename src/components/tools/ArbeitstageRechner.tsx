"use client";

import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DecimalInput from "@/components/DecimalInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { GERMAN_STATES, calculateStateWorkdays, YearWorkdayStats } from "@/lib/tools/holidays";

export default function ArbeitstageRechner() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<number>(currentYear >= 2026 ? currentYear : 2026);
    const [stateCode, setStateCode] = useState<string>("BY"); // Bayern default (most holidays)
    const [hourlyRate, setHourlyRate] = useState<number>(90);
    const [hoursPerDay, setHoursPerDay] = useState<number>(8);

    const stats: YearWorkdayStats = useMemo(() => {
        return calculateStateWorkdays(year, stateCode);
    }, [year, stateCode]);

    const potentialRevenueYearly = stats.workdays * hoursPerDay * hourlyRate;

    const exportCsv = () => {
        const headers = ["Monat", "Kalendertage", "Wochenendtage", "Feiertage", "Arbeitstage", "Feiertagsnamen"];
        const rows = stats.months.map((m) => [
            `"${m.monthName}"`,
            m.totalDays,
            m.weekendDays,
            m.holidayDays,
            m.workdays,
            `"${m.holidays.join(", ")}"`,
        ]);
        const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map((r) => r.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Arbeitstage_${year}_${stateCode}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            {/* Filter Bar */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    marginBottom: 28,
                    background: "#f8fafc",
                    padding: 20,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0" }}
            >
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Jahr auswählen:
                    </label>
                    <Select
                        value={String(year)}
                        onValueChange={(v) => setYear(Number(v))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Bundesland:
                    </label>
                    <Select
                        value={stateCode}
                        onValueChange={setStateCode}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {GERMAN_STATES.map((s) => (
                                <SelectItem key={s.code} value={s.code}>{`${s.name} (${s.code})`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Stundensatz (Netto):
                    </label>
                    <DecimalInput
                        min={10}
                        max={1000}
                        value={hourlyRate}
                        onChange={(val) => setHourlyRate(val || 0)}
                        style={{ width: "100%" }}
                        addonAfter="€/Std."
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Arbeitsstunden / Tag:
                    </label>
                    <DecimalInput
                        min={1}
                        max={14}
                        value={hoursPerDay}
                        onChange={(val) => setHoursPerDay(val || 8)}
                        style={{ width: "100%" }}
                        addonAfter="Std."
                    />
                </div>
            </div>

            {/* Results KPI Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginBottom: 28 }}
            >
                <Card
                    style={{
                        borderRadius: 10,
                        border: "2px solid #2855d9",
                        background: "#eff6ff" }}
                >
                    <CardContent>
                        <span style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 800, color: "#1e40af" }}>
                            Arbeitstage in {stats.stateName}
                        </span>
                        <div style={{ fontSize: 32, fontWeight: 900, color: "#2855d9", marginTop: 4 }}>
                            {stats.workdays}
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}> Tage</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#2855d9", marginTop: 4 }}>
                            {year} ({stats.totalDays} Kalendertage)
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Gesetzliche Feiertage (Werktags)
                        </span>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
                            {stats.holidayDays}
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}> Feiertage</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            Fallen auf Mo–Fr
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Wochenendtage
                        </span>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                            {stats.weekendDays}
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}> Tage</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            Samstage &amp; Sonntage
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Maximales Umsatzpotenzial
                        </span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#059669", marginTop: 4 }}>
                            {potentialRevenueYearly.toLocaleString("de-DE")} €
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            Bei 100% Auslastung ({hoursPerDay}h à {hourlyRate}€)
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Table View */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    Monatliche Übersicht ({year} – {stats.stateName})
                </h3>
                <Button variant="outline" onClick={exportCsv} size="sm">
                    <Download />
                    Tabelle als CSV
                </Button>
            </div>

            <Table
                style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}
            >
                <TableHeader>
                    <TableRow>
                        <TableHead>Monat</TableHead>
                        <TableHead>Tage gesamt</TableHead>
                        <TableHead>Wochenende</TableHead>
                        <TableHead>Feiertage (Mo-Fr)</TableHead>
                        <TableHead>Arbeitstage</TableHead>
                        <TableHead>Umsatzpotenzial</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.months.map((m) => (
                        <TableRow key={m.monthIndex}>
                            <TableCell><strong>{m.monthName}</strong></TableCell>
                            <TableCell>{m.totalDays}</TableCell>
                            <TableCell><span style={{ color: "#64748b" }}>{m.weekendDays}</span></TableCell>
                            <TableCell>
                                {m.holidayDays > 0 ? (
                                    <div>
                                        <Badge className="bg-red-600 text-white hover:bg-red-600" style={{ fontWeight: 700 }}>
                                            {m.holidayDays}
                                        </Badge>
                                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                            {m.holidays.join(", ")}
                                        </div>
                                    </div>
                                ) : (
                                    <span>0</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#2855d9" }}>{m.workdays}</span>
                            </TableCell>
                            <TableCell>
                                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                    {(m.workdays * hoursPerDay * hourlyRate).toLocaleString("de-DE")} €
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
