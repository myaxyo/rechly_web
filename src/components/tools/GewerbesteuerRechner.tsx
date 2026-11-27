"use client";

import React, { useState, useMemo } from "react";
import DecimalInput from "@/components/DecimalInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TOP_MUNICIPALITIES, calculateGewerbesteuer, GewerbesteuerResult } from "@/lib/tools/taxRates";

export default function GewerbesteuerRechner() {
    const [profit, setProfit] = useState<number>(65000);
    const [entityType, setEntityType] = useState<"freiberufler" | "einzelunternehmen" | "kapitalgesellschaft">(
        "einzelunternehmen"
    );
    const [selectedCity, setSelectedCity] = useState<string>("Berlin");
    const [customHebesatz, setCustomHebesatz] = useState<number>(410);

    const handleCityChange = (cityName: string) => {
        setSelectedCity(cityName);
        const muni = TOP_MUNICIPALITIES.find((m) => m.city === cityName);
        if (muni) {
            setCustomHebesatz(muni.hebesatz);
        }
    };

    const result: GewerbesteuerResult = useMemo(() => {
        return calculateGewerbesteuer(profit, entityType, customHebesatz);
    }, [profit, entityType, customHebesatz]);

    return (
        <div>
            {/* Input Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 20,
                    marginBottom: 28 }}
            >
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Unternehmensform *
                    </label>
                    <Select
                        value={entityType}
                        onValueChange={(v) => setEntityType(v as "freiberufler" | "einzelunternehmen" | "kapitalgesellschaft")}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="einzelunternehmen">Einzelunternehmen / GbR (mit Freibetrag)</SelectItem>
                            <SelectItem value="freiberufler">Freiberufler (§ 18 EStG – steuerbefreit)</SelectItem>
                            <SelectItem value="kapitalgesellschaft">GmbH / UG (kein Freibetrag)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Gewerbeertrag / Jahresgewinn *
                    </label>
                    <DecimalInput
                        min={0}
                        max={100000000}
                        step={5000}
                        value={profit}
                        onChange={(val) => setProfit(val || 0)}
                        style={{ width: "100%" }}
                        addonAfter="€"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Gemeinde / Stadt auswählen:
                    </label>
                    <Select
                        value={selectedCity}
                        onValueChange={handleCityChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TOP_MUNICIPALITIES.map((m) => (
                                <SelectItem key={m.city} value={m.city}>{`${m.city} (${m.hebesatz} %)`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Hebesatz der Gemeinde (%):
                    </label>
                    <DecimalInput
                        min={200}
                        max={900}
                        value={customHebesatz}
                        onChange={(val) => setCustomHebesatz(val || 400)}
                        style={{ width: "100%" }}
                        addonAfter="%"
                    />
                </div>
            </div>

            {/* Results KPI Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginBottom: 28 }}
            >
                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Freibetrag (§ 11 GewStG)
                        </span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#059669", marginTop: 4 }}>
                            {result.allowance.toLocaleString("de-DE")} €
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Steuermessbetrag (3,5%)
                        </span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                            {result.steuermessbetrag.toFixed(2)} €
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Gewerbesteuer
                        </span>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
                            {result.gewerbesteuer.toFixed(2)} €
                        </div>
                    </CardContent>
                </Card>

                <Card
                    style={{
                        borderRadius: 10,
                        border: "2px solid #2855d9",
                        background: "#eff6ff" }}
                >
                    <CardContent>
                        <span style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 800, color: "#1e40af" }}>
                            Effektive Steuerbelastung
                        </span>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#2855d9", marginTop: 4 }}>
                            {result.effectiveBurden.toFixed(2)} €
                        </div>
                        <div style={{ fontSize: 11, color: "#2855d9", marginTop: 2 }}>
                            Nach § 35 EStG Anrechnung
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Explanatory Cards */}
            <Card
                style={{ borderRadius: 12, border: "1px solid #cbd5e1" }}
            >
                <CardHeader>
                    <CardTitle>Erläuterung &amp; Steueranrechnung nach § 35 EStG</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#334155", fontSize: 14, lineHeight: 1.7 }}>
                        {result.notes.map((note, idx) => (
                            <li key={idx} style={{ marginBottom: 6 }}>
                                {note}
                            </li>
                        ))}
                        {entityType === "einzelunternehmen" && result.estAnrechnungMax > 0 && (
                            <li>
                                <strong>Einkommensteuer-Ermäßigung:</strong> Bis zu{" "}
                                <strong>{result.estAnrechnungMax.toFixed(2)} €</strong> können auf deine persönliche
                                Einkommensteuer angerechnet werden.
                            </li>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
