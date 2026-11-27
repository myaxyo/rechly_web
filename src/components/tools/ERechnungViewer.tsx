"use client";

import React, { useState } from "react";
import { Inbox, FileText, QrCode, Download, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    parseEInvoiceXml,
    extractZugferdXmlFromPdfBytesAsync,
} from "@/lib/eInvoiceParserClient";
import type { ParsedEInvoice } from "@/lib/eInvoiceParser";
import Link from "next/link";


export default function ERechnungViewer() {
    const [, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const [parsedData, setParsedData] = useState<ParsedEInvoice | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [rawXml, setRawXml] = useState<string>("");
    const [showRawModal, setShowRawModal] = useState(false);

    const handleFile = async (file: File) => {
        setLoading(true);
        setErrorMsg(null);
        setFileName(file.name);
        setParsedData(null);
        setRawXml("");

        try {
            const isPdf = file.name.toLowerCase().endsWith(".pdf");
            let xmlContent = "";

            if (isPdf) {
                const arrayBuffer = await file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                const extractedXml = await extractZugferdXmlFromPdfBytesAsync(bytes);
                if (!extractedXml) {
                    throw new Error(
                        "In dieser PDF-Datei wurde keine eingebettete ZUGFeRD- oder Factur-X-XML gefunden. Eine gewöhnliche PDF-Rechnung ohne eingebetteten XML-Datensatz ist keine ZUGFeRD-Datei."
                    );
                }
                xmlContent = extractedXml;
            } else {
                xmlContent = await file.text();
            }

            setRawXml(xmlContent);
            const parsed = parseEInvoiceXml(xmlContent);
            if (!parsed.invoice_number && !parsed.amount_gross && !parsed.vendor_name) {
                throw new Error(
                    "In dieser XML-Datei wurden keine unterstützten Rechnungsdaten gefunden."
                );
            }
            setParsedData(parsed);
        } catch (err: unknown) {
            console.error("E-Invoice parsing error:", err);
            const message = err instanceof Error ? err.message : "Fehler beim Lesen der E-Rechnungsdatei.";
            setErrorMsg(message);
            setParsedData(null);
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        if (!parsedData) return;
        const headers = ["Rechnungsnummer", "Datum", "Verkäufer", "Netto EUR", "USt EUR", "Brutto EUR", "Steuersatz"];
        const row = [
            `"${parsedData.invoice_number || ""}"`,
            `"${parsedData.date || ""}"`,
            `"${parsedData.vendor_name || ""}"`,
            (parsedData.amount_net ?? "").toString(),
            (parsedData.vat_amount ?? "").toString(),
            (parsedData.amount_gross ?? "").toString(),
            (parsedData.vat_rate_percent ?? "").toString(),
        ];
        const csvContent = "\uFEFF" + headers.join(";") + "\n" + row.join(";");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `E-Rechnung_${parsedData.invoice_number || "export"}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            {/* Upload Area */}
            <label
                style={{
                    display: "block",
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "32px 16px",
                    background: "#f8fafc",
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    marginBottom: 24 }}
            >
                <input
                    type="file"
                    accept=".xml,.pdf"
                    className="sr-only"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = "";
                    }}
                />
                <p style={{ marginBottom: 12 }}>
                    <Inbox style={{ width: 44, height: 44, color: "#2855d9", margin: "0 auto" }} />
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                    XRechnung (.xml) oder ZUGFeRD (.pdf) hier ablegen oder auswählen
                </p>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                    100% lokal im Browser: Deine sensiblen Finanzdaten verlassen zu keinem Zeitpunkt dein Gerät.
                </p>
            </label>

            {errorMsg && (
                <Alert variant="destructive" style={{ marginBottom: 24, borderRadius: 8 }}>
                    <AlertTitle>Datei konnte nicht gelesen werden</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
            )}

            {/* Parsed Result View */}
            {parsedData && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 24 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12,
                            background: "#ecfdf5",
                            padding: "16px 20px",
                            borderRadius: 10,
                            border: "1px solid #a7f3d0" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <CheckCircle2 style={{ color: "#059669", width: 20, height: 20 }} />
                            <div style={{ minWidth: 0 }}>
                                <span style={{ fontWeight: 700, color: "#065f46" }}>
                                    Rechnungsdaten erfolgreich gelesen:
                                </span>{" "}
                                <span style={{ color: "#047857" }}>{fileName}</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <Button variant="outline" onClick={() => setShowRawModal(true)}>
                                <FileText />
                                Roh-XML ansehen
                            </Button>
                            <Button variant="outline" onClick={exportCsv}>
                                <Download />
                                Als CSV exportieren
                            </Button>
                        </div>
                    </div>

                    <Alert>
                        <AlertTitle>Datenansicht, keine Konformitätsprüfung</AlertTitle>
                        <AlertDescription>Der Viewer zeigt ausgewählte Rechnungsdaten. Er führt keine vollständige Prüfung nach EN 16931, XRechnung/KoSIT oder PDF/A-3 durch. Bewahre die Originaldatei auf.</AlertDescription>
                    </Alert>

                    {/* Key Metrics Grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                            gap: 16 }}
                    >
                        <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <CardContent>
                            <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                                Rechnungsnummer
                            </span>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                                {parsedData.invoice_number || "–"}
                            </div>
                            </CardContent>
                        </Card>

                        <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <CardContent>
                            <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                                Rechnungsdatum
                            </span>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                                {parsedData.date || "–"}
                            </div>
                            </CardContent>
                        </Card>

                        <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <CardContent>
                            <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                                Nettobetrag
                            </span>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                                {parsedData.amount_net !== undefined
                                    ? `${parsedData.amount_net.toFixed(2)} €`
                                    : "–"}
                            </div>
                            </CardContent>
                        </Card>

                        <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <CardContent>
                            <span className="text-muted-foreground" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                                Gesamtbetrag (Brutto)
                            </span>
                            <div style={{ fontSize: 20, fontWeight: 900, color: "#2855d9", marginTop: 4 }}>
                                {parsedData.amount_gross !== undefined
                                    ? `${parsedData.amount_gross.toFixed(2)} €`
                                    : "–"}
                            </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Details  */}
                    <Card style={{ borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <CardHeader><CardTitle style={{ whiteSpace: "normal" }}>Ausgelesene Rechnungsdaten</CardTitle></CardHeader>
                        <CardContent>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 24 }}>
                            <div>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#64748b" }}>
                                    Rechnungssteller (Verkäufer / Auftragnehmer)
                                </h4>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                                    {parsedData.vendor_name || "Nicht angegeben"}
                                </div>
                                {parsedData.description && (
                                    <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
                                        <strong>Leistungsbeschreibung:</strong> {parsedData.description}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#64748b" }}>
                                    Steuerliche Aufschlüsselung
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
                                    <div>
                                        <strong>Steuersatz:</strong>{" "}
                                        {parsedData.vat_rate_percent !== undefined
                                            ? `${parsedData.vat_rate_percent}%`
                                            : "0% / nicht angegeben"}
                                    </div>
                                    <div>
                                        <strong>Umsatzsteuer:</strong>{" "}
                                        {parsedData.vat_amount !== undefined
                                            ? `${parsedData.vat_amount.toFixed(2)} €`
                                            : "0,00 €"}
                                    </div>
                                    <div>
                                        <strong>Fälliger Betrag:</strong>{" "}
                                        {parsedData.amount_gross !== undefined
                                            ? `${parsedData.amount_gross.toFixed(2)} €`
                                            : "–"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Girocode Action Trigger */}
                        {parsedData.amount_gross && (
                            <div
                                style={{
                                    marginTop: 24,
                                    paddingTop: 20,
                                    borderTop: "1px solid #e2e8f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 12 }}
                            >
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                                        Rechnung sofort bezahlen per Bank-App?
                                    </h4>
                                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                                        Erstelle mit einem Klick einen GiroCode (EPC-QR-Code) für diese E-Rechnung.
                                    </p>
                                </div>
                                <Link
                                    href={`/tools/girocode-generator?amount=${parsedData.amount_gross}&recipient=${encodeURIComponent(
                                        parsedData.vendor_name || ""
                                    )}&reference=${encodeURIComponent(parsedData.invoice_number || "")}`}
                                >
                                    <Button style={{ background: "#2855d9", maxWidth: "100%", height: "auto", whiteSpace: "normal" }}>
                                        <QrCode />
                                        GiroCode generieren
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                    </Card>
                </div>
            )}

            {/* Raw XML Modal */}
            <Dialog open={showRawModal} onOpenChange={setShowRawModal}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{`Roh-XML: ${fileName}`}</DialogTitle>
                    </DialogHeader>
                <pre
                    style={{
                        background: "#0f172a",
                        color: "#f8fafc",
                        padding: 16,
                        borderRadius: 8,
                        maxHeight: 500,
                        overflow: "auto",
                        fontSize: 12,
                        lineHeight: 1.5 }}
                >
                    {rawXml}
                </pre>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRawModal(false)}>
                            Schließen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
