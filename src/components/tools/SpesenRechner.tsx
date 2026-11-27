"use client";

import React, { useState, useMemo } from "react";
import { Printer } from "lucide-react";
import DecimalInput from "@/components/DecimalInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POPULAR_PER_DIEMS, CountryPerDiem } from "@/lib/tools/taxRates";


export default function SpesenRechner() {
    const [destination, setDestination] = useState<string>("Deutschland");
    const [fullDays, setFullDays] = useState<number>(2); // 2 full 24h days
    const [hasArrivalDay, setHasArrivalDay] = useState<boolean>(true); // Anreisetag
    const [hasDepartureDay, setHasDepartureDay] = useState<boolean>(true); // Abreisetag
    const [breakfastCount, setBreakfastCount] = useState<number>(2);
    const [lunchCount, setLunchCount] = useState<number>(1);
    const [dinnerCount, setDinnerCount] = useState<number>(0);

    const currentRates: CountryPerDiem = useMemo(() => {
        return POPULAR_PER_DIEMS.find((d) => d.country === destination) || POPULAR_PER_DIEMS[0];
    }, [destination]);

    const calc = useMemo(() => {
        const fullDayRate = currentRates.fullDay;
        const partialDayRate = currentRates.partialDay;

        const partialDaysCount = (hasArrivalDay ? 1 : 0) + (hasDepartureDay ? 1 : 0);
        const grossPerDiem = fullDays * fullDayRate + partialDaysCount * partialDayRate;

        // Statutory deduction per provided meal based on the full 24h per-diem rate:
        // Breakfast: 20% of full-day allowance
        // Lunch: 40% of full-day allowance
        // Dinner: 40% of full-day allowance
        const breakfastDeduction = breakfastCount * (fullDayRate * 0.20);
        const lunchDeduction = lunchCount * (fullDayRate * 0.40);
        const dinnerDeduction = dinnerCount * (fullDayRate * 0.40);

        const totalDeductions = breakfastDeduction + lunchDeduction + dinnerDeduction;
        const netPerDiemClaim = Math.max(0, grossPerDiem - totalDeductions);

        return {
            fullDayRate,
            partialDayRate,
            grossPerDiem: Math.round(grossPerDiem * 100) / 100,
            breakfastDeduction: Math.round(breakfastDeduction * 100) / 100,
            lunchDeduction: Math.round(lunchDeduction * 100) / 100,
            dinnerDeduction: Math.round(dinnerDeduction * 100) / 100,
            totalDeductions: Math.round(totalDeductions * 100) / 100,
            netPerDiemClaim: Math.round(netPerDiemClaim * 100) / 100 };
    }, [currentRates, fullDays, hasArrivalDay, hasDepartureDay, breakfastCount, lunchCount, dinnerCount]);

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    return (
        <div>
            {/* Travel Parameter Inputs */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 20,
                    marginBottom: 28 }}
            >
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Reiseziel (Land / Stadt) *
                    </label>
                    <Select value={destination} onValueChange={setDestination}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {POPULAR_PER_DIEMS.map((p) => (
                                <SelectItem key={p.country} value={p.country}>{p.country} ({p.fullDay} € / 24h)</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Ganztägige Abwesenheit (24h Tage)
                    </label>
                    <DecimalInput
                        min={0}
                        max={60}
                        value={fullDays}
                        onChange={(val) => setFullDays(val || 0)}
                        style={{ width: "100%" }}
                        addonAfter="Tage"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#334155" }}>
                        Anreise- & Abreisetag (&gt; 8h oder Teiltag):
                    </label>
                    <div style={{ display: "flex", gap: 16 }}>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasArrivalDay} onCheckedChange={(c) => setHasArrivalDay(c === true)} />Anreisetag ({currentRates.partialDay} €)</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasDepartureDay} onCheckedChange={(c) => setHasDepartureDay(c === true)} />Abreisetag ({currentRates.partialDay} €)</label>
                    </div>
                </div>
            </div>

            {/* Meal Deductions (§ 9 Abs. 4a EStG) */}
            <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 28 }}>
                <CardHeader><CardTitle>Mahlzeitengestellung durch Kunde oder Hotel (Kürzung nach EStG)</CardTitle></CardHeader>
                <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                            Erhaltene Frühstücke (-20% = -{(currentRates.fullDay * 0.2).toFixed(2)} €):
                        </label>
                        <DecimalInput
                            min={0}
                            max={60}
                            value={breakfastCount}
                            onChange={(val) => setBreakfastCount(val || 0)}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                            Erhaltene Mittagessen (-40% = -{(currentRates.fullDay * 0.4).toFixed(2)} €):
                        </label>
                        <DecimalInput
                            min={0}
                            max={60}
                            value={lunchCount}
                            onChange={(val) => setLunchCount(val || 0)}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                            Erhaltene Abendessen (-40% = -{(currentRates.fullDay * 0.4).toFixed(2)} €):
                        </label>
                        <DecimalInput
                            min={0}
                            max={60}
                            value={dinnerCount}
                            onChange={(val) => setDinnerCount(val || 0)}
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>
            </CardContent>
            </Card>

            {/* Results Overview */}
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
                        Brutto-Verpflegungspauschale
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                        {calc.grossPerDiem.toFixed(2)} €
                    </div>
                    </CardContent>
            </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                    <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                        Gesetzliche Mahlzeitenkürzung
                    </span>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
                        - {calc.totalDeductions.toFixed(2)} €
                    </div>
                    </CardContent>
            </Card>

                <Card
                    style={{
                        borderRadius: 10,
                        border: "2px solid #16a34a",
                        background: "#f0fdf4" }}
                >
                    <CardContent>
                    <span style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 800, color: "#166534" }}>
                        Steuerfreier Spesenanspruch
                    </span>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#15803d", marginTop: 4 }}>
                        {calc.netPerDiemClaim.toFixed(2)} €
                    </div>
                    <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                        Steuerfreie Betriebsausgabe / Erstattung
                    </div>
                    </CardContent>
            </Card>
            </div>

            {/* Print Action */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={handlePrint} style={{ background: "#2855d9" }}>
                    <Printer />
                    Reisekostenabrechnung drucken
                </Button>
            </div>
        </div>
    );
}
