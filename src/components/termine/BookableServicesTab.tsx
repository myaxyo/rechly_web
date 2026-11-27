"use client";

import DecimalInput from "@/components/DecimalInput";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { del, get, patch, post } from "@/lib/termine/client";
import type { Product, ProductFormData } from "@/types";

export interface BookableServiceRow {
    $id: string;
    name: string;
    description?: string;
    category?: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
    prepMinutes: number;
    cleanupMinutes: number;
    active: boolean;
    publicVisible: boolean;
    staffIds: string[];
    sortOrder: number;
    productId?: string;
    taxRatePercent?: number;
}

interface StaffItem {
    $id: string;
    name: string;
}

interface ServiceFormState {
    productId: string;
    name: string;
    category: string;
    description: string;
    durationMinutes: number | null;
    priceEur: number | null;
    taxRatePercent: number;
    prepMinutes: number | null;
    cleanupMinutes: number | null;
    active: boolean;
    publicVisible: boolean;
    staffIds: string[];
}

const EMPTY_FORM: ServiceFormState = {
    productId: "",
    name: "",
    category: "",
    description: "",
    durationMinutes: null,
    priceEur: null,
    taxRatePercent: 19,
    prepMinutes: null,
    cleanupMinutes: null,
    active: true,
    publicVisible: true,
    staffIds: [],
};

