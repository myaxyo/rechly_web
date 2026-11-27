"use client";

import DecimalInput from "@/components/DecimalInput";
import { VAT_RATE_OPTIONS } from "@/lib/vatDefaults";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import { Import, Loader2, Pencil, Plus, ScanLine, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenseStore } from "@/store/expenseStore";
import { ocrExpenseReceipt, uploadExpenseReceipt } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/currencyUtils";
import type { Expense, ExpenseCategory, ExpenseFormData } from "@/types";

const categoryBadgeClass: Record<ExpenseCategory, string> = {
    office: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    travel: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    software: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    hardware: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    marketing: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    consulting: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    utilities: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    rent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    insurance: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
    other: "bg-secondary text-secondary-foreground",
};

const DEFAULT_FORM: ExpenseFormData = {
    date: dayjs().format("YYYY-MM-DD"),
    vendor_name: "",
    description: "",
    amount_net: 0,
    vat_amount: 0,
    amount_gross: 0,
    vat_rate_percent: 19,
    category: "other",
    payment_method: "bank_transfer",
};

export default function ExpensesPage() {
    const { t } = useLanguage();
    const {
        expenses,
        loading,
        fetchExpenses,
        addExpense,
        editExpense,
        removeExpense,
    } = useExpenseStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ExpenseFormData>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [, setCreatedExpenseId] = useState<string | null>(
        null,
    );

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const openCreate = () => {
        setEditingId(null);
        setForm(DEFAULT_FORM);
        setPendingFile(null);
        setCreatedExpenseId(null);
        setModalOpen(true);
    };

    const handleImportEInvoice = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xml,.pdf,application/xml,text/xml,application/pdf";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const buffer = await file.arrayBuffer();
                const fileBase64 = btoa(
                    Array.from(new Uint8Array(buffer))
                        .map((byte) => String.fromCharCode(byte))
                        .join("")
                );
                const res = await fetch("/api/expenses/import-einvoice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileBase64, filename: file.name }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    toast.error(
                        err.error === "no_embedded_xml"
                            ? t("expenses.eInvoiceNoXml")
                            : t("expenses.eInvoiceUnsupported")
                    );
                    return;
                }
                const parsed = await res.json();
                setEditingId(null);
                setPendingFile(null);
                setCreatedExpenseId(null);
                setForm({
                    ...DEFAULT_FORM,
                    date: parsed.date || DEFAULT_FORM.date,
                    vendor_name: parsed.vendor_name || "",
                    description: parsed.invoice_number
                        ? `E-Rechnung ${parsed.invoice_number}`
                        : DEFAULT_FORM.description,
                    amount_net: parsed.amount_net ?? 0,
                    vat_amount: parsed.vat_amount ?? 0,
                    amount_gross: parsed.amount_gross ?? 0,
                    vat_rate_percent: parsed.vat_rate_percent ?? 19,
                });
                setModalOpen(true);
                toast.success(t("expenses.eInvoiceParsed"));
            } catch (error) {
                console.error("E-invoice import failed:", error);
                toast.error(t("expenses.eInvoiceUnsupported"));
            }
        };
        input.click();
    };

    const openEdit = (expense: Expense) => {
        setEditingId(expense.id!);
        setForm({
            date: expense.date,
            vendor_name: expense.vendor_name,
            description: expense.description || "",
            amount_net: expense.amount_net,
            vat_amount: expense.vat_amount,
            amount_gross: expense.amount_gross,
            vat_rate_percent: expense.vat_rate_percent,
            category: expense.category,
            payment_method: expense.payment_method,
        });
        setPendingFile(null);
        setCreatedExpenseId(expense.id!);
        setModalOpen(true);
    };

    const handleGrossChange = (gross: number | null) => {
        const g = gross ?? 0;
        const vatRate = form.vat_rate_percent;
        const net = g / (1 + vatRate / 100);
        const vat = g - net;
        setForm((prev) => ({
            ...prev,
            amount_gross: g,
            amount_net: Math.round(net * 100) / 100,
            vat_amount: Math.round(vat * 100) / 100,
        }));
    };

    const handleVatRateChange = (rate: number) => {
        const net = form.amount_net;
        const vat = (net * rate) / 100;
        const gross = net + vat;
        setForm((prev) => ({
            ...prev,
            vat_rate_percent: rate,
            vat_amount: Math.round(vat * 100) / 100,
            amount_gross: Math.round(gross * 100) / 100,
        }));
    };

    const handleOCR = useCallback(
        async (file: File) => {
            setOcrLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");
                const result = await ocrExpenseReceipt(base64, file.type);

                setForm((prev) => ({
                    ...prev,
                    vendor_name: result.vendor_name || prev.vendor_name,
                    date: result.date || prev.date,
                    amount_gross: result.amount_gross ?? prev.amount_gross,
                    vat_rate_percent: result.vat_rate ?? prev.vat_rate_percent,
                    description: result.description || prev.description,
                }));
                toast.success(t("expenses.ocrSuccess"));
            } catch {
                toast.warning(t("expenses.ocrError"));
            } finally {
                setOcrLoading(false);
            }
        },
        [t],
    );

    const handleSave = async () => {
        if (!form.vendor_name || !form.date) {
            toast.error(t("expenses.fillRequired"));
            return;
        }
        setSaving(true);
        try {
            let expenseId = editingId;
            if (editingId) {
                await editExpense(editingId, form);
            } else {
                expenseId = await addExpense(form);
                setCreatedExpenseId(expenseId);
            }

            // Upload pending receipt if any
            if (pendingFile && expenseId) {
                try {
                    await uploadExpenseReceipt(expenseId, pendingFile);
                } catch {
                    toast.warning(t("expenses.receiptUploadError"));
                }
            }

            toast.success(
                editingId ? t("expenses.updated") : t("expenses.created"),
            );
            fetchExpenses(true);
            setModalOpen(false);
        } catch {
            toast.error(t("expenses.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await removeExpense(deleteTarget);
            toast.success(t("expenses.deleted"));
        } catch {
            toast.error(t("expenses.deleteError"));
        } finally {
            setDeleteTarget(null);
        }
    };

    const currentMonthTotal = expenses
        .filter((e) => e.date?.startsWith(dayjs().format("YYYY-MM")))
        .reduce((sum, e) => sum + (e.amount_gross || 0), 0);

    const ytdTotal = expenses
        .filter((e) => e.date?.startsWith(dayjs().format("YYYY")))
        .reduce((sum, e) => sum + (e.amount_gross || 0), 0);

    const vatOptions = VAT_RATE_OPTIONS;

    const categoryOptions = (
        [
            "office",
            "travel",
            "software",
            "hardware",
            "marketing",
            "consulting",
            "utilities",
            "rent",
            "insurance",
            "other",
        ] as ExpenseCategory[]
    ).map((c) => ({ value: c, label: t(`expenses.category.${c}`) || c }));

    const paymentMethodOptions = [
        {
            value: "bank_transfer",
            label: t("expenses.paymentMethod.bank_transfer") || "Überweisung",
        },
        { value: "cash", label: t("expenses.paymentMethod.cash") || "Bar" },
        {
            value: "credit_card",
            label: t("expenses.paymentMethod.credit_card") || "Kreditkarte",
        },
        {
            value: "paypal",
            label: t("expenses.paymentMethod.paypal") || "PayPal",
        },
        {
            value: "other",
            label: t("expenses.paymentMethod.other") || "Sonstiges",
        },
    ];

    const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    const pageSize = 20;
    const pageCount = Math.max(1, Math.ceil(sortedExpenses.length / pageSize));
    const [page, setPage] = useState(1);
    const safePage = Math.min(page, pageCount);
    const pageExpenses = sortedExpenses.slice((safePage - 1) * pageSize, safePage * pageSize);

    const stats = [
        { label: t("expenses.monthTotal"), value: `€ ${currentMonthTotal.toFixed(2)}` },
        { label: t("expenses.ytdTotal"), value: `€ ${ytdTotal.toFixed(2)}` },
        { label: t("expenses.count"), value: String(expenses.length) },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">{t("expenses.title")}</h2>

            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-1">
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleImportEInvoice}>
                    <Import />
                    {t("expenses.importEInvoice")}
                </Button>
                <Button type="button" onClick={openCreate}>
                    <Plus />
                    {t("expenses.new")}
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("expenses.date")}</TableHead>
                                <TableHead>{t("expenses.vendor")}</TableHead>
                                <TableHead>{t("expenses.description")}</TableHead>
                                <TableHead>{t("expenses.category")}</TableHead>
                                <TableHead className="text-right">{t("expenses.gross")}</TableHead>
                                <TableHead className="text-right">{t("expenses.vat")}</TableHead>
                                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && pageExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        <Loader2 className="mr-2 inline size-4 animate-spin" />…
                                    </TableCell>
                                </TableRow>
                            ) : pageExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        {t("expenses.title")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageExpenses.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.date}</TableCell>
                                        <TableCell className="font-medium">{record.vendor_name}</TableCell>
                                        <TableCell>{record.description || "—"}</TableCell>
                                        <TableCell>
                                            <Badge className={categoryBadgeClass[record.category]}>
                                                {t(`expenses.category.${record.category}`) || record.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(record.amount_gross)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(record.vat_amount)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button type="button" variant="outline" size="icon-sm" onClick={() => openEdit(record)} aria-label={t("expenses.editTitle")}>
                                                    <Pencil />
                                                </Button>
                                                <Button type="button" variant="destructive" size="icon-sm" onClick={() => setDeleteTarget(record.id!)} aria-label={t("expenses.delete")}>
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {pageCount > 1 && (
                    <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                        <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((pg) => Math.max(1, pg - 1))}>‹</Button>
                        <span className="text-sm">{safePage} / {pageCount}</span>
                        <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((pg) => Math.min(pageCount, pg + 1))}>›</Button>
                    </div>
                )}
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? t("expenses.editTitle") : t("expenses.newTitle")}</DialogTitle>
                    </DialogHeader>

                    {/* Receipt upload / OCR */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-6 text-center transition-colors hover:bg-accent/50"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                    setPendingFile(file);
                                    void handleOCR(file);
                                }
                            }}
                        >
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setPendingFile(file);
                                        void handleOCR(file);
                                    }
                                    e.target.value = "";
                                }}
                            />
                            {ocrLoading ? <ScanLine className="size-6 animate-pulse text-primary" /> : <Upload className="size-6 text-muted-foreground" />}
                            <span className="text-sm text-muted-foreground">{t("expenses.uploadHint")}</span>
                        </label>
                        {pendingFile && <p className="text-xs text-muted-foreground">{pendingFile.name}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("expenses.date")} *</Label>
                            <DatePicker
                                value={form.date ? dayjs(form.date) : null}
                                onChange={(d) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        date: d ? d.format("YYYY-MM-DD") : "",
                                    }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="expense-vendor">{t("expenses.vendor")} *</Label>
                            <Input
                                id="expense-vendor"
                                value={form.vendor_name}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, vendor_name: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <Label htmlFor="expense-desc">{t("expenses.description")}</Label>
                            <Input
                                id="expense-desc"
                                value={form.description}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("expenses.gross")} (€)</Label>
                            <DecimalInput
                                value={form.amount_gross}
                                min={0}
                                step={0.01}
                                style={{ width: "100%" }}
                                onChange={handleGrossChange}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("expenses.vatRate")}</Label>
                            <Select value={String(form.vat_rate_percent)} onValueChange={(v) => handleVatRateChange(Number(v))}>
                                <SelectTrigger aria-label={t("expenses.vatRate")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {vatOptions.map((o) => (
                                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("expenses.category")}</Label>
                            <Select
                                value={form.category}
                                onValueChange={(v) => setForm((prev) => ({ ...prev, category: v as ExpenseCategory }))}
                            >
                                <SelectTrigger aria-label={t("expenses.category")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("expenses.paymentMethod")}</Label>
                            <Select
                                value={form.payment_method}
                                onValueChange={(v) => setForm((prev) => ({ ...prev, payment_method: v as ExpenseFormData["payment_method"] }))}
                            >
                                <SelectTrigger aria-label={t("expenses.paymentMethod")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {paymentMethodOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                            {t("expenses.cancel")}
                        </Button>
                        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                            {saving && <Loader2 className="animate-spin" />}
                            {t("expenses.save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("expenses.deleteConfirm")}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("expenses.cancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
                            {t("expenses.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
