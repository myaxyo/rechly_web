"use client";

import React, { useState, useMemo } from "react";
import { Download, Clock, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTaxDeadlines, generateIcsCalendar, TaxDeadline } from "@/lib/tools/taxDeadlines";


export default function SteuerkalenderRechner({ year = 2026 }: { year?: number } = {}) {
    const [ustInterval, setUstInterval] = useState<"month" | "quarter" | "none">("quarter");
    const [hasDauerfristverlaengerung, setHasDauerfristverlaengerung] = useState<boolean>(true);
    const [isEmployer, setIsEmployer] = useState<boolean>(false);
    const [isGmbH, setIsGmbH] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    const deadlines = useMemo(() => {
        return getTaxDeadlines(year, {
            ustInterval,
            hasDauerfristverlaengerung,
            isEmployer,
            isGmbH });
    }, [year, ustInterval, hasDauerfristverlaengerung, isEmployer, isGmbH]);

    const filteredDeadlines = useMemo(() => {
        if (selectedCategory === "ALL") return deadlines;
        return deadlines.filter((d) => d.category === selectedCategory);
    }, [deadlines, selectedCategory]);

    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

    const downloadIcs = () => {
        const icsContent = generateIcsCalendar(filteredDeadlines, year);
        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Rechly_Steuerkalender_${year}.ics`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (iso: string) => {
        const [y, m, d] = iso.split("-");
        return `${d}.${m}.${y}`;
    };

    const getStatusTag = (dueDate: string) => {
        if (dueDate < todayStr) {
            return <Badge variant="secondary">Vergangen</Badge>;
        }
        const diffDays = Math.floor(
            (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 7) {
            return <Badge variant="destructive"><CircleAlert /> In {diffDays} Tagen fällig</Badge>;
        }
        if (diffDays <= 30) {
            return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Clock /> Diesen Monat</Badge>;
        }
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 /> Geplant</Badge>;
    };

    const getCategoryBadge = (cat: TaxDeadline["category"]) => {
        switch (cat) {
            case "USt":
                return <Badge>Umsatzsteuer</Badge>;
            case "ESt":
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Einkommensteuer</Badge>;
            case "GewSt":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Gewerbesteuer</Badge>;
            case "LSt":
                return <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">Lohnsteuer</Badge>;
            default:
                return <Badge variant="secondary" className="bg-pink-100 text-pink-800 hover:bg-pink-100">Erklärung</Badge>;
        }
    };


    return (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 8px" }}>
            {/* Filter Configuration Card */}
            <Card style={{ marginBottom: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                            USt-Voranmeldung Intervall:
                        </div>
                        <RadioGroup value={ustInterval} onValueChange={(v) => setUstInterval(v as "month" | "quarter" | "none")} className="flex flex-wrap gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="quarter" />Vierteljährlich</label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="month" />Monatlich</label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="none" />Kleinunternehmer (Keine)</label>
                        </RadioGroup>
                    </div>

                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                            Rechtsform / Unternehmenstyp:
                        </div>
                        <RadioGroup value={isGmbH ? "gmbh" : "freelancer"} onValueChange={(v) => setIsGmbH(v === "gmbh")} className="flex flex-wrap gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="freelancer" />Freiberufler / Einzelunternehmer</label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="gmbh" />GmbH / UG (haftungsbeschränkt)</label>
                        </RadioGroup>
                    </div>

                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                            Sonderregelungen & Optionen:
                        </div>
                        <div className="flex flex-col gap-2">
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                                <Switch
                                    checked={hasDauerfristverlaengerung}
                                    onCheckedChange={setHasDauerfristverlaengerung}
                                />
                                <span>Dauerfristverlängerung (§ 46 UStDV, +1 Monat)</span>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                                <Switch
                                    checked={isEmployer}
                                    onCheckedChange={setIsEmployer}
                                />
                                <span>Arbeitgeber (Lohnsteuer-Anmeldung)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </CardContent>
            </Card>

            {/* Quick Actions & Category Filter */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 16 }}
            >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Button
                        variant={selectedCategory === "ALL" ? "default" : "outline"} size="sm"
                        onClick={() => setSelectedCategory("ALL")}
                    >
                        Alle ({deadlines.length})
                    </Button>
                    <Button
                        variant={selectedCategory === "USt" ? "default" : "outline"} size="sm"
                        onClick={() => setSelectedCategory("USt")}
                    >
                        Umsatzsteuer
                    </Button>
                    <Button
                        variant={selectedCategory === "ESt" ? "default" : "outline"} size="sm"
                        onClick={() => setSelectedCategory("ESt")}
                    >
                        Einkommensteuer
                    </Button>
                    <Button
                        variant={selectedCategory === "GewSt" ? "default" : "outline"} size="sm"
                        onClick={() => setSelectedCategory("GewSt")}
                    >
                        Gewerbesteuer
                    </Button>
                    {isEmployer && (
                        <Button
                            variant={selectedCategory === "LSt" ? "default" : "outline"} size="sm"
                            onClick={() => setSelectedCategory("LSt")}
                        >
                            Lohnsteuer
                        </Button>
                    )}
                </div>

                <Button
                    onClick={downloadIcs}
                    style={{ background: "#2855d9", borderColor: "#2855d9", fontWeight: 600 }}
                >
                    <Download /> Kalenderdatei (.ics) herunterladen
                </Button>
            </div>

            {/* Table of Deadlines */}
            <Card style={{ borderRadius: 12, border: "1px solid #e2e8f0", overflowX: "auto" }}>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead style={{ width: 170 }}>Fälligkeit (Zahlung)</TableHead>
                            <TableHead>Steuerart &amp; Bezeichnung</TableHead>
                            <TableHead style={{ width: 160 }}>Schonfrist (§ 240 AO)</TableHead>
                            <TableHead style={{ width: 140 }}>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDeadlines.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{formatDate(record.dueDate)}</div>
                                        {record.nominalDate !== record.dueDate && (
                                            <div style={{ fontSize: 11, color: "#64748b" }}>Verschoben von {formatDate(record.nominalDate)} (§ 108 AO)</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                                            {getCategoryBadge(record.category)}
                                            <strong style={{ fontSize: 14, color: "#0f172a" }}>{record.title}</strong>
                                        </div>
                                        <div style={{ fontSize: 13, color: "#475569" }}>{record.description}</div>
                                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Rechtsgrundlage: {record.legalBasis}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "#059669" }}>bis {formatDate(record.schonfristDate)}</div>
                                        <div style={{ fontSize: 11, color: "#64748b" }}>Überweisungsgutschrift</div>
                                    </div>
                                </TableCell>
                                <TableCell>{getStatusTag(record.dueDate)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            {/* Statutory Legal Tip Box */}
            <div
                style={{
                    marginTop: 20,
                    padding: 16,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#166534",
                    display: "flex",
                    gap: 12 }}
            >
                <Info style={{ width: 18, height: 18, color: "#16a34a", marginTop: 2, flexShrink: 0 }} />
                <div>
                    <strong>Tipp zur 3-Tage-Schonfrist nach § 240 Abs. 3 AO:</strong> Bei Banküberweisungen gilt
                    die Zahlung erst dann als säumig, wenn sie nicht innerhalb von drei Tagen nach Ablauf des
                    Fälligkeitstags eingeht. Fällt der letzte Tag der Schonfrist auf ein Wochenende oder einen
                    Feiertag, verlängert sich der Zahlungszeitraum bis zum nächsten Werktag.
                </div>
            </div>
        </div>
    );
}
