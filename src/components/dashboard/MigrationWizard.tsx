"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowLeftRight, CheckCircle2, CloudDownload, CloudUpload, Download, FileSpreadsheet,
    FileText, Inbox, Loader2, RefreshCw, Rocket, Settings, ShoppingBag, Trash2, Users, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    MIGRATION_SOURCES,
    aggregateMigrationInputs,
    autoDetectColumnMapping,
    decodeFileBuffer,
    generateSampleCsvTemplate,
    getFieldDefinitions,
    parseCsvTextToRows,
    type MigrationEntityType,
    type MigrationSourceId,
    type ParsedCsvFileEntry,
    type ParsedMigrationEInvoice,
    type RechlyBackupBundle } from "@/lib/migration/importer";
import type { MigrationImportResult } from "@/app/api/migration/import/route";


interface PreviewColumn<T> {
    title: string;
    dataIndex?: string;
    render?: (value: unknown, record: T) => React.ReactNode;
}

function PreviewTable<T extends Record<string, unknown>>({ rows, columns, emptyText }: {
    rows: T[];
    columns: PreviewColumn<T>[];
    emptyText: string;
}) {
    const [page, setPage] = useState(1);
    const pageSize = 6;
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(page, pageCount);
    const slice = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
    if (rows.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
    }
    return (
        <div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={i}>{col.title}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {slice.map((row, ri) => (
                            <TableRow key={ri}>
                                {columns.map((col, ci) => (
                                    <TableCell key={ci}>
                                        {col.render
                                            ? col.render(col.dataIndex ? row[col.dataIndex] : undefined, row)
                                            : col.dataIndex
                                              ? String(row[col.dataIndex] ?? "—")
                                              : "—"}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {pageCount > 1 && (
                <div className="flex items-center justify-end gap-2 pt-3">
                    <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((pg) => Math.max(1, pg - 1))}>‹</Button>
                    <span className="text-sm">{safePage} / {pageCount}</span>
                    <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((pg) => Math.min(pageCount, pg + 1))}>›</Button>
                </div>
            )}
        </div>
    );
}

interface MigrationWizardProps {
    initialSource?: MigrationSourceId;
    compact?: boolean;
    onImportComplete?: (result: MigrationImportResult) => void;
}

export default function MigrationWizard({
    initialSource = "lexoffice",
    compact = false,
    onImportComplete }: MigrationWizardProps) {
    const { language } = useLanguage();
    const isDe = language === "de";

    const [selectedSource, setSelectedSource] =
        useState<MigrationSourceId>(initialSource);
    const [csvFiles, setCsvFiles] = useState<ParsedCsvFileEntry[]>([]);
    const [eInvoices, setEInvoices] = useState<ParsedMigrationEInvoice[]>([]);
    const [eInvoiceMode, setEInvoiceMode] = useState<"outgoing" | "incoming">(
        "outgoing",
    );
    const [backupBundle, setBackupBundle] =
        useState<RechlyBackupBundle | null>(null);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [parsingFiles, setParsingFiles] = useState(false);
    const [importing, setImporting] = useState(false);
    const [downloadingBackup, setDownloadingBackup] = useState(false);
    const [importResult, setImportResult] =
        useState<MigrationImportResult | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const activeSourceGuide = useMemo(
        () =>
            MIGRATION_SOURCES.find((s) => s.id === selectedSource) ||
            MIGRATION_SOURCES[0],
        [selectedSource],
    );

    // Compute combined normalized entities from all loaded CSVs, E-Invoices, and Backup JSON
    const aggregated = useMemo(
        () => aggregateMigrationInputs(csvFiles, eInvoices, eInvoiceMode, backupBundle),
        [csvFiles, eInvoices, eInvoiceMode, backupBundle],
    );

    const handleDownloadFullBackup = async () => {
        setDownloadingBackup(true);
        try {
            const res = await fetch("/api/migration/backup");
            if (!res.ok) {
                throw new Error("Backup failed");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rechly-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success(
                isDe
                    ? "Komplett-Backup (.json) wurde heruntergeladen!"
                    : "Full backup (.json) downloaded!",
            );
        } catch {
            toast.error(
                isDe
                    ? "Backup konnte nicht erstellt werden."
                    : "Failed to download backup.",
            );
        } finally {
            setDownloadingBackup(false);
        }
    };

    const handleDownloadSampleCsv = (
        entityType: Exclude<MigrationEntityType, "full_backup">,
    ) => {
        const csvContent = "\uFEFF" + generateSampleCsvTemplate(entityType);
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rechly-muster-${entityType}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleFilesSelected = async (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        setParsingFiles(true);
        setImportResult(null);

        const newCsvEntries: ParsedCsvFileEntry[] = [];
        const eInvoiceFiles: File[] = [];

        try {
            for (const file of files) {
                const lower = file.name.toLowerCase();

                if (lower.endsWith(".json")) {
                    const text = decodeFileBuffer(await file.arrayBuffer());
                    const parsed = JSON.parse(text) as RechlyBackupBundle;
                    if (
                        parsed &&
                        (parsed.rechlyBackupVersion ||
                            Array.isArray(parsed.clients) ||
                            Array.isArray(parsed.invoices))
                    ) {
                        setBackupBundle(parsed);
                        setSelectedSource("rechly_backup");
                        toast.success(
                            isDe
                                ? `Rechly Backup-Datei „${file.name}“ geladen.`
                                : `Loaded Rechly backup file "${file.name}".`,
                        );
                    } else {
                        toast.warning(
                            isDe
                                ? `JSON-Datei „${file.name}“ hat kein bekanntes Rechly-Backup-Format.`
                                : `JSON file "${file.name}" is not a valid Rechly backup.`,
                        );
                    }
                    continue;
                }

                if (lower.endsWith(".xml") || lower.endsWith(".pdf")) {
                    eInvoiceFiles.push(file);
                    continue;
                }

                // Default: treat as CSV / TSV
                const csvText = decodeFileBuffer(await file.arrayBuffer());
                const parsedCsv = parseCsvTextToRows(csvText);

                if (parsedCsv.rows.length === 0) {
                    toast.warning(
                        isDe
                            ? `Datei „${file.name}“ enthält keine lesbaren Datenzeilen.`
                            : `File "${file.name}" contains no data rows.`,
                    );
                    continue;
                }

                const mapping = autoDetectColumnMapping(
                    parsedCsv.headers,
                    parsedCsv.detectedEntityType,
                );

                newCsvEntries.push({
                    id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    fileName: file.name,
                    headers: parsedCsv.headers,
                    rows: parsedCsv.rows,
                    detectedSource: parsedCsv.detectedSource,
                    entityType: parsedCsv.detectedEntityType,
                    mapping });
            }

            if (newCsvEntries.length > 0) {
                setCsvFiles((prev) => [...prev, ...newCsvEntries]);
            }

            if (eInvoiceFiles.length > 0) {
                const formData = new FormData();
                for (const f of eInvoiceFiles) {
                    formData.append("files", f);
                }
                const res = await fetch("/api/migration/parse-einvoice", {
                    method: "POST",
                    body: formData });
                if (res.ok) {
                    const data = await res.json();
                    if (
                        Array.isArray(data.invoices) &&
                        data.invoices.length > 0
                    ) {
                        setEInvoices((prev) => [...prev, ...data.invoices]);
                        setSelectedSource("einvoice");
                        toast.success(
                            isDe
                                ? `${data.invoices.length} E-Rechnung(en) erfolgreich analysiert.`
                                : `${data.invoices.length} e-invoice(s) parsed successfully.`,
                        );
                    }
                    if (
                        Array.isArray(data.failedFiles) &&
                        data.failedFiles.length > 0
                    ) {
                        for (const fail of data.failedFiles) {
                            toast.warning(`${fail.fileName}: ${fail.reason}`);
                        }
                    }
                } else {
                    toast.error(
                        isDe
                            ? "Fehler beim Lesen der E-Rechnungsdateien."
                            : "Failed to parse e-invoice files.",
                    );
                }
            }
        } catch (err) {
            console.error("File parse error:", err);
            toast.error(
                isDe
                    ? "Datei konnte nicht verarbeitet werden."
                    : "Failed to process file.",
            );
        } finally {
            setParsingFiles(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleChangeCsvEntityType = (
        entryId: string,
        newType: Exclude<MigrationEntityType, "full_backup">,
    ) => {
        setCsvFiles((prev) =>
            prev.map((entry) => {
                if (entry.id !== entryId) return entry;
                return {
                    ...entry,
                    entityType: newType,
                    mapping: autoDetectColumnMapping(entry.headers, newType) };
            }),
        );
    };

    const handleChangeColumnMapping = (
        entryId: string,
        fieldKey: string,
        csvHeader: string,
    ) => {
        setCsvFiles((prev) =>
            prev.map((entry) => {
                if (entry.id !== entryId) return entry;
                const nextMapping = { ...entry.mapping };
                if (!csvHeader) {
                    delete nextMapping[fieldKey];
                } else {
                    nextMapping[fieldKey] = csvHeader;
                }
                return {
                    ...entry,
                    mapping: nextMapping };
            }),
        );
    };

    const handleRemoveCsvFile = (entryId: string) => {
        setCsvFiles((prev) => prev.filter((e) => e.id !== entryId));
    };

    const handleResetAll = () => {
        setCsvFiles([]);
        setEInvoices([]);
        setBackupBundle(null);
        setImportResult(null);
    };

    const handleExecuteImport = async () => {
        if (aggregated.totalItems === 0 && !aggregated.hasCompany) {
            toast.warning(
                isDe
                    ? "Keine Datensätze zum Importieren vorhanden."
                    : "No records to import.",
            );
            return;
        }

        setImporting(true);
        try {
            const res = await fetch("/api/migration/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skipDuplicates,
                    company: backupBundle?.company || null,
                    clients: aggregated.clients,
                    products: aggregated.products,
                    invoices: aggregated.invoices,
                    expenses: aggregated.expenses,
                    offers: backupBundle?.offers || [] }) });

            if (!res.ok) {
                throw new Error("Import request failed");
            }

            const result: MigrationImportResult = await res.json();
            setImportResult(result);
            onImportComplete?.(result);

            const totalInserted =
                result.clients.inserted +
                result.products.inserted +
                result.invoices.inserted +
                result.expenses.inserted +
                result.offers.inserted;

            toast.success(
                isDe
                    ? `Umzug abgeschlossen! ${totalInserted} Datensätze wurden importiert.`
                    : `Migration complete! ${totalInserted} records imported.`,
            );
        } catch (err) {
            console.error("Import error:", err);
            toast.error(
                isDe
                    ? "Import fehlgeschlagen. Bitte prüfe deine Dateien."
                    : "Import failed. Please check your files.",
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Banner: Full Account Backup & Web <-> Desktop Portability */}
            <Card className="border-[#c9d8f5] dark:border-[#152438]/60 bg-gradient-to-r from-[#eef3fd]/70 via-white to-sky-50/60 dark:from-[#152438]/30 dark:via-slate-900 dark:to-slate-900">
                <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="m-0 bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                Web ⇄ Desktop
                            </Badge>
                            <span className="font-semibold text-base text-slate-900 dark:text-slate-100">
                                {isDe
                                    ? "100% Datenhoheit & Komplett-Backup"
                                    : "100% Data Sovereignty & Full Backup"}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                            {isDe
                                ? "Sichere deinen gesamten Datenbestand (Firmendaten, Kunden, Produkte, Rechnungen, Angebote & Ausgaben) mit einem Klick oder ziehe nahtlos zwischen Rechly Cloud und der lokalen Rechly Desktop-App um."
                                : "Back up your entire business data (company, clients, products, invoices, offers & expenses) in one click or move seamlessly between Rechly Cloud and the local Rechly Desktop app."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            disabled={downloadingBackup}
                            onClick={handleDownloadFullBackup}
                        >
                            {downloadingBackup ? <Loader2 className="animate-spin" /> : <CloudDownload />}
                            {isDe
                                ? "Komplett-Backup herunterladen (.json)"
                                : "Download Full Backup (.json)"}
                        </Button>
                    </div>
                </div>
                </CardContent>
            </Card>

            {/* Step 1: Source System Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="size-5 text-[#2855d9]" />
                        <span>
                            {isDe
                                ? "1. Quelle wählen: Von welchem Programm möchtest du wechseln?"
                                : "1. Select Source: Which tool are you switching from?"}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                <div
                    className={`grid gap-3 ${
                        compact
                            ? "grid-cols-1 sm:grid-cols-2"
                            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    }`}
                >
                    {MIGRATION_SOURCES.map((source) => {
                        const active = selectedSource === source.id;
                        return (
                            <button
                                key={source.id}
                                type="button"
                                onClick={() => setSelectedSource(source.id)}
                                className={`text-left rounded-xl p-4 border transition-all cursor-pointer ${
                                    active
                                        ? "border-[#2855d9] bg-[#eef3fd]/60 dark:bg-[#152438]/40 shadow-sm ring-1 ring-[#2855d9]"
                                        : "border-slate-200 dark:border-slate-800 hover:border-[#7ea2f8] bg-white dark:bg-slate-900/60"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                        {source.name}
                                    </span>
                                    <Badge
                                        className={`m-0 text-xs ${active ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-secondary text-secondary-foreground"}`}
                                    >
                                        {source.badge}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 m-0 line-clamp-2">
                                    {source.subtitle}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Step-by-step instructions for the selected source */}
                <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                        <div>
                            <span className="text-sm font-semibold">
                                {isDe
                                    ? `So exportierst du deine Daten aus ${activeSourceGuide.name}:`
                                    : `How to export your data from ${activeSourceGuide.name}:`}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSampleCsv("clients")}
                            >
                                <Download />
                                {isDe ? "Muster Kunden.csv" : "Sample Clients.csv"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSampleCsv("products")}
                            >
                                <Download />
                                {isDe ? "Muster Produkte.csv" : "Sample Products.csv"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSampleCsv("invoices")}
                            >
                                <Download />
                                {isDe ? "Muster Rechnungen.csv" : "Sample Invoices.csv"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSampleCsv("expenses")}
                            >
                                <Download />
                                {isDe ? "Muster Ausgaben.csv" : "Sample Expenses.csv"}
                            </Button>
                        </div>
                    </div>

                    <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 m-0">
                        {(isDe
                            ? activeSourceGuide.stepsDe
                            : activeSourceGuide.stepsEn
                        ).map((step, idx) => (
                            <li key={idx}>{step}</li>
                        ))}
                    </ol>
                    <p className="text-xs text-[#2855d9] dark:text-[#7ea2f8] mt-3 mb-0 font-medium">
                        💡{" "}
                        {isDe
                            ? activeSourceGuide.tipsDe
                            : activeSourceGuide.tipsEn}
                    </p>
                </div>
                </CardContent>
            </Card>

            {/* Step 2: Multi-file Drag & Drop Upload Zone */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                            <CloudUpload className="size-5 text-[#2855d9]" />
                            <span>
                                {isDe
                                    ? "2. Dateien hochladen & Vorschau prüfen"
                                    : "2. Upload Files & Verify Preview"}
                            </span>
                        </span>
                        {(csvFiles.length > 0 ||
                            eInvoices.length > 0 ||
                            backupBundle) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetAll}
                            >
                                <RefreshCw />
                                {isDe ? "Auswahl zurücksetzen" : "Reset files"}
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.txt,.xml,.pdf,.json"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files) {
                            void handleFilesSelected(e.target.files);
                        }
                    }}
                />

                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files) {
                            void handleFilesSelected(e.dataTransfer.files);
                        }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                        dragOver
                            ? "border-[#2855d9] bg-[#eef3fd]/70 dark:bg-[#152438]/40"
                            : "border-slate-300 dark:border-slate-700 hover:border-[#2855d9] bg-slate-50/50 dark:bg-slate-900/40"
                    }`}
                >
                    <Inbox className="mx-auto mb-2 size-10 text-[#2855d9]" />
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {parsingFiles
                            ? isDe
                                ? "Dateien werden analysiert..."
                                : "Analyzing files..."
                            : isDe
                              ? "CSV-, XRechnung- (.xml), ZUGFeRD- (.pdf) oder Backup-Dateien (.json) hierher ziehen"
                              : "Drag & drop CSV, XRechnung (.xml), ZUGFeRD (.pdf), or Backup (.json) files here"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {isDe
                            ? "Du kannst mehrere Dateien gleichzeitig auswählen (z. B. Kunden.csv + Artikel.csv + Rechnungen.csv oder mehrere E-Rechnungen)."
                            : "You can select multiple files at once (e.g. Clients.csv + Products.csv + Invoices.csv or multiple E-Invoices)."}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={parsingFiles}
                    >
                        {parsingFiles ? <Loader2 className="animate-spin" /> : <CloudUpload />}
                        {isDe ? "Dateien auswählen" : "Browse Files"}
                    </Button>
                </div>

                {/* Loaded CSV files & Column Mapping Inspector */}
                {csvFiles.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h3 className="mb-2 text-base font-semibold">
                            {isDe
                                ? "Geladene CSV-Dateien & Spalten-Zuordnung"
                                : "Loaded CSV Files & Column Mapping"}
                        </h3>

                        {csvFiles.map((entry) => {
                            const fieldDefs = getFieldDefinitions(
                                entry.entityType,
                            );
                            return (
                                <Card
                                    key={entry.id}
                                    className="border-slate-200 dark:border-slate-800"
                                >
                                    <CardContent>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <FileSpreadsheet className="size-5 text-emerald-600" />
                                            <span className="font-semibold">{entry.fileName}</span>
                                            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                {entry.rows.length}{" "}
                                                {isDe ? "Zeilen" : "rows"}
                                            </Badge>
                                            {entry.detectedSource !==
                                                "generic" && (
                                                <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                                    {entry.detectedSource.toUpperCase()}{" "}
                                                    {isDe
                                                        ? "erkannt"
                                                        : "detected"}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-slate-500">
                                                {isDe ? "Datentyp:" : "Type:"}
                                            </span>
                                            <Select
                                                value={entry.entityType}
                                                onValueChange={(val) =>
                                                    handleChangeCsvEntityType(
                                                        entry.id,
                                                        val as Exclude<MigrationEntityType, "full_backup">,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-[190px]" aria-label={isDe ? "Datentyp" : "Type"}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="clients">{isDe ? "Kunden / Kontakte" : "Clients / Contacts"}</SelectItem>
                                                    <SelectItem value="products">{isDe ? "Produkte / Leistungen" : "Products / Services"}</SelectItem>
                                                    <SelectItem value="invoices">{isDe ? "Ausgangsrechnungen" : "Outgoing Invoices"}</SelectItem>
                                                    <SelectItem value="expenses">{isDe ? "Ausgaben / Belege" : "Expenses / Bills"}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-destructive hover:text-destructive"
                                                aria-label={isDe ? "Datei entfernen" : "Remove file"}
                                                onClick={() =>
                                                    handleRemoveCsvFile(entry.id)
                                                }
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </div>

                                    <Collapsible className="mt-2">
                                        <CollapsibleTrigger asChild>
                                            <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-[#2855d9] dark:text-[#7ea2f8]">
                                                <Settings className="size-3.5" />
                                                {isDe
                                                    ? `Spalten-Zuordnung prüfen / anpassen (${Object.keys(entry.mapping).length} Spalten automatisch erkannt)`
                                                    : `Inspect / customize column mapping (${Object.keys(entry.mapping).length} columns auto-detected)`}
                                                <ChevronDown className="size-3.5" />
                                            </button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                                        {fieldDefs.map(
                                                            (field) => (
                                                                <div
                                                                    key={
                                                                        field.key
                                                                    }
                                                                    className="flex flex-col gap-1"
                                                                >
                                                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                        {isDe
                                                                            ? field.labelDe
                                                                            : field.labelEn}
                                                                    </label>
                                                                    <Select
                                                                        value={
                                                                            entry.mapping[field.key] || "__none"
                                                                        }
                                                                        onValueChange={(val) =>
                                                                            handleChangeColumnMapping(
                                                                                entry.id,
                                                                                field.key,
                                                                                val === "__none" ? "" : val,
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger aria-label={isDe ? field.labelDe : field.labelEn}><SelectValue placeholder={isDe ? "— Nicht zugeordnet —" : "— Not mapped —"} /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="__none">{isDe ? "— Nicht zugeordnet —" : "— Not mapped —"}</SelectItem>
                                                                            {entry.headers.map((h) => (
                                                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Loaded E-Invoice XML / PDF mode switcher */}
                {eInvoices.length > 0 && (
                    <div className="mt-6 rounded-xl border border-[#c9d8f5] dark:border-[#152438] bg-[#eef3fd]/40 dark:bg-[#152438]/30 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <FileText className="size-5 text-[#2855d9]" />
                                <div>
                                    <span className="font-semibold">
                                        {eInvoices.length}{" "}
                                        {isDe
                                            ? "E-Rechnungen (XRechnung / ZUGFeRD) geladen"
                                            : "E-Invoices (XRechnung / ZUGFeRD) loaded"}
                                    </span>
                                    <p className="text-xs text-slate-500 m-0">
                                        {isDe
                                            ? "Wie sollen diese E-Rechnungen importiert werden?"
                                            : "How should these e-invoices be imported?"}
                                    </p>
                                </div>
                            </div>
                            <RadioGroup
                                value={eInvoiceMode}
                                onValueChange={(v) => setEInvoiceMode(v as "outgoing" | "incoming")}
                                className="flex flex-wrap gap-2"
                            >
                                {([
                                    { value: "outgoing", label: isDe ? "Als eigene Ausgangsrechnungen (+ Kunden)" : "As Outgoing Invoices (+ Clients)" },
                                    { value: "incoming", label: isDe ? "Als Eingangsrechnungen (Ausgaben)" : "As Incoming Bills (Expenses)" },
                                ] as const).map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm ${eInvoiceMode === option.value ? "border-primary bg-primary/5 font-medium" : ""}`}
                                    >
                                        <RadioGroupItem value={option.value} />
                                        {option.label}
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>
                    </div>
                )}

                {/* Loaded Full Backup Bundle Banner */}
                {backupBundle && (
                    <Alert className="mt-6">
                        <AlertTitle>
                            {isDe
                                ? `Rechly Komplett-Backup vom ${new Date(backupBundle.exportedAt || Date.now()).toLocaleDateString("de-DE")} bereit zur Wiederherstellung`
                                : `Rechly Full Backup ready to restore`}
                        </AlertTitle>
                        <AlertDescription>
                            {isDe
                                ? `Enthält ${backupBundle.clients?.length || 0} Kunden, ${backupBundle.products?.length || 0} Produkte, ${backupBundle.invoices?.length || 0} Rechnungen, ${backupBundle.offers?.length || 0} Angebote und ${backupBundle.expenses?.length || 0} Ausgaben.`
                                : `Contains ${backupBundle.clients?.length || 0} clients, ${backupBundle.products?.length || 0} products, ${backupBundle.invoices?.length || 0} invoices, ${backupBundle.offers?.length || 0} offers, and ${backupBundle.expenses?.length || 0} expenses.`}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Live Tabbed Data Preview */}
                {aggregated.totalItems > 0 && (
                    <div className="mt-6">
                        <Separator className="my-4" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                                <h3 className="mb-0 text-base font-semibold">
                                    {isDe
                                        ? "Live-Vorschau der erkannten Daten"
                                        : "Live Preview of Detected Records"}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    {isDe
                                        ? "Prüfe vor dem Import deine erkannten Kunden, Produkte, Rechnungen und Ausgaben."
                                        : "Review your detected clients, products, invoices, and expenses before importing."}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <Checkbox
                                        checked={skipDuplicates}
                                        onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
                                    />
                                    <span className="text-xs font-medium">
                                        {isDe
                                            ? "Duplikate automatisch überspringen (Empfohlen)"
                                            : "Automatically skip duplicates (Recommended)"}
                                    </span>
                                </label>

                                <Button
                                    type="button"
                                    size="lg"
                                    disabled={importing}
                                    onClick={handleExecuteImport}
                                >
                                    {importing ? <Loader2 className="animate-spin" /> : <Rocket />}
                                    {isDe
                                        ? `Jetzt ${aggregated.totalItems} Datensätze importieren`
                                        : `Import ${aggregated.totalItems} Records Now`}
                                </Button>
                            </div>
                        </div>

<Tabs defaultValue="clients">
                            <TabsList className="flex-wrap">
                                <TabsTrigger value="clients">
                                    <Users />
                                    {isDe ? "Kunden" : "Clients"}
                                    <Badge className={aggregated.clients.length > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-secondary text-secondary-foreground"}>{aggregated.clients.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="products">
                                    <ShoppingBag />
                                    {isDe ? "Produkte" : "Products"}
                                    <Badge className={aggregated.products.length > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-secondary text-secondary-foreground"}>{aggregated.products.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="invoices">
                                    <FileText />
                                    {isDe ? "Rechnungen" : "Invoices"}
                                    <Badge className={aggregated.invoices.length > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-secondary text-secondary-foreground"}>{aggregated.invoices.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="expenses">
                                    <Wallet />
                                    {isDe ? "Ausgaben" : "Expenses"}
                                    <Badge className={aggregated.expenses.length > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-secondary text-secondary-foreground"}>{aggregated.expenses.length}</Badge>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="clients">
                                <PreviewTable
                                    rows={aggregated.clients as unknown as Record<string, unknown>[]}
                                    emptyText={isDe ? "Noch keine Kunden geladen" : "No clients loaded yet"}
                                    columns={[
                                        { title: isDe ? "Name / Firma" : "Name / Company", dataIndex: "name", render: (v) => <span className="font-semibold">{String(v ?? "")}</span> },
                                        { title: isDe ? "Ansprechpartner" : "Contact", dataIndex: "contact_person", render: (v) => String(v ?? "") || "—" },
                                        { title: isDe ? "Adresse" : "Address", render: (_v, r) => `${String(r.address_line1 ?? "")}, ${String(r.postal_code ?? "")} ${String(r.city ?? "")}` },
                                        { title: "E-Mail", dataIndex: "email", render: (v) => String(v ?? "") || "—" },
                                        { title: "USt-IdNr. / Leitweg-ID", render: (_v, r) => String(r.vat_id ?? r.leitweg_id ?? "") || "—" },
                                    ]}
                                />
                            </TabsContent>

                            <TabsContent value="products">
                                <PreviewTable
                                    rows={aggregated.products as unknown as Record<string, unknown>[]}
                                    emptyText={isDe ? "Noch keine Produkte geladen" : "No products loaded yet"}
                                    columns={[
                                        { title: isDe ? "Bezeichnung" : "Name", dataIndex: "name", render: (v) => <span className="font-semibold">{String(v ?? "")}</span> },
                                        { title: isDe ? "Beschreibung" : "Description", dataIndex: "description", render: (v) => String(v ?? "") || "—" },
                                        { title: isDe ? "Nettopreis" : "Net Price", dataIndex: "price", render: (v) => `${Number(v).toFixed(2)} €` },
                                        { title: isDe ? "MwSt." : "VAT", dataIndex: "tax_rate_percent", render: (v) => `${String(v ?? "")} %` },
                                        { title: isDe ? "Einheit" : "Unit", dataIndex: "unit_of_measure" },
                                    ]}
                                />
                            </TabsContent>

                            <TabsContent value="invoices">
                                <div className="flex flex-col gap-2">
                                    <Alert>
                                        <AlertDescription>
                                            {isDe
                                                ? "Kunden-Automatik aktiv: Falls ein Rechnungsempfänger noch nicht in deiner Kundenliste existiert, legt Rechly ihn beim Import automatisch an."
                                                : "Auto-Client Creation: If an invoice recipient does not exist in your clients yet, Rechly automatically creates the client record."}
                                        </AlertDescription>
                                    </Alert>
                                    <PreviewTable
                                        rows={aggregated.invoices as unknown as Record<string, unknown>[]}
                                        emptyText={isDe ? "Noch keine Rechnungen geladen" : "No invoices loaded yet"}
                                        columns={[
                                            { title: isDe ? "Rechnungs-Nr." : "Invoice No.", dataIndex: "invoice_number", render: (v) => <span className="font-semibold">{String(v ?? "")}</span> },
                                            { title: isDe ? "Datum" : "Date", dataIndex: "issue_date" },
                                            { title: isDe ? "Kunde" : "Client", dataIndex: "client_name" },
                                            { title: isDe ? "Netto" : "Net", dataIndex: "subtotal", render: (v) => `${Number(v).toFixed(2)} €` },
                                            { title: isDe ? "MwSt." : "VAT", dataIndex: "total_vat", render: (v) => `${Number(v).toFixed(2)} €` },
                                            { title: isDe ? "Brutto" : "Gross", dataIndex: "total_gross", render: (v) => <span className="font-semibold">{Number(v).toFixed(2)} €</span> },
                                            {
                                                title: "Status",
                                                dataIndex: "status",
                                                render: (v) => (
                                                    <Badge className={v === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : v === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}>
                                                        {String(v ?? "")}
                                                    </Badge>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="expenses">
                                <PreviewTable
                                    rows={aggregated.expenses as unknown as Record<string, unknown>[]}
                                    emptyText={isDe ? "Noch keine Ausgaben geladen" : "No expenses loaded yet"}
                                    columns={[
                                        { title: isDe ? "Datum" : "Date", dataIndex: "date" },
                                        { title: isDe ? "Lieferant" : "Vendor", dataIndex: "vendor_name", render: (v) => <span className="font-semibold">{String(v ?? "")}</span> },
                                        { title: isDe ? "Beschreibung" : "Description", dataIndex: "description" },
                                        { title: isDe ? "Kategorie" : "Category", dataIndex: "category", render: (v) => <Badge variant="secondary">{String(v ?? "")}</Badge> },
                                        { title: isDe ? "Netto" : "Net", dataIndex: "amount_net", render: (v) => `${Number(v).toFixed(2)} €` },
                                        { title: isDe ? "Brutto" : "Gross", dataIndex: "amount_gross", render: (v) => <span className="font-semibold">{Number(v).toFixed(2)} €</span> },
                                    ]}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
                </CardContent>
            </Card>

            {/* Step 3: Import Result Breakdown */}
            {importResult && (
                <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-1 size-6 shrink-0 text-emerald-600" />
                        <div className="flex-1">
                            <h3 className="mb-1 text-lg font-semibold">
                                {isDe
                                    ? "Daten-Umzug erfolgreich abgeschlossen!"
                                    : "Data Migration Completed Successfully!"}
                            </h3>
                            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                                {isDe
                                    ? "Deine Daten wurden in deinen Rechly-Arbeitsbereich übernommen:"
                                    : "Your records have been imported into your Rechly workspace:"}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs text-slate-500">
                                        {isDe ? "Kunden" : "Clients"}
                                    </div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        +{importResult.clients.inserted + importResult.autoCreatedClients}
                                    </div>
                                    {importResult.clients.skipped > 0 && (
                                        <div className="text-xs text-slate-400">
                                            {importResult.clients.skipped}{" "}
                                            {isDe
                                                ? "übersprungen"
                                                : "skipped"}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs text-slate-500">
                                        {isDe ? "Produkte" : "Products"}
                                    </div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        +{importResult.products.inserted}
                                    </div>
                                    {importResult.products.skipped > 0 && (
                                        <div className="text-xs text-slate-400">
                                            {importResult.products.skipped}{" "}
                                            {isDe
                                                ? "übersprungen"
                                                : "skipped"}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs text-slate-500">
                                        {isDe ? "Rechnungen" : "Invoices"}
                                    </div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        +{importResult.invoices.inserted}
                                    </div>
                                    {importResult.invoices.skipped > 0 && (
                                        <div className="text-xs text-slate-400">
                                            {importResult.invoices.skipped}{" "}
                                            {isDe
                                                ? "übersprungen"
                                                : "skipped"}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs text-slate-500">
                                        {isDe ? "Ausgaben" : "Expenses"}
                                    </div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        +{importResult.expenses.inserted}
                                    </div>
                                    {importResult.expenses.skipped > 0 && (
                                        <div className="text-xs text-slate-400">
                                            {importResult.expenses.skipped}{" "}
                                            {isDe
                                                ? "übersprungen"
                                                : "skipped"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/dashboard/clients">
<Users className="size-4" />
                                        {isDe
                                            ? "Zu den Kunden"
                                            : "View Clients"}
                                    </Link>
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/dashboard/products">
<ShoppingBag className="size-4" />
                                        {isDe
                                            ? "Zu den Produkten"
                                            : "View Products"}
                                    </Link>
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/dashboard/invoices">
<FileText className="size-4" />
                                        {isDe
                                            ? "Zu den Rechnungen"
                                            : "View Invoices"}
                                    </Link>
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/dashboard/expenses">
<Wallet className="size-4" />
                                        {isDe
                                            ? "Zu den Ausgaben"
                                            : "View Expenses"}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
