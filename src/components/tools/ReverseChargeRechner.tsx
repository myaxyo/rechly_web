"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
    evaluateReverseCharge,
    RecipientLocation,
    RecipientType,
    ServiceType } from "@/lib/tools/reverseCharge";
import Link from "next/link";


export default function ReverseChargeRechner() {
    const [recipientLocation, setRecipientLocation] = useState<RecipientLocation>("eu");
    const [recipientType, setRecipientType] = useState<RecipientType>("b2b");
    const [serviceType, setServiceType] = useState<ServiceType>("digital_consulting");
    const [countryName] = useState<string>("Frankreich");
    const [copiedDe, setCopiedDe] = useState<boolean>(false);
    const [copiedEn, setCopiedEn] = useState<boolean>(false);

    const evaluation = useMemo(() => {
        return evaluateReverseCharge({
            recipientLocation,
            recipientType,
            serviceType,
            countryName });
    }, [recipientLocation, recipientType, serviceType, countryName]);

    const copyDe = () => {
        navigator.clipboard.writeText(evaluation.mandatoryInvoiceNoteDe);
        setCopiedDe(true);
        toast.success("Deutscher Pflichttext kopiert!");
        setTimeout(() => setCopiedDe(false), 3000);
    };

    const copyEn = () => {
        navigator.clipboard.writeText(evaluation.mandatoryInvoiceNoteEn);
        setCopiedEn(true);
        toast.success("Englischer Pflichttext kopiert!");
        setTimeout(() => setCopiedEn(false), 3000);
    };

    return (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 8px" }}>
            {/* Step Configuration Wizard */}
            <Card style={{ marginBottom: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <CardContent>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                        {/* Step 1: Location */}
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                                1. Wo sitzt Ihr Auftraggeber?
                            </div>
                            <RadioGroup
                                value={recipientLocation}
                                onValueChange={(v) => setRecipientLocation(v as RecipientLocation)}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="germany" id="rc-location-germany" />
                                    <Label htmlFor="rc-location-germany">Deutschland (Inland)</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="eu" id="rc-location-eu" />
                                    <Label htmlFor="rc-location-eu">EU-Ausland (z. B. Frankreich, Österreich, Spanien)</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="third_country" id="rc-location-third_country" />
                                    <Label htmlFor="rc-location-third_country">Drittland (z. B. Schweiz, USA, UK)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Step 2: Customer Type */}
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                                2. Handelt es sich um B2B oder B2C?
                            </div>
                            <RadioGroup
                                value={recipientType}
                                onValueChange={(v) => setRecipientType(v as RecipientType)}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="b2b" id="rc-type-b2b" />
                                    <Label htmlFor="rc-type-b2b">
                                        Unternehmen / B2B (mit gültiger USt-IdNr.)
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="b2c" id="rc-type-b2c" />
                                    <Label htmlFor="rc-type-b2c">
                                        Endverbraucher / Privatkunde (B2C)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Step 3: Service Type */}
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                                3. Art der erbrachten Leistung:
                            </div>
                            <RadioGroup
                                value={serviceType}
                                onValueChange={(v) => setServiceType(v as ServiceType)}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="digital_consulting" id="rc-service-digital_consulting" />
                                    <Label htmlFor="rc-service-digital_consulting">
                                        IT, Beratung, Design, Software (Sonstige Leistung)
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="construction" id="rc-service-construction" />
                                    <Label htmlFor="rc-service-construction">
                                        Bauleistung / Handwerk an Grundstück (§ 13b)
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="goods" id="rc-service-goods" />
                                    <Label htmlFor="rc-service-goods">
                                        Physische Warenlieferung
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Evaluation Results Card */}
            <Card
                style={{
                    borderRadius: 12,
                    border: evaluation.vatRatePercent === 0 ? "1px solid #bbf7d0" : "1px solid #bfdbfe",
                    background: evaluation.vatRatePercent === 0 ? "#f0fdf4" : "#eff6ff",
                    marginBottom: 24 }}
            >
                <CardContent>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <Badge
                                className={evaluation.vatRatePercent === 0 ? "bg-green-600 text-white hover:bg-green-600" : "bg-blue-600 text-white hover:bg-blue-600"}
                                style={{ fontSize: 13, padding: "4px 10px", fontWeight: 700 }}
                            >
                                {evaluation.vatRatePercent === 0
                                    ? "REVERSE CHARGE / NETTO (0 % USt)"
                                    : "REGULÄRE UMSATZSTEUER (19 %)"}
                            </Badge>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "12px 0 6px" }}>
                                {evaluation.vatRatePercent === 0
                                    ? "Keine deutsche Umsatzsteuer ausweisen"
                                    : "Deutsche Umsatzsteuer mit 19 % berechnen"}
                            </h2>
                            <div style={{ fontSize: 14, color: "#334155", maxWidth: 700 }}>
                                {evaluation.explanation}
                            </div>
                        </div>

                        <div style={{ background: "#ffffff", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0", minWidth: 220 }}>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>ELSTER-Kennziffer</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#2855d9", marginTop: 2 }}>
                                {evaluation.elsterKennziffer}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>Meldepflicht</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: evaluation.reportingZmRequired ? "#dc2626" : "#059669" }}>
                                {evaluation.reportingZmRequired ? "Zusammenfassende Meldung (ZM)" : "Keine ZM-Meldung"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mandatory Invoice Clauses Box */}
            <Card
                style={{ borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24 }}
            >
                <CardHeader>
                    <CardTitle>Gesetzliche Pflichtangaben für Ihre Rechnung</CardTitle>
                </CardHeader>
                <CardContent>
                    {evaluation.requiredVatIdDebtor && (
                        <Alert
                            className="border-amber-300 bg-amber-50 text-amber-900 [&_[data-slot=alert-description]]:text-amber-900"
                            style={{ marginBottom: 16 }}
                        >
                            <AlertTriangle />
                            <AlertTitle>Qualifizierte Prüfung der USt-IdNr. zwingend erforderlich!</AlertTitle>
                            <AlertDescription>
                                <div>
                                    Im EU-B2B-Verkehr müssen Sie die ausländische Umsatzsteuer-Identifikationsnummer Ihres
                                    Kunden vor der Rechnungsstellung zwingend im VIES-System prüfen und den Nachweis 10 Jahre aufbewahren.
                                    <div style={{ marginTop: 8 }}>
                                        <Link href="/tools/ust-idnr-pruefen" style={{ fontWeight: 600, color: "#2855d9" }}>
                                            Jetzt USt-IdNr. kostenlos im Rechly VIES-Prüfer verifizieren →
                                        </Link>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                                Rechnungstext auf Deutsch (Pflichtangabe nach § 14 Abs. 4 i.V.m. § 14a UStG):
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyDe}
                            >
                                {copiedDe ? <Check /> : <Copy />}
                                {copiedDe ? "Kopiert" : "Kopieren"}
                            </Button>
                        </div>
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, fontFamily: "monospace", color: "#0f172a" }}>
                            {evaluation.mandatoryInvoiceNoteDe}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                                Rechnungstext auf Englisch (für internationale Kunden):
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyEn}
                            >
                                {copiedEn ? <Check /> : <Copy />}
                                {copiedEn ? "Kopiert" : "Kopieren"}
                            </Button>
                        </div>
                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, fontFamily: "monospace", color: "#0f172a" }}>
                            {evaluation.mandatoryInvoiceNoteEn}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Chaining Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div>
                    <strong style={{ display: "block", color: "#0f172a" }}>Internationale Rechnungen mit Rechly erstellen?</strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                        Rechly unterstützt automatisch Reverse Charge Klauseln, ZUGFeRD und XRechnung.
                    </span>
                </div>
                <Link href="/register">
                    <Button style={{ background: "#2855d9", borderColor: "#2855d9" }}>
                        Kostenlos starten
                    </Button>
                </Link>
            </div>
        </div>
    );
}
