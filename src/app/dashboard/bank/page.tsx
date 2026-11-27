"use client";
import HelpLink from "@/components/dashboard/HelpLink";

import { useEffect, useState } from "react";
import { Ban, Import, Link2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBankStore } from "@/store/bankStore";
import { useInvoiceStore } from "@/store/invoiceStore";
import { importBankTransactions } from "@/lib/bankService";
import { ApiError } from "@/lib/apiClient";
import { CamtFileError, extractCamtDocuments } from "@/lib/bank/camtFile";
import { findAutoMatchInvoice } from "@/lib/bank/autoMatch";
import { formatCurrency } from "@/lib/currencyUtils";
import type { BankTransaction, InvoiceWithClient } from "@/types";

const statusBadgeClass: Record<string, string> = {
    unmatched: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    matched: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    ignored: "bg-secondary text-secondary-foreground",
};

export default function BankPage() {
    const { t } = useLanguage();
    const { transactions, loading, fetchTransactions, matchTx, ignoreTx } =
        useBankStore();
    const { invoices, fetchInvoices } = useInvoiceStore();

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFormat, setImportFormat] = useState("dkb");
    const [csvText, setCsvText] = useState("");
    /** CAMT: raw .xml/.zip file, uploaded as-is (inflated server-side) */
    const [camtFile, setCamtFile] = useState<File | null>(null);
    /** CAMT: number of XML documents inside the selected file */
    const [camtDocCount, setCamtDocCount] = useState(0);
    const [importing, setImporting] = useState(false);
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
    const [matchInvoiceId, setMatchInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        fetchTransactions();
        fetchInvoices();
    }, [fetchTransactions, fetchInvoices]);

    const handleAutoMatch = () => {
        const unmatched = transactions.filter((t) => t.status === "unmatched");
        let matchCount = 0;
        // An invoice matched in this pass must not match a second time.
        const usedInvoiceIds = new Set<string>();

        for (const tx of unmatched) {
            const candidate = findAutoMatchInvoice(
                tx,
                (invoices as InvoiceWithClient[]).filter(
                    (inv) => !inv.id || !usedInvoiceIds.has(inv.id),
                ),
            );

            if (candidate) {
                if (candidate.id) usedInvoiceIds.add(candidate.id);
                matchTx(tx.id!, candidate.id!).catch(() => {});
                matchCount++;
            }
        }

        if (matchCount > 0) {
            toast.success(
                t("bank.autoMatchResult").replace("{0}", String(matchCount)),
            );
        } else {
            toast.info(t("bank.noMatches"));
        }
    };

    const handleImport = async () => {
        const isCamt = importFormat === "camt";
        if (isCamt ? !camtFile : !csvText.trim()) {
            toast.error(t("bank.importEmpty"));
            return;
        }
        setImporting(true);
        try {
            const result = await importBankTransactions(
                csvText,
                importFormat,
                isCamt ? (camtFile ?? undefined) : undefined,
            );
            const skipped = result.skippedPending
                ? ` · ${t("bank.skippedPending").replace("{0}", String(result.skippedPending))}`
                : "";
            toast.success(
                t("bank.importSuccess")
                    .replace("{0}", String(result.imported))
                    .replace("{1}", String(result.duplicates)) + skipped,
            );
            fetchTransactions(true);
            setImportModalOpen(false);
            setCsvText("");
            setCamtFile(null);
            setCamtDocCount(0);
        } catch (error) {
            // Client errors (e.g. no CAMT document) carry a useful reason
            const detail =
                error instanceof ApiError && error.status < 500
                    ? `: ${error.message}`
                    : "";
            toast.error(t("bank.importError") + detail);
        } finally {
            setImporting(false);
        }
    };

    const openMatch = (tx: BankTransaction) => {
        setSelectedTx(tx);
        setMatchInvoiceId(null);
        setMatchModalOpen(true);
    };

    const handleMatch = async () => {
        if (!selectedTx || !matchInvoiceId) return;
        try {
            await matchTx(selectedTx.id!, matchInvoiceId);
            toast.success(t("bank.matched"));
            setMatchModalOpen(false);
        } catch {
            toast.error(t("bank.matchError"));
        }
    };

    const handleIgnore = async (txId: string) => {
        try {
            await ignoreTx(txId);
            toast.success(t("bank.ignored"));
        } catch {
            toast.error(t("bank.ignoreError"));
        }
    };

    const unmatchedCount = transactions.filter(
        (tx) => tx.status === "unmatched",
    ).length;
    const matchedCount = transactions.filter(
        (tx) => tx.status === "matched",
    ).length;

    const unmatchedInvoices = (invoices as InvoiceWithClient[]).filter(
        (inv) => inv.status === "sent" || inv.status === "draft",
    );

    const renderTable = (rows: BankTransaction[]) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[110px]">{t("bank.date")}</TableHead>
                        <TableHead className="w-[120px] text-right">{t("bank.amount")}</TableHead>
                        <TableHead>{t("bank.description")}</TableHead>
                        <TableHead className="w-[110px]">{t("bank.status")}</TableHead>
                        <TableHead className="w-[100px] text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                <Loader2 className="mr-2 inline size-4 animate-spin" />…
                            </TableCell>
                        </TableRow>
                    ) : rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">—</TableCell>
                        </TableRow>
                    ) : (
                        rows.slice(0, 20).map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.transaction_date}</TableCell>
                                <TableCell className={cn("text-right font-medium", r.amount >= 0 ? "text-emerald-600" : "text-red-600")}>
                                    {formatCurrency(r.amount)}
                                </TableCell>
                                <TableCell>
                                    <div>{r.description}</div>
                                    {r.counterpart_name && (
                                        <div className="text-xs text-muted-foreground">{r.counterpart_name}</div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusBadgeClass[r.status]}>
                                        {t(`status.${r.status}`) || r.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {r.status === "unmatched" && (
                                        <div className="flex justify-end gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button type="button" variant="outline" size="icon-sm" onClick={() => openMatch(r)} aria-label={t("bank.match")}>
                                                        <Link2 />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("bank.match")}</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button type="button" variant="outline" size="icon-sm" onClick={() => void handleIgnore(r.id!)} aria-label={t("bank.ignore")}>
                                                        <Ban />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("bank.ignore")}</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const stats = [
        { label: t("bank.total"), value: String(transactions.length), className: "" },
        { label: t("bank.unmatched"), value: String(unmatchedCount), className: "text-amber-500" },
        { label: t("bank.matched"), value: String(matchedCount), className: "text-emerald-500" },
    ];

    const handleFile = (file: File) => {
        if (importFormat === "camt") {
            file.arrayBuffer()
                .then((buffer) => {
                    const documents = extractCamtDocuments(new Uint8Array(buffer));
                    setCamtFile(file);
                    setCamtDocCount(documents.length);
                })
                .catch((error) => {
                    setCamtFile(null);
                    setCamtDocCount(0);
                    toast.error(
                        error instanceof CamtFileError ? error.message : t("bank.fileReadError"),
                    );
                });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setCsvText((e.target?.result as string) || "");
        reader.readAsText(file, "windows-1252");
    };

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-semibold">{t("bank.title")}</h2>
                <HelpLink href="/hilfe/ausgaben-und-bank#kontoauszug" label="Hilfe zum CSV-Import und Abgleich" />
            </div>

            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-1">
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className={cn("mt-1 text-2xl font-semibold", stat.className)}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleAutoMatch} disabled={unmatchedCount === 0}>
                    <Zap />
                    {t("bank.autoMatch")}
                </Button>
                <Button type="button" onClick={() => setImportModalOpen(true)}>
                    <Import />
                    {t("bank.import")}
                </Button>
            </div>

            <Card>
                <CardContent>
                    <Tabs defaultValue="unmatched">
                        <TabsList>
                            <TabsTrigger value="unmatched">{t("bank.unmatched")} ({unmatchedCount})</TabsTrigger>
                            <TabsTrigger value="matched">{t("bank.matched")} ({matchedCount})</TabsTrigger>
                            <TabsTrigger value="ignored">{t("bank.ignored")}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="unmatched">
                            {renderTable(transactions.filter((tx) => tx.status === "unmatched"))}
                        </TabsContent>
                        <TabsContent value="matched">
                            {renderTable(transactions.filter((tx) => tx.status === "matched"))}
                        </TabsContent>
                        <TabsContent value="ignored">
                            {renderTable(transactions.filter((tx) => tx.status === "ignored"))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Import dialog */}
            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{t("bank.importTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("bank.format")}</Label>
                            <Select
                                value={importFormat}
                                onValueChange={(value) => {
                                    setImportFormat(value);
                                    setCsvText("");
                                    setCamtFile(null);
                                    setCamtDocCount(0);
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-[320px]" aria-label={t("bank.format")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="camt">{t("bank.format.camt")}</SelectItem>
                                    <SelectItem value="dkb">{t("bank.format.dkb") || "DKB"}</SelectItem>
                                    <SelectItem value="ing">{t("bank.format.ing") || "ING"}</SelectItem>
                                    <SelectItem value="generic">{t("bank.format.generic") || "Generic CSV"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("bank.csvFile")}</Label>
                            <label
                                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center transition-colors hover:bg-accent/50"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) handleFile(file);
                                }}
                            >
                                <input
                                    type="file"
                                    accept={importFormat === "camt" ? ".xml,.zip" : ".csv,.txt"}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFile(file);
                                        e.target.value = "";
                                    }}
                                />
                                <Import className="size-6 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {importFormat === "camt" ? t("bank.camtHint") : t("bank.uploadHint")}
                                </span>
                            </label>
                            {importFormat === "camt" && camtDocCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {t("bank.camtDocuments").replace("{0}", String(camtDocCount))}
                                </p>
                            )}
                            {importFormat !== "camt" && csvText && (
                                <p className="text-xs text-muted-foreground">
                                    {csvText.split("\n").length} {t("bank.lines")}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setImportModalOpen(false)}>
                            {t("bank.cancel")}
                        </Button>
                        <Button type="button" disabled={importing} onClick={() => void handleImport()}>
                            {importing && <Loader2 className="animate-spin" />}
                            {t("bank.importBtn")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual match dialog */}
            <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("bank.matchTitle")}</DialogTitle>
                    </DialogHeader>
                    {selectedTx && (
                        <div>
                            <p className="font-semibold">{formatCurrency(selectedTx.amount)}</p>
                            <p className="text-sm text-muted-foreground">{selectedTx.description}</p>
                        </div>
                    )}
                    <Select value={matchInvoiceId ?? undefined} onValueChange={setMatchInvoiceId}>
                        <SelectTrigger aria-label={t("bank.selectInvoice")}><SelectValue placeholder={t("bank.selectInvoice")} /></SelectTrigger>
                        <SelectContent>
                            {unmatchedInvoices.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id ?? ""}>
                                    {`${inv.invoice_number} — ${inv.client?.name || "?"} — ${formatCurrency(inv.total_gross)}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setMatchModalOpen(false)}>
                            {t("bank.cancel")}
                        </Button>
                        <Button type="button" disabled={!matchInvoiceId} onClick={() => void handleMatch()}>
                            {t("bank.matchBtn")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}
