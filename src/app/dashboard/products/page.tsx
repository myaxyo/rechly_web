"use client";

import DecimalInput from "@/components/DecimalInput";

import { useEffect, useState } from "react";
import {
    CalendarDays, Download, Loader2, Pencil, Plus, Search, Trash2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useProductStore } from "@/store";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/currencyUtils";
import { isTermineEnabled } from "@/lib/features";
import { get as getTermine } from "@/lib/termine/client";
import BookableServicesTab, { type BookableServiceRow } from "@/components/termine/BookableServicesTab";
import type {
    Product,
    ProductBulkUploadResult,
    ProductCsvPreviewRow,
    ProductFormData,
} from "@/types";

export default function ProductsPage() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState("products");
    const [bookableServices, setBookableServices] = useState<BookableServiceRow[]>([]);
    const [prefillProduct, setPrefillProduct] = useState<Product | null>(null);
    const [searchText, setSearchText] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [values, setValues] = useState<ProductFormData>({ name: "", description: "", price: 0, tax_rate_percent: 19, unit_of_measure: "Stück" });
    const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [submitting, setSubmitting] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreviewRows, setCsvPreviewRows] = useState<
        ProductCsvPreviewRow[]
    >([]);
    const [csvPreviewErrors, setCsvPreviewErrors] = useState<string[]>([]);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [uploadingCsv, setUploadingCsv] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [bulkUploadResult, setBulkUploadResult] =
        useState<ProductBulkUploadResult | null>(null);

    const unitOptions = [
        { value: "Stück", label: t("products.unit.piece") },
        { value: "Stunde", label: t("products.unit.hour") },
        { value: "Tag", label: t("products.unit.day") },
        { value: "Monat", label: t("products.unit.month") },
        { value: "Pauschal", label: t("products.unit.flatRate") },
        { value: "kg", label: t("products.unit.kg") },
        { value: "m", label: t("products.unit.m") },
        { value: "m²", label: t("products.unit.sqm") },
        { value: "Liter", label: t("products.unit.liter") },
    ];

    const taxRateOptions = [
        { value: 19, label: t("products.vat.standard") },
        { value: 7, label: t("products.vat.reduced") },
        { value: 7.8, label: t("products.vat.flatRate") },
        { value: 5.5, label: t("products.vat.flatRateForestry") },
        { value: 0, label: t("products.vat.exempt") },
    ];

    // Zustand store
    const {
        products,
        loading,
        fetchProducts,
        addProduct,
        editProduct,
        removeProduct,
    } = useProductStore();

    // Filter products based on search
    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchText.toLowerCase()) ||
            product.description
                ?.toLowerCase()
                .includes(searchText.toLowerCase()),
    );

    useEffect(() => {
        const tabParam = new URLSearchParams(window.location.search).get("tab");
        if (tabParam === "services" || tabParam === "products") {
            setActiveTab(tabParam);
        }
        fetchProducts();
        if (isTermineEnabled()) {
            void getTermine<{ services: BookableServiceRow[] }>("/api/termine/services")
                .then((res) => setBookableServices(res.services))
                .catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const parseCsvLine = (line: string): string[] => {
        const out: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === "," && !inQuotes) {
                out.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        out.push(current.trim());
        return out;
    };

    const validatePreviewRow = (
        row: Record<string, string>,
        line: number,
    ): ProductCsvPreviewRow => {
        const errors: string[] = [];
        const name = (row.name || "").trim();
        const description = (row.description || "").trim();
        const price = Number(String(row.price || "").replace(",", "."));
        const taxRate = Number(
            String(row.tax_rate_percent || "").replace(",", "."),
        );
        const unit = (row.unit_of_measure || "Stück").trim() || "Stück";

        if (!name) errors.push("name is required");
        if (!Number.isFinite(price) || price < 0)
            errors.push("price must be a non-negative number");
        if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100)
            errors.push("tax_rate_percent must be between 0 and 100");

        return {
            row: line,
            name,
            description,
            price: Number.isFinite(price) ? price : 0,
            tax_rate_percent: Number.isFinite(taxRate) ? taxRate : 0,
            unit_of_measure: unit,
            errors,
        };
    };

    const buildCsvPreview = async (file: File) => {
        const raw = await file.text();
        const lines = raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length < 2) {
            setCsvPreviewRows([]);
            setCsvPreviewErrors(["CSV needs at least header + 1 data row"]);
            return;
        }

        const headers = parseCsvLine(lines[0]).map((header) =>
            header.toLowerCase(),
        );
        const requiredHeaders = [
            "name",
            "price",
            "tax_rate_percent",
            "unit_of_measure",
        ];
        const missing = requiredHeaders.filter(
            (header) => !headers.includes(header),
        );

        if (missing.length > 0) {
            setCsvPreviewRows([]);
            setCsvPreviewErrors([
                `Missing required columns: ${missing.join(", ")}`,
            ]);
            return;
        }

        const previewRows = lines.slice(1, 16).map((line, index) => {
            const values = parseCsvLine(line);
            const rowObj: Record<string, string> = {};
            headers.forEach((header, colIndex) => {
                rowObj[header] = values[colIndex] || "";
            });
            return validatePreviewRow(rowObj, index + 2);
        });

        setCsvPreviewErrors([]);
        setCsvPreviewRows(previewRows);
    };

    const downloadSampleCsv = () => {
        const sample = [
            "name,description,price,tax_rate_percent,unit_of_measure",
            'Website Audit,"Technical and SEO audit",450,19,Stück',
            'Monthly Maintenance,"Maintenance package",99.99,19,Monat',
            'Consulting Hour,"Strategic consulting",120,19,Stunde',
        ].join("\n");

        const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "products-sample.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handleCsvFile = async (file: File) => {
        setCsvFile(file);
        setBulkUploadResult(null);
        await buildCsvPreview(file);
    };

    const startCsvUpload = async () => {
        if (!csvFile) {
            toast.warning("Please choose a CSV file first.");
            return;
        }

        if (
            csvPreviewErrors.length > 0 ||
            csvPreviewRows.some((r) => r.errors.length > 0)
        ) {
            toast.error("Fix CSV validation errors before uploading.");
            return;
        }

        setUploadingCsv(true);
        setUploadProgress(0);
        setBulkUploadResult(null);

        const formData = new FormData();
        formData.append("file", csvFile);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/products/bulk-upload", true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        };

        xhr.onload = async () => {
            setUploadingCsv(false);
            setUploadProgress(100);

            try {
                const data = JSON.parse(
                    xhr.responseText || "{}",
                ) as ProductBulkUploadResult & { error?: string };

                if (xhr.status >= 200 && xhr.status < 300) {
                    setBulkUploadResult(data);
                    toast.success(
                        `Imported ${data.insertedRows} products (${data.failedRows} failed).`,
                    );
                    await fetchProducts(true);
                } else {
                    toast.error(data.error || "Bulk upload failed.");
                }
            } catch {
                toast.error("Bulk upload response could not be parsed.");
            }
        };

        xhr.onerror = () => {
            setUploadingCsv(false);
            toast.error("Upload failed. Please try again.");
        };

        xhr.send(formData);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setValues({ name: "", description: "", price: 0, tax_rate_percent: 19, unit_of_measure: "Stück" });
        setErrors({});
        setModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setValues({
            name: product.name,
            description: product.description ?? "",
            price: product.price,
            tax_rate_percent: product.tax_rate_percent,
            unit_of_measure: product.unit_of_measure,
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const nextErrors: Partial<Record<keyof ProductFormData, string>> = {};
        if (!values.name.trim()) nextErrors.name = t("products.required");
        if (values.price === undefined || values.price === null) nextErrors.price = t("products.required");
        if (!values.unit_of_measure) nextErrors.unit_of_measure = t("products.required");
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        setSubmitting(true);
        try {
            if (editingProduct) {
                await editProduct(editingProduct.id!, values);
                toast.success(t("products.updated"));
            } else {
                await addProduct(values);
                toast.success(t("products.created"));
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error(t("products.saveError"));
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await handleDelete(deleteTarget);
        setDeleteTarget(null);
    };

    const handleDelete = async (id: string) => {
        try {
            await removeProduct(id);
            toast.success(t("products.deleted"));
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error(t("products.deleteError"));
        }
    };

    const sortedProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
    const pageCount = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
    const safePage = Math.min(page, pageCount);
    const pageProducts = sortedProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

    const productsTabContent = (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-md">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("products.search")}
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                        className="pl-9"
                        aria-label={t("products.search")}
                    />
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <Button type="button" variant="outline" onClick={downloadSampleCsv}>
                        <Download />
                        Download sample CSV
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPreviewModalOpen(true)}>
                        <Upload />
                        CSV Upload
                    </Button>
                    <Button type="button" onClick={openCreateModal}>
                        <Plus />
                        {t("products.new")}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("products.name")}</TableHead>
                                <TableHead className="hidden md:table-cell">{t("products.description")}</TableHead>
                                <TableHead className="text-right">{t("products.price")}</TableHead>
                                <TableHead className="hidden sm:table-cell">{t("products.vat")}</TableHead>
                                <TableHead className="hidden lg:table-cell">{t("products.unit")}</TableHead>
                                {isTermineEnabled() && <TableHead className="hidden md:table-cell">{language === "de" ? "Online-Buchung" : "Online Booking"}</TableHead>}
                                <TableHead>{t("products.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && pageProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        <Loader2 className="mr-2 inline size-4 animate-spin" />…
                                    </TableCell>
                                </TableRow>
                            ) : pageProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">{t("products.title")}</TableCell>
                                </TableRow>
                            ) : (
                                pageProducts.map((record) => {
                                    const linked = isTermineEnabled()
                                        ? bookableServices.find((svc) => svc.productId === record.id || svc.name.toLowerCase() === record.name.toLowerCase())
                                        : undefined;
                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{record.name}</TableCell>
                                            <TableCell className="hidden max-w-[260px] truncate md:table-cell">{record.description || "—"}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(record.price)}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{record.tax_rate_percent}%</TableCell>
                                            <TableCell className="hidden lg:table-cell">{record.unit_of_measure}</TableCell>
                                            {isTermineEnabled() && (
                                                <TableCell className="hidden md:table-cell">
                                                    {linked ? (
                                                        <Badge
                                                            className={linked.active ? "cursor-pointer bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "cursor-pointer bg-secondary text-secondary-foreground"}
                                                            onClick={() => { setPrefillProduct(record); setActiveTab("services"); }}
                                                        >
                                                            <CalendarDays className="size-3" /> {linked.durationMinutes} min
                                                        </Badge>
                                                    ) : (
                                                        <Button type="button" variant="link" size="sm" className="h-auto p-0"
                                                            onClick={() => { setPrefillProduct(record); setActiveTab("services"); }}>
                                                            <CalendarDays />
                                                            {language === "de" ? "Als Termin anbieten" : "Make bookable"}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center gap-0.5">
                                                    {isTermineEnabled() && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button type="button" variant="ghost" size="icon" aria-label={language === "de" ? "Als Online-Terminleistung konfigurieren" : "Configure as bookable service"}
                                                                    onClick={() => { setPrefillProduct(record); setActiveTab("services"); }}>
                                                                    <CalendarDays />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{language === "de" ? "Als Online-Terminleistung konfigurieren" : "Configure as bookable service"}</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => openEditModal(record)} aria-label={t("products.editTitle")}>
                                                        <Pencil />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(record.id!)} aria-label={t("products.delete")}>
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        {sortedProducts.length === 0
                            ? t("products.pagination").replace("{0}", "0").replace("{1}", "0").replace("{2}", "0")
                            : t("products.pagination")
                                  .replace("{0}", String((safePage - 1) * pageSize + 1))
                                  .replace("{1}", String(Math.min(safePage * pageSize, sortedProducts.length)))
                                  .replace("{2}", String(sortedProducts.length))}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((pg) => Math.max(1, pg - 1))}>‹</Button>
                        <span className="text-sm">{safePage} / {pageCount}</span>
                        <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((pg) => Math.min(pageCount, pg + 1))}>›</Button>
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <TooltipProvider>
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
                {isTermineEnabled()
                    ? language === "de"
                        ? "Produkte & buchbare Leistungen"
                        : "Products & Bookable Services"
                    : t("products.title")}
            </h2>

            {isTermineEnabled() ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="products">
                            {language === "de" ? `Produkte & Rechnungspositionen (${products.length})` : `Products & Invoice Items (${products.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="services">
                            <CalendarDays />
                            {language === "de" ? `Online buchbare Leistungen (${bookableServices.length})` : `Online Bookable Services (${bookableServices.length})`}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="products">{productsTabContent}</TabsContent>
                    <TabsContent value="services">
                        <BookableServicesTab
                            products={products}
                            onCreateProduct={addProduct}
                            prefillProduct={prefillProduct}
                            onClearPrefill={() => setPrefillProduct(null)}
                            onServicesChanged={setBookableServices}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                productsTabContent
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? t("products.editTitle") : t("products.newTitle")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="product-name">{t("products.name")}</Label>
                            <Input id="product-name" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} placeholder={t("products.productName")} aria-invalid={!!errors.name} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="product-desc">{t("products.description")}</Label>
                            <Textarea id="product-desc" value={values.description ?? ""} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} placeholder={t("products.descPlaceholder")} rows={3} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
                            <div className="flex flex-col gap-1.5">
                                <Label>{t("products.priceLabel")}</Label>
                                <DecimalInput
                                    placeholder="0,00"
                                    step={0.01}
                                    min={0}
                                    precision={2}
                                    style={{ width: "100%" }}
                                    value={values.price}
                                    onChange={(v) => setValues((prev) => ({ ...prev, price: v ?? 0 }))}
                                />
                                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>{t("products.vatRate")}</Label>
                                <Select value={String(values.tax_rate_percent)} onValueChange={(v) => setValues((prev) => ({ ...prev, tax_rate_percent: Number(v) }))}>
                                    <SelectTrigger aria-label={t("products.vatRate")}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {taxRateOptions.map((o) => (
                                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{t("products.unit")}</Label>
                            <Select value={values.unit_of_measure} onValueChange={(v) => setValues((prev) => ({ ...prev, unit_of_measure: v }))}>
                                <SelectTrigger aria-label={t("products.unit")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {unitOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.unit_of_measure && <p className="text-xs text-destructive">{errors.unit_of_measure}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                {t("products.cancel")}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="animate-spin" />}
                                {editingProduct ? t("products.save") : t("products.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* CSV bulk upload dialog */}
            <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>CSV Bulk Upload</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="inline-flex cursor-pointer">
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) void handleCsvFile(file);
                                        e.target.value = "";
                                    }}
                                />
                                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium hover:bg-accent">
                                    <Upload className="size-4" /> Select CSV file
                                </span>
                            </label>
                            {csvFile && <p className="mt-1 text-xs text-muted-foreground">{csvFile.name}</p>}
                        </div>

                        {uploadingCsv && <Progress value={uploadProgress} />}

                        {csvPreviewErrors.map((error, index) => (
                            <Alert key={`${error}-${index}`} variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ))}

                        {csvPreviewRows.length > 0 && (
                            <>
                                <Separator />
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[70px]">Row</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="w-[120px]">Price</TableHead>
                                                <TableHead className="w-[90px]">VAT</TableHead>
                                                <TableHead className="w-[100px]">Unit</TableHead>
                                                <TableHead>Validation</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {csvPreviewRows.map((row) => (
                                                <TableRow key={row.row}>
                                                    <TableCell>{row.row}</TableCell>
                                                    <TableCell>{row.name}</TableCell>
                                                    <TableCell>{formatCurrency(row.price)}</TableCell>
                                                    <TableCell>{row.tax_rate_percent}%</TableCell>
                                                    <TableCell>{row.unit_of_measure}</TableCell>
                                                    <TableCell>
                                                        {row.errors.length > 0 ? (
                                                            <span className="text-destructive">{row.errors.join("; ")}</span>
                                                        ) : (
                                                            <span className="text-emerald-600">valid</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}

                        {bulkUploadResult && (
                            <Alert>
                                <AlertDescription>
                                    <span>{`Processed: ${bulkUploadResult.processedRows}, Inserted: ${bulkUploadResult.insertedRows}, Failed: ${bulkUploadResult.failedRows}`}</span>
                                    {bulkUploadResult.mlTrigger && (
                                        <span className="block">{`ML recompute: ${bulkUploadResult.mlTrigger.success ? "success" : "not completed"}${bulkUploadResult.mlTrigger.details ? ` (${bulkUploadResult.mlTrigger.details})` : ""}`}</span>
                                    )}
                                    {bulkUploadResult.errors.length > 0 && (
                                        <ul className="mt-2 list-disc pl-5">
                                            {bulkUploadResult.errors.slice(0, 10).map((error) => (
                                                <li key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</li>
                                            ))}
                                        </ul>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPreviewModalOpen(false)}>
                            {t("products.cancel")}
                        </Button>
                        <Button type="button" disabled={uploadingCsv} onClick={() => void startCsvUpload()}>
                            {uploadingCsv && <Loader2 className="animate-spin" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("products.deleteConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("products.deleteDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("products.cancel")}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
                            {t("products.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </TooltipProvider>
    );
}
