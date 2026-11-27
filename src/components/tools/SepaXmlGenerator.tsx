"use client";

import React, { useState, useMemo } from "react";
import { Download, Plus, Trash2, ShieldCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import DecimalInput from "@/components/DecimalInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateSepaXml, SepaTransaction, SepaXmlInput } from "@/lib/tools/sepaXml";


export default function SepaXmlGenerator() {
    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

    const [type, setType] = useState<"pain.001" | "pain.008">("pain.001");
    const [initiatorName, setInitiatorName] = useState<string>("Musterfirma GmbH");
    const [senderIban, setSenderIban] = useState<string>("DE89 3704 0044 0532 0130 00");
    const [senderBic, setSenderBic] = useState<string>("COBADEFFXXX");
    const [creditorId, setCreditorId] = useState<string>("DE98ZZZ09999999999");
    const [executionDate, setExecutionDate] = useState<string>(todayStr);

    const [transactions, setTransactions] = useState<SepaTransaction[]>([
        {
            id: "tx-1",
            recipientName: "Anna Schmidt Webdesign",
            iban: "DE02 1001 0010 0123 4567 89",
            bic: "PBNKDEFFXXX",
            amount: 850.0,
            remittanceInfo: "Rechnung RE-2026-104",
            mandateId: "MANDAT-001",
            mandateDate: "2025-05-10" },
        {
            id: "tx-2",
            recipientName: "Cloud Server Hosting GmbH",
            iban: "DE44 5001 0517 5423 6589 12",
            bic: "HELADEF1822",
            amount: 129.5,
            remittanceInfo: "Server Miete März 2026",
            mandateId: "MANDAT-002",
            mandateDate: "2025-06-15" },
    ]);

    const [copiedXml, setCopiedXml] = useState<boolean>(false);

    const sepaResult = useMemo(() => {
        const input: SepaXmlInput = {
            type,
            initiatorName,
            senderIban,
            senderBic,
            creditorId: type === "pain.008" ? creditorId : undefined,
            executionDate,
            transactions };
        return generateSepaXml(input);
    }, [type, initiatorName, senderIban, senderBic, creditorId, executionDate, transactions]);

    const addTransaction = () => {
        const newTx: SepaTransaction = {
            id: `tx-${Date.now()}`,
            recipientName: "",
            iban: "",
            amount: 100.0,
            remittanceInfo: "Rechnung",
            mandateId: `MANDAT-${transactions.length + 1}`,
            mandateDate: executionDate };
        setTransactions([...transactions, newTx]);
    };

    const removeTransaction = (id: string) => {
        if (transactions.length <= 1) {
            toast.warning("Mindestens eine Position muss vorhanden sein.");
            return;
        }
        setTransactions(transactions.filter((t) => t.id !== id));
    };

    const updateTransaction = (id: string, field: keyof SepaTransaction, value: unknown) => {
        setTransactions(
            transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t))
        );
    };

    const downloadXml = () => {
        if (sepaResult.error || !sepaResult.xml) {
            toast.error(sepaResult.error || "Fehler beim Erzeugen der XML-Datei.");
            return;
        }
        const blob = new Blob([sepaResult.xml], { type: "application/xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SEPA_${type.replace(".", "_")}_${executionDate}.xml`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("SEPA XML-Datei erfolgreich heruntergeladen!");
    };

    const copyXml = () => {
        if (!sepaResult.xml) return;
        navigator.clipboard.writeText(sepaResult.xml);
        setCopiedXml(true);
        toast.success("XML-Inhalt kopiert!");
        setTimeout(() => setCopiedXml(false), 3000);
    };

    return (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 8px" }}>
            {/* Header / Security Badge */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 20,
                    fontSize: 13,
                    color: "#166534" }}
            >
                <ShieldCheck style={{ width: 20, height: 20, color: "#16a34a", flexShrink: 0 }} />
                <span>
                    <strong>100 % Lokale Generierung im Browser:</strong> Ihre Bankverbindungen, Beträge und
                    Personendaten werden rein client-seitig verarbeitet und niemals auf externe Server übertragen.
                </span>
            </div>

            {/* Type & Sender Config */}
            <Card style={{ borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
                <CardHeader><CardTitle>1. Auftragsart &amp; Kontoinhaber</CardTitle></CardHeader>
                <CardContent>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
                        Format auswählen:
                    </div>
                    <RadioGroup value={type} onValueChange={(v) => setType(v as "pain.001" | "pain.008")} className="flex flex-wrap gap-2">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="pain.001" />pain.001 (SEPA-Sammelüberweisung / Überweisung)</label>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroupItem value="pain.008" />pain.008 (SEPA-Basislastschrift CORE / Lastschrift)</label>
                    </RadioGroup>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                            {type === "pain.001" ? "Auftraggeber Name" : "Gläubiger Name"}
                        </label>
                        <Input value={initiatorName} onChange={(e) => setInitiatorName(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                            Ihre IBAN (Belastungs-/Gutschriftskonto)
                        </label>
                        <Input value={senderIban} onChange={(e) => setSenderIban(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                            Ihre BIC
                        </label>
                        <Input value={senderBic} onChange={(e) => setSenderBic(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                            Ausführungsdatum
                        </label>
                        <Input type="date" value={executionDate} onChange={(e) => setExecutionDate(e.target.value)} />
                    </div>

                    {type === "pain.008" && (
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                                Gläubiger-ID (Deutsche Bundesbank)
                            </label>
                            <Input value={creditorId} onChange={(e) => setCreditorId(e.target.value)} placeholder="DE98ZZZ09999999999" />
                        </div>
                    )}
                </div>
            </CardContent>
            </Card>

            {/* Transactions List */}
            <Card style={{ borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>
                            2. Zahlungspositionen ({transactions.length} Posten • Gesamt:{" "}
                            {sepaResult.controlSum.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €)
                    </CardTitle>
                        <Button variant="outline" size="sm" onClick={addTransaction}>
                            <Plus /> Position hinzufügen
                        </Button>
                </CardHeader>
                <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: type === "pain.008" ? "1.5fr 1.5fr 0.8fr 1fr 1fr auto" : "1.5fr 1.5fr 0.8fr 1.5fr auto",
                                gap: 8,
                                alignItems: "center",
                                padding: 12,
                                background: "#f8fafc",
                                borderRadius: 8,
                                border: "1px solid #e2e8f0" }}
                        >
                            <div>
                                <label style={{ fontSize: 11, color: "#64748b" }}>Empfänger / Zahlungspflichtiger</label>
                                <Input
                                    
                                    value={tx.recipientName}
                                    placeholder="Name oder Firma"
                                    onChange={(e) => updateTransaction(tx.id, "recipientName", e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: "#64748b" }}>IBAN</label>
                                <Input
                                    
                                    value={tx.iban}
                                    placeholder="DE..."
                                    onChange={(e) => updateTransaction(tx.id, "iban", e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: "#64748b" }}>Betrag (€)</label>
                                <DecimalInput
                                    
                                    value={tx.amount}
                                    precision={2}
                                    style={{ width: "100%" }}
                                    onChange={(v) => updateTransaction(tx.id, "amount", v || 0)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 11, color: "#64748b" }}>Verwendungszweck</label>
                                <Input
                                    
                                    value={tx.remittanceInfo}
                                    placeholder="Rechnungsnummer"
                                    onChange={(e) => updateTransaction(tx.id, "remittanceInfo", e.target.value)}
                                />
                            </div>

                            {type === "pain.008" && (
                                <div>
                                    <label style={{ fontSize: 11, color: "#64748b" }}>Mandats-ID</label>
                                    <Input
                                        
                                        value={tx.mandateId}
                                        onChange={(e) => updateTransaction(tx.id, "mandateId", e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeTransaction(tx.id)} style={{ marginTop: 14 }}><Trash2 /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            </Card>

            {/* XML Generation & Download Action */}
            <Card style={{ borderRadius: 12, border: "1px solid #bfdbfe", background: "#f8fafc" }}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>3. Standardkonforme ISO 20022 XML-Datei herunterladen</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyXml}>
                            {copiedXml ? <Check /> : <Copy />} {copiedXml ? "Kopiert" : "XML kopieren"}
                        </Button>
                        <Button onClick={downloadXml} style={{ background: "#2855d9", borderColor: "#2855d9", fontWeight: 600 }}>
                            <Download /> XML herunterladen (.xml)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
                    <Badge>{type === "pain.001" ? "pain.001.001.03" : "pain.008.001.02"}</Badge>
                    <span style={{ fontSize: 13, color: "#475569" }}>
                        Anzahl Posten: <strong>{sepaResult.count}</strong>
                    </span>
                    <span style={{ fontSize: 13, color: "#475569" }}>
                        Kontrollsumme: <strong>{sepaResult.controlSum.toFixed(2)} €</strong>
                    </span>
                </div>

                <div
                    style={{
                        background: "#0f172a",
                        color: "#f8fafc",
                        padding: 16,
                        borderRadius: 8,
                        maxHeight: 280,
                        overflowY: "auto",
                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap" }}
                >
                    {sepaResult.xml}
                </div>
            </CardContent>
            </Card>
        </div>
    );
}
