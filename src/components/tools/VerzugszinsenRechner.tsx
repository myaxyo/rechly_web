"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, FileText } from "lucide-react";
import DecimalInput from "@/components/DecimalInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dayjs from "dayjs";
import { calculateVerzugszinsen, BUNDESBANK_BASE_RATES } from "@/lib/tools/verzugszinsen";
import Link from "next/link";


export default function VerzugszinsenRechner() {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const defaultDueStr = dayjs().subtract(45, "day").format("YYYY-MM-DD");

    const [principal, setPrincipal] = useState<number>(2500);
    const [dueDate, setDueDate] = useState<string>(defaultDueStr);
    const [calcDate, setCalcDate] = useState<string>(todayStr);
    const [isB2B, setIsB2B] = useState<boolean>(true);
    const [invoiceNo, setInvoiceNo] = useState<string>("RE-2026-0042");
    const [debtorName, setDebtorName] = useState<string>("Musterkunde GmbH");
    const [copiedText, setCopiedText] = useState(false);

    const result = useMemo(() => {
        return calculateVerzugszinsen(principal, dueDate, calcDate, isB2B);
    }, [principal, dueDate, calcDate, isB2B]);

    // Dunning Letter Template Text (§ 286 / § 288 BGB)
    const dunningLetterText = useMemo(() => {
        const lines = [
            `Mahnung zu Rechnung ${invoiceNo}`,
            `Datum: ${dayjs(calcDate).format("DD.MM.YYYY")}`,
            ``,
            `Sehr geehrte Damen und Herren,`,
            `sehr geehrte(r) Ansprechpartner(in) der ${debtorName},`,
            ``,
            `trotz Fälligkeit zum ${dayjs(dueDate).format("DD.MM.YYYY")} konnten wir für die Rechnung ${invoiceNo} bis heute keinen Zahlungseingang feststellen.`,
            ``,
            `Gemäß §§ 286, 288 BGB befinden Sie sich seit dem ${dayjs(dueDate).add(1, "day").format("DD.MM.YYYY")} im Zahlungsverzug. Wir stellen Ihnen hiermit die gesetzlichen Verzugszinsen sowie ggf. Verzugspauschalen in Rechnung:`,
            ``,
            `1. Hauptforderung (Rechnungsbetrag): ${result.principalAmount.toFixed(2)} €`,
            `2. Gesetzliche Verzugszinsen (${result.totalDays} Tage): ${result.interestAmount.toFixed(2)} €`,
            ...(result.isB2B
                ? [
                      `3. Gesetzliche Verzugspauschale (§ 288 Abs. 5 BGB): ${result.lumpSum40Eur.toFixed(2)} €`,
                  ]
                : []),
            `----------------------------------------------------`,
            `Gesamtforderung: ${result.totalAmountDue.toFixed(2)} €`,
            ``,
            `Wir bitten Sie höflich, den offenen Gesamtbetrag bis zum ${dayjs(calcDate).add(7, "day").format("DD.MM.YYYY")} auf unser Bankkonto zu überweisen.`,
            ``,
            `Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diesen Hinweis bitte als gegenstandslos.`,
            ``,
            `Mit freundlichen Grüßen`,
        ];
        return lines.join("\n");
    }, [invoiceNo, debtorName, dueDate, calcDate, result]);

    const copyDunning = () => {
        if (typeof window !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(dunningLetterText);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2500);
        }
    };


    return (
        <div>
            {/* Input Form & Parameters */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 20,
                    marginBottom: 28 }}
            >
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Fälliger Rechnungsbetrag (EUR) *
                    </label>
                    <DecimalInput
                        min={0.01}
                        max={10000000}
                        step={100}
                        value={principal}
                        onChange={(val) => setPrincipal(val || 0)}
                        style={{ width: "100%" }}
                        addonAfter="€"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Schuldner / Kundentyp (§ 288 BGB) *
                    </label>
                    <RadioGroup value={String(isB2B)} onValueChange={(v) => setIsB2B(v === "true")} className="flex w-full gap-2">
                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-center text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="true" />B2B (Geschäftskunde)</label>
                        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-center text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="false" />B2C (Verbraucher)</label>
                    </RadioGroup>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Ursprüngliches Zahlungsziel (Fälligkeit) *
                    </label>
                    <DatePicker
                        value={dayjs(dueDate)}
                        onChange={(d) => setDueDate(d ? d.format("YYYY-MM-DD") : todayStr)}
                        format="DD.MM.YYYY"
                        style={{ width: "100%" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Berechnungs-Stichtag (Heute)
                    </label>
                    <DatePicker
                        value={dayjs(calcDate)}
                        onChange={(d) => setCalcDate(d ? d.format("YYYY-MM-DD") : todayStr)}
                        format="DD.MM.YYYY"
                        style={{ width: "100%" }}
                    />
                </div>
            </div>

            {/* Results Overview Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginBottom: 32 }}
            >
                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                    <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                        Verzugstage
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                        {result.totalDays} Tage
                    </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                    <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                        Verzugszinsen (§ 288 BGB)
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
                        + {result.interestAmount.toFixed(2)} €
                    </div>
                    </CardContent>
                </Card>

                {isB2B && (
                    <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Mahnpauschale (§ 288 Abs. 5)
                        </span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#059669", marginTop: 4 }}>
                            + 40,00 €
                        </div>
                        </CardContent>
                </Card>
                )}

                <Card
                    style={{
                        borderRadius: 10,
                        border: "2px solid #2855d9",
                        background: "#eff6ff" }}
                >
                    <CardContent>
                    <span style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 800, color: "#1e40af" }}>
                        Gesamtforderung
                    </span>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#2855d9", marginTop: 4 }}>
                        {result.totalAmountDue.toFixed(2)} €
                    </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs: Zinsstaffel vs. Mahnschreiben Generator */}
            <Tabs defaultValue="breakdown">
                <TabsList>
                    <TabsTrigger value="breakdown">Detaillierte Zinsstaffel (Tagesgenau)</TabsTrigger>
                    <TabsTrigger value="dunning">Fertiges Mahnschreiben (Vorlage)</TabsTrigger>
                </TabsList>
                <TabsContent value="breakdown">
                            <div>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Zeitraum</TableHead>
                                            <TableHead>Basiszinssatz</TableHead>
                                            <TableHead>Zinssatz p.a.</TableHead>
                                            <TableHead>Tage</TableHead>
                                            <TableHead>Zinsbetrag</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.periodBreakdown.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.periodLabel}</TableCell>
                                                <TableCell>{row.baseRate.toFixed(2)} %</TableCell>
                                                <TableCell><span style={{ fontWeight: 700, color: "#2855d9" }}>{row.applicableRate.toFixed(2)} %</span></TableCell>
                                                <TableCell>{row.days}</TableCell>
                                                <TableCell><strong>{row.periodInterest.toFixed(2)} €</strong></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                                <div style={{ fontSize: 13, color: "#64748b", marginTop: 12 }}>
                                    Zinsformel nach BGB: Hauptforderung × (Basiszinssatz + {isB2B ? "9%" : "5%"}) × (Tage / 365).
                                    Der aktuelle Bundesbank-Basiszinssatz beträgt {BUNDESBANK_BASE_RATES[0].rate.toFixed(2)} %.
                                </div>
                            </div>
                </TabsContent>
                <TabsContent value="dunning">
                            <div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                                            Rechnungsnummer
                                        </label>
                                        <Input
                                            type="text"
                                            value={invoiceNo}
                                            onChange={(e) => setInvoiceNo(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "6px 12px",
                                                borderRadius: 6,
                                                border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                                            Kundenname / Firma
                                        </label>
                                        <Input
                                            type="text"
                                            value={debtorName}
                                            onChange={(e) => setDebtorName(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "6px 12px",
                                                borderRadius: 6,
                                                border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>

                                <pre
                                    style={{
                                        background: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        padding: 20,
                                        borderRadius: 8,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: "#1e293b",
                                        whiteSpace: "pre-wrap" }}
                                >
                                    {dunningLetterText}
                                </pre>

                                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                    <Button
                                        onClick={copyDunning}
                                        style={{ background: "#2855d9" }}
                                    >
                                        {copiedText ? <Check /> : <Copy />} {copiedText ? "Mahntext kopiert!" : "Mahntext in Zwischenablage kopieren"}
                                    </Button>
                                    <Link href="/tools/mahnung-generator">
                                        <Button variant="outline">
                                            <FileText /> Mahnung in Rechly generieren
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
