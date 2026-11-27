"use client";

import React, { useState, useMemo } from "react";
import DecimalInput from "@/components/DecimalInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function SkontoRechner() {
    const [grossAmount, setGrossAmount] = useState<number>(3500);
    const [skontoPercent, setSkontoPercent] = useState<number>(2.0);
    const [skontoDays, setSkontoDays] = useState<number>(10);
    const [netDays, setNetDays] = useState<number>(30);
    const [vatRate, setVatRate] = useState<number>(19);
    const [bankInterestRate, setBankInterestRate] = useState<number>(9.5);

    const calc = useMemo(() => {
        const daysDifference = Math.max(1, netDays - skontoDays);
        const discountAmount = Math.round(grossAmount * (skontoPercent / 100) * 100) / 100;
        const discountedGross = Math.round((grossAmount - discountAmount) * 100) / 100;

        // Effective annual interest rate: (Skonto / (100 - Skonto)) * (360 / DifferenceDays) * 100
        const effectiveAnnualRate =
            skontoPercent < 100
                ? (skontoPercent / (100 - skontoPercent)) * (360 / daysDifference) * 100
                : 0;

        // VAT / Vorsteuer correction under § 17 UStG
        const netDiscount = discountAmount / (1 + vatRate / 100);
        const vatDiscount = discountAmount - netDiscount;

        // Cost of short-term bank borrowing for the daysDifference
        const bankInterestCost = (discountedGross * (bankInterestRate / 100) * daysDifference) / 360;
        const netProfitTakingCredit = discountAmount - bankInterestCost;

        return {
            discountAmount,
            discountedGross,
            effectiveAnnualRate: Math.round(effectiveAnnualRate * 100) / 100,
            daysDifference,
            netDiscount: Math.round(netDiscount * 100) / 100,
            vatDiscount: Math.round(vatDiscount * 100) / 100,
            bankInterestCost: Math.round(bankInterestCost * 100) / 100,
            netProfitTakingCredit: Math.round(netProfitTakingCredit * 100) / 100,
            worthBankCredit: netProfitTakingCredit > 0 };
    }, [grossAmount, skontoPercent, skontoDays, netDays, vatRate, bankInterestRate]);

    return (
        <div>
            {/* Input Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 20,
                    marginBottom: 28 }}
            >
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Rechnungsbetrag (Brutto) *
                    </label>
                    <DecimalInput
                        min={1}
                        max={10000000}
                        step={50}
                        value={grossAmount}
                        onChange={(val) => setGrossAmount(val || 0)}
                        style={{ width: "100%" }}
                        addonAfter="€"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Skonto-Satz (%) *
                    </label>
                    <DecimalInput
                        min={0.1}
                        max={20}
                        step={0.5}
                        value={skontoPercent}
                        onChange={(val) => setSkontoPercent(val || 0)}
                        style={{ width: "100%" }}
                        addonAfter="%"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Skontofrist (Tage)
                    </label>
                    <DecimalInput
                        min={1}
                        max={60}
                        value={skontoDays}
                        onChange={(val) => setSkontoDays(val || 1)}
                        style={{ width: "100%" }}
                        addonAfter="Tage"
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                        Netto-Zahlungsziel (Tage)
                    </label>
                    <DecimalInput
                        min={skontoDays + 1}
                        max={180}
                        value={netDays}
                        onChange={(val) => setNetDays(val || 30)}
                        style={{ width: "100%" }}
                        addonAfter="Tage"
                    />
                </div>
            </div>

            {/* Main Calculated Results */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    marginBottom: 32 }}
            >
                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Reine Skonto-Ersparnis
                        </span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#059669", marginTop: 4 }}>
                            {calc.discountAmount.toFixed(2)} €
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Direkter Rabatt bei Zahlung in {skontoDays} Tagen
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <CardContent>
                        <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                            Überweisungsbetrag
                        </span>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>
                            {calc.discountedGross.toFixed(2)} €
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Statt {grossAmount.toFixed(2)} € brutto
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
                            Effektiver Jahreszins (p. a.)
                        </span>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#2855d9", marginTop: 4 }}>
                            {calc.effectiveAnnualRate.toFixed(1)} %
                        </div>
                        <div style={{ fontSize: 12, color: "#2855d9", marginTop: 2 }}>
                            Vergleichszins für {calc.daysDifference} Tage Kreditfrist
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bank Credit Comparison & § 17 UStG Tax Correction */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                {/* Arbitrage / Bank Credit Analysis */}
                <Card
                    style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                >
                    <CardHeader>
                        <CardTitle>Lohnt sich die Zahlung per Bankkredit (Dispo / Kontokorrent)?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                                Angenommener Kontokorrentzins deiner Bank (% p. a.):
                            </label>
                            <DecimalInput
                                min={1}
                                max={30}
                                step={0.5}
                                value={bankInterestRate}
                                onChange={(val) => setBankInterestRate(val || 9)}
                                addonAfter="%"
                            />
                        </div>

                        <div
                            style={{
                                background: calc.worthBankCredit ? "#f0fdf4" : "#fef2f2",
                                border: calc.worthBankCredit ? "1px solid #86efac" : "1px solid #fca5a5",
                                borderRadius: 8,
                                padding: "16px",
                                marginBottom: 16 }}
                        >
                            <div style={{ fontWeight: 800, fontSize: 16, color: calc.worthBankCredit ? "#15803d" : "#b91c1c" }}>
                                {calc.worthBankCredit
                                    ? "Ja, Skonto unbedingt nutzen!"
                                    : "Nein, Skonto lohnt sich nicht."}
                            </div>
                            <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                                Selbst wenn du für {calc.daysDifference} Tage dein Bankkonto überziehst (Zinskosten:{" "}
                                {calc.bankInterestCost.toFixed(2)} €), sparst du unterm Strich noch immer{" "}
                                <strong>+{calc.netProfitTakingCredit.toFixed(2)} € Reingewinn</strong>!
                            </p>
                        </div>

                        <div style={{ fontSize: 13, color: "#64748b" }}>
                            <strong>Faustregel für Unternehmer:</strong> Da der effektive Skontozins fast immer über 25 % bis
                            50 % p. a. liegt, ist Skonto der teuerste Lieferantenkredit am Markt. Nutze Skonto immer, solange
                            dein Bankzins darunter liegt.
                        </div>
                    </CardContent>
                </Card>

                {/* Tax Correction under § 17 UStG */}
                <Card
                    style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                >
                    <CardHeader>
                        <CardTitle>Steuerliche Auswirkung &amp; Vorsteuerkorrektur (§ 17 UStG)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: "#64748b" }}>Steuersatz der Rechnung:</span>{" "}
                            <RadioGroup
                                value={String(vatRate)}
                                onValueChange={(v) => setVatRate(Number(v))}
                                className="flex flex-row flex-wrap items-center gap-4"
                                style={{ marginLeft: 8, display: "inline-flex" }}
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="19" id="skonto-vat-19" />
                                    <Label htmlFor="skonto-vat-19">19 %</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="7" id="skonto-vat-7" />
                                    <Label htmlFor="skonto-vat-7">7 %</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="0" id="skonto-vat-0" />
                                    <Label htmlFor="skonto-vat-0">0 % (z. B. § 19 UStG)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Minderung des Nettoaufwands:</span>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>- {calc.netDiscount.toFixed(2)} €</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Korrektur des Vorsteuerabzugs (§ 17 Abs. 1):</span>
                                <span style={{ fontWeight: 700, color: "#dc2626" }}>- {calc.vatDiscount.toFixed(2)} €</span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    borderTop: "1px solid #e2e8f0",
                                    paddingTop: 8 }}
                            >
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>Gesamte Entlastung:</span>
                                <span style={{ fontWeight: 800, color: "#059669" }}>- {calc.discountAmount.toFixed(2)} €</span>
                            </div>
                        </div>

                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 16 }}>
                            Bei Skontoabzug muss nach § 17 Abs. 1 UStG die in der Voranmeldung geltend gemachte Vorsteuer
                            entsprechend korrigiert werden.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