export default function BookableServicesTab({
    products,
    onCreateProduct,
    prefillProduct,
    onClearPrefill,
    onServicesChanged,
}: {
    products: Product[];
    onCreateProduct: (data: ProductFormData) => Promise<Product>;
    prefillProduct?: Product | null;
    onClearPrefill?: () => void;
    onServicesChanged?: (services: BookableServiceRow[]) => void;
}) {
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);

    const [rows, setRows] = useState<BookableServiceRow[]>([]);
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<BookableServiceRow | null>(null);
    const [values, setValues] = useState<ServiceFormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<{ name?: string; durationMinutes?: string }>({});

    const setField = <K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [s, st] = await Promise.all([
                get<{ services: BookableServiceRow[] }>("/api/termine/services"),
                get<{ staff: StaffItem[] }>("/api/termine/staff"),
            ]);
            setRows(s.services);
            setStaff(st.staff);
            onServicesChanged?.(s.services);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Laden fehlgeschlagen.", "Failed to load services."));
        } finally {
            setLoading(false);
        }
    }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!prefillProduct) return;
        const existing = rows.find((r) => r.productId === prefillProduct.id);
        if (existing) {
            openEdit(existing);
        } else {
            setEditing(null);
            setErrors({});
            setValues({
                ...EMPTY_FORM,
                productId: prefillProduct.id ?? "",
                name: prefillProduct.name,
                description: prefillProduct.description || "",
                durationMinutes: 60,
                priceEur: prefillProduct.price,
                taxRatePercent: prefillProduct.tax_rate_percent ?? 19,
                prepMinutes: 0,
                cleanupMinutes: 0,
                active: true,
                publicVisible: true,
                staffIds: staff.map((s) => s.$id),
            });
            setOpen(true);
        }
        onClearPrefill?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefillProduct]);

    function openNew() {
        setEditing(null);
        setErrors({});
        setValues({
            ...EMPTY_FORM,
            durationMinutes: 30,
            priceEur: 0,
            taxRatePercent: 19,
            prepMinutes: 0,
            cleanupMinutes: 0,
            active: true,
            publicVisible: true,
            staffIds: staff.map((s) => s.$id),
        });
        setOpen(true);
    }

    function openEdit(r: BookableServiceRow) {
        setEditing(r);
        setErrors({});
        setValues({
            productId: r.productId ?? "",
            name: r.name ?? "",
            category: r.category ?? "",
            description: r.description ?? "",
            durationMinutes: r.durationMinutes ?? null,
            priceEur: (r.priceCents ?? 0) / 100,
            taxRatePercent: r.taxRatePercent ?? 19,
            prepMinutes: r.prepMinutes ?? null,
            cleanupMinutes: r.cleanupMinutes ?? null,
            active: r.active ?? true,
            publicVisible: r.publicVisible ?? true,
            staffIds: r.staffIds ?? [],
        });
        setOpen(true);
    }

    async function save() {
        const nextErrors: { name?: string; durationMinutes?: string } = {};
        if (!values.name.trim()) {
            nextErrors.name = l("Name erforderlich.", "Name required.");
        }
        if (values.durationMinutes === null || values.durationMinutes === undefined || Number.isNaN(values.durationMinutes)) {
            nextErrors.durationMinutes = l("Dauer erforderlich.", "Duration required.");
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        setSaving(true);
        try {
            const payload = {
                name: values.name,
                description: values.description || undefined,
                category: values.category || undefined,
                durationMinutes: values.durationMinutes,
                priceCents: Math.round(Number(values.priceEur ?? 0) * 100),
                prepMinutes: values.prepMinutes ?? 0,
                cleanupMinutes: values.cleanupMinutes ?? 0,
                active: values.active,
                publicVisible: values.publicVisible,
                staffIds: values.staffIds ?? [],
                productId: values.productId || undefined,
                taxRatePercent: values.taxRatePercent ?? 19,
            };
            if (editing) await patch(`/api/termine/services/${editing.$id}`, payload);
            else await post("/api/termine/services", payload);
            toast.success(l("Buchbare Leistung gespeichert.", "Bookable service saved."));
            setOpen(false);
            await load();
        } catch (e) {
            if (e instanceof Error) toast.error(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function syncToProductCatalog(service: BookableServiceRow) {
        try {
            const created = await onCreateProduct({
                name: service.name,
                description: service.description || "",
                price: (service.priceCents || 0) / 100,
                tax_rate_percent: service.taxRatePercent ?? 19,
                unit_of_measure: "Stück",
            });
            if (created?.id) {
                await patch(`/api/termine/services/${service.$id}`, {
                    productId: created.id,
                    taxRatePercent: service.taxRatePercent ?? 19,
                });
                toast.success(
                    l(
                        "Als Rechnungsposition angelegt und verknüpft.",
                        "Created in Product catalog and linked.",
                    ),
                );
                await load();
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : l("Synchronisation fehlgeschlagen.", "Sync failed."));
        }
    }

    async function removeRow(r: BookableServiceRow) {
        try {
            await del(`/api/termine/services/${r.$id}`);
            toast.success(l("Gelöscht.", "Deleted."));
            await load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : l("Löschen fehlgeschlagen.", "Delete failed."),
            );
        }
    }

    const numberValue = (v: number | null) => (v === null || v === undefined ? "" : String(v));
    const parseNumber = (raw: string): number | null => {
        if (raw.trim() === "") return null;
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
    };

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-2xl text-sm text-muted-foreground">
                    {l(
                        "Leistungen für Ihren Online-Buchungskalender — direkt verknüpft mit Ihrem Produktkatalog und Ihren USt.-Sätzen für die 1-Klick-Rechnungserstellung.",
                        "Services for your online booking calendar — linked with your Product catalog and VAT rates for 1-click invoicing.",
                    )}
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/termine/buchungen?tab=staff">
                            {l("Mitarbeiter verwalten", "Manage staff")}
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/termine/buchungen?tab=availability">
                            {l("Arbeitszeiten", "Working hours")}
                        </Link>
                    </Button>
                    <Button onClick={openNew}>
                        <Plus />
                        {l("Neue buchbare Leistung", "New bookable service")}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col gap-3 py-2">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{l("Leistung", "Service")}</TableHead>
                                    <TableHead>{l("Dauer", "Duration")}</TableHead>
                                    <TableHead>{l("Preis (netto)", "Price (net)")}</TableHead>
                                    <TableHead>{l("USt.", "VAT")}</TableHead>
                                    <TableHead>{l("Produktkatalog", "Product link")}</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>{l("Aktionen", "Actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            {l(
                                                "Noch keine buchbaren Leistungen angelegt. Sie können bestehende Produkte direkt übernehmen.",
                                                "No bookable services yet. You can import existing products with 1 click.",
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((r) => {
                                        const linked = products.find((p) => p.id === r.productId);
                                        const rate = r.taxRatePercent ?? linked?.tax_rate_percent ?? 19;
                                        return (
                                            <TableRow key={r.$id}>
                                                <TableCell>{r.name}</TableCell>
                                                <TableCell>
                                                    {`${r.durationMinutes} min${
                                                        r.prepMinutes || r.cleanupMinutes
                                                            ? ` (+${(r.prepMinutes || 0) + (r.cleanupMinutes || 0)} min ${l("Puffer", "buffer")})`
                                                            : ""
                                                    }`}
                                                </TableCell>
                                                <TableCell>
                                                    {`${(r.priceCents / 100).toFixed(2).replace(".", ",")} ${r.currency}`}
                                                </TableCell>
                                                <TableCell>{`${rate}%`}</TableCell>
                                                <TableCell>
                                                    {linked ? (
                                                        <Badge>{linked.name}</Badge>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="link"
                                                            onClick={() => void syncToProductCatalog(r)}
                                                        >
                                                            <RefreshCw />
                                                            {l("In Produkte übernehmen", "Add to Products")}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {r.active ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                                                                {l("Aktiv", "Active")}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">{l("Inaktiv", "Inactive")}</Badge>
                                                        )}
                                                        {r.publicVisible ? (
                                                            <Badge>{l("Öffentlich", "Public")}</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">{l("Intern", "Internal")}</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1.5">
                                                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                                                            <Pencil />
                                                            {l("Bearbeiten", "Edit")}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            aria-label={l("Löschen", "Delete")}
                                                            onClick={() => void removeRow(r)}
                                                        >
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
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[580px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? l("Buchbare Leistung bearbeiten", "Edit bookable service")
                                : l("Neue buchbare Leistung", "New bookable service")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="service-product">
                                {l(
                                    "Mit Produkt / Rechnungsposition verknüpfen (optional)",
                                    "Link to Product / Invoice item (optional)",
                                )}
                            </Label>
                            <Select
                                value={values.productId || "__none__"}
                                onValueChange={(id) => {
                                    if (id === "__none__") {
                                        setField("productId", "");
                                        return;
                                    }
                                    setField("productId", id);
                                    const prod = products.find((p) => p.id === id);
                                    if (prod) {
                                        setValues((prev) => ({
                                            ...prev,
                                            productId: id,
                                            name: prod.name,
                                            description: prod.description || "",
                                            priceEur: prod.price,
                                            taxRatePercent: prod.tax_rate_percent,
                                        }));
                                    }
                                }}
                            >
                                <SelectTrigger id="service-product" className="w-full">
                                    <SelectValue
                                        placeholder={l("Aus Produktkatalog übernehmen …", "Import from Products …")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">
                                        {l("Kein Produkt verknüpft", "No product linked")}
                                    </SelectItem>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={p.id ?? ""}>
                                            {`${p.name} (${p.price.toFixed(2)} € · ${p.tax_rate_percent}% USt.)`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="service-name">Name</Label>
                            <Input
                                id="service-name"
                                value={values.name}
                                aria-invalid={!!errors.name}
                                onChange={(e) => setField("name", e.target.value)}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="service-category">{l("Kategorie (optional)", "Category (optional)")}</Label>
                            <Input
                                id="service-category"
                                value={values.category}
                                onChange={(e) => setField("category", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="service-description">{l("Beschreibung", "Description")}</Label>
                            <Textarea
                                id="service-description"
                                rows={2}
                                value={values.description}
                                onChange={(e) => setField("description", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="service-duration">{l("Dauer (Min.)", "Duration (min)")}</Label>
                                <Input
                                    id="service-duration"
                                    type="number"
                                    min={5}
                                    max={1440}
                                    step={5}
                                    value={numberValue(values.durationMinutes)}
                                    aria-invalid={!!errors.durationMinutes}
                                    onChange={(e) => setField("durationMinutes", parseNumber(e.target.value))}
                                />
                                {errors.durationMinutes && (
                                    <p className="text-xs text-destructive">{errors.durationMinutes}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="service-price">{l("Preis (EUR)", "Price (EUR)")}</Label>
                                <DecimalInput
                                    id="service-price"
                                    min={0}
                                    max={100000}
                                    step={0.01}
                                    precision={2}
                                    value={values.priceEur}
                                    onChange={(v) => setField("priceEur", v)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="service-tax">{l("USt.-Satz", "VAT rate")}</Label>
                                <Select
                                    value={String(values.taxRatePercent)}
                                    onValueChange={(v) => setField("taxRatePercent", Number(v))}
                                >
                                    <SelectTrigger id="service-tax" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="19">19 %</SelectItem>
                                        <SelectItem value="7">7 %</SelectItem>
                                        <SelectItem value="0">0 %</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="service-prep">{l("Vorbereitung (Min.)", "Prep buffer (min)")}</Label>
                                <Input
                                    id="service-prep"
                                    type="number"
                                    min={0}
                                    max={240}
                                    value={numberValue(values.prepMinutes)}
                                    onChange={(e) => setField("prepMinutes", parseNumber(e.target.value))}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="service-cleanup">
                                    {l("Nachbereitung (Min.)", "Cleanup buffer (min)")}
                                </Label>
                                <Input
                                    id="service-cleanup"
                                    type="number"
                                    min={0}
                                    max={240}
                                    value={numberValue(values.cleanupMinutes)}
                                    onChange={(e) => setField("cleanupMinutes", parseNumber(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>{l("Zuständige Mitarbeiter", "Assigned staff")}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full justify-between font-normal">
                                        <span className="truncate">
                                            {values.staffIds.length === 0
                                                ? l("Alle geeigneten Mitarbeiter", "All eligible staff")
                                                : values.staffIds
                                                      .map((id) => staff.find((s) => s.$id === id)?.name ?? id)
                                                      .join(", ")}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-2" align="start">
                                    {staff.length === 0 ? (
                                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                            {l("Keine Mitarbeiter vorhanden.", "No staff yet.")}
                                        </p>
                                    ) : (
                                        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                                            {staff.map((s) => (
                                                <label
                                                    key={s.$id}
                                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                                >
                                                    <Checkbox
                                                        checked={values.staffIds.includes(s.$id)}
                                                        onCheckedChange={(checked) => {
                                                            setField(
                                                                "staffIds",
                                                                checked === true
                                                                    ? [...values.staffIds, s.$id]
                                                                    : values.staffIds.filter((id) => id !== s.$id),
                                                            );
                                                        }}
                                                    />
                                                    <span>{s.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">
                                {l(
                                    "Leer = alle geeigneten Mitarbeiter. Die Leistung muss auch im Mitarbeiterprofil freigegeben sein.",
                                    "Empty = all eligible staff. The service must also be allowed in the staff profile.",
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="service-active"
                                    checked={values.active}
                                    onCheckedChange={(checked) => setField("active", checked)}
                                />
                                <Label htmlFor="service-active">{l("Aktiv", "Active")}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="service-public"
                                    checked={values.publicVisible}
                                    onCheckedChange={(checked) => setField("publicVisible", checked)}
                                />
                                <Label htmlFor="service-public">{l("Öffentlich buchbar", "Publicly bookable")}</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {l("Abbrechen", "Cancel")}
                        </Button>
                        <Button type="button" disabled={saving} onClick={() => void save()}>
                            {saving && <Loader2 className="animate-spin" />}
                            {l("Speichern", "Save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
