"use client";

import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DecimalInput from "@/components/DecimalInput";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Info } from "lucide-react";
import { calculateAfa, BMF_ASSET_PRESETS } from "@/lib/tools/afa";


export default function AfaRechner() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [selectedPreset, setSelectedPreset] = useState<string>("laptop_pc");
    const [netCost, setNetCost] = useState<number>(1450);
    const [purchaseMonth, setPurchaseMonth] = useState<number>(currentMonth);
    const [purchaseYear, setPurchaseYear] = useState<number>(currentYear >= 2026 ? currentYear : 2026);
    const [usefulLifeYears, setUsefulLifeYears] = useState<number>(1);
    const [marginalTaxRate] = useState<number>(35);

    const handlePresetChange = (presetId: string) => {
        setSelectedPreset(presetId);
        const p = BMF_ASSET_PRESETS.find((x) => x.id === presetId);
        if (p) {
            setUsefulLifeYears(p.usefulLifeYears);
        }
    };

    const calculation = useMemo(() => {
        return calculateAfa({
            netCost: netCost || 0,
            purchaseMonth,
            purchaseYear,
            usefulLifeYears: usefulLifeYears || 1,
            marginalTaxRatePercent: marginalTaxRate || 35 });
    }, [netCost, purchaseMonth, purchaseYear, usefulLifeYears, marginalTaxRate]);

    const exportCsv = () => {
        const headers = ["Jahr", "Buchwert Beginn (€)", "AfA Betrag (€)", "Restbuchwert 31.12. (€)", "Monate"];
        const rows = calculation.schedule.map((r) => [
            r.year,
            r.openingBookValue.toFixed(2),
            r.depreciationAmount.toFixed(2),
            r.closingBookValue.toFixed(2),
            r.monthsDepreciated,
        ]);

        const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map((r) => r.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `AfA_Abschreibungsplan_${purchaseYear}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const monthOptions = [
        { label: "Januar", value: 1 },
        { label: "Februar", value: 2 },
        { label: "März", value: 3 },
        { label: "April", value: 4 },
        { label: "Mai", value: 5 },
        { label: "Juni", value: 6 },
        { label: "Juli", value: 7 },
        { label: "August", value: 8 },
        { label: "September", value: 9 },
        { label: "Oktober", value: 10 },
        { label: "November", value: 11 },
        { label: "Dezember", value: 12 },
    ];

    return (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 8px" }}>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                <Card style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>AfA im 1. Jahr ({purchaseYear})</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#2855d9", marginTop: 4 }}>
                            {calculation.firstYearAfa.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                            Pro-rata temporis ({13 - purchaseMonth} Monate)
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Jährliche Regel-AfA</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                            {calculation.annualLinearAfaFullYear.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                            AfA-Satz: {calculation.annualAfaRatePercent} % p.a.
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <CardContent>
                        <div style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Steuerersparnis (ca.)</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#15803d", marginTop: 4 }}>
                            {calculation.estimatedTaxSavings.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                        </div>
                        <div style={{ fontSize: 11, color: "#166534", marginTop: 4 }}>
                            Bei {marginalTaxRate} % Grenzsteuersatz
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <CardContent>
                        <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 600 }}>Einstufung</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e40af", marginTop: 8 }}>
                            {calculation.isGwg ? "GWG Sofortabschreibung" : "Reguläre AfA"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                            Grenze: 800,00 € netto
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Input Config Card */}
            <Card
                style={{ borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24 }}
            >
                <CardHeader>
                    <CardTitle>Wirtschaftsgut &amp; Anschaffungsdaten</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                                Wirtschaftsgut-Vorlage (Amtliche BMF AfA-Tabelle)
                            </label>
                            <Select
                                value={selectedPreset}
                                onValueChange={handlePresetChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BMF_ASSET_PRESETS.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{`${p.name} (${p.usefulLifeYears} ${p.usefulLifeYears === 1 ? "Jahr" : "Jahre"})`}</SelectItem>
                                    ))}
                                    <SelectItem value="custom">Individuelle Nutzungsdauer eingeben</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                                Anschaffungskosten Netto (€)
                            </label>
                            <DecimalInput
                                value={netCost}
                                onChange={(v) => setNetCost(v || 0)}
                                style={{ width: "100%" }}
                                precision={2}
                                addonAfter="€"
                            />
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                Brutto (inkl. 19% USt): {calculation.grossCost.toFixed(2)} €
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                                Kaufmonat &amp; Kaufjahr
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 8 }}>
                                <Select
                                    value={String(purchaseMonth)}
                                    onValueChange={(v) => setPurchaseMonth(Number(v))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map((o) => (
                                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <DecimalInput
                                    value={purchaseYear}
                                    onChange={(v) => setPurchaseYear(v || currentYear)}
                                    style={{ width: "100%" }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                                Nutzungsdauer (Jahre)
                            </label>
                            <DecimalInput
                                value={usefulLifeYears}
                                onChange={(v) => setUsefulLifeYears(v || 1)}
                                style={{ width: "100%" }}
                                min={1}
                                max={50}
                            />
                        </div>
                    </div>

                    {/* Tax Note Alert */}
                    <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }}>
                        <Info style={{ color: "#2855d9", marginRight: 8, display: "inline", width: 16, height: 16, verticalAlign: "-3px" }} />
                        {calculation.recommendation}
                    </div>
                </CardContent>
            </Card>

            {/* Amortization Schedule Table */}
            <Card
                style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            >
                <CardHeader>
                    <CardTitle>Vollständiger Abschreibungsplan nach § 7 EStG</CardTitle>
                    <CardAction>
                        <Button variant="outline" onClick={exportCsv} size="sm">
                            <Download />
                            Plan als CSV exportieren
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Wirtschaftsjahr</TableHead>
                                <TableHead>Buchwert Beginn</TableHead>
                                <TableHead>AfA-Betrag</TableHead>
                                <TableHead>Restbuchwert zum 31.12.</TableHead>
                                <TableHead>Monate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {calculation.schedule.map((r) => (
                                <TableRow key={r.year}>
                                    <TableCell><strong>{r.year}</strong></TableCell>
                                    <TableCell>{`${r.openingBookValue.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}</TableCell>
                                    <TableCell>
                                        <span style={{ fontWeight: 700, color: "#2855d9" }}>
                                            {r.depreciationAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span style={{ color: r.closingBookValue === 0 ? "#16a34a" : "#0f172a" }}>
                                            {r.closingBookValue.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                                        </span>
                                    </TableCell>
                                    <TableCell><Badge className={r.monthsDepreciated === 12 ? "bg-blue-600 text-white hover:bg-blue-600" : "bg-orange-500 text-white hover:bg-orange-500"}>{r.monthsDepreciated} / 12</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
