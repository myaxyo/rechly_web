"use client";

import DecimalInput from "@/components/DecimalInput";
import { getCompanyInfo } from "@/lib/companyService";
import { defaultVatRate, VAT_RATE_OPTIONS } from "@/lib/vatDefaults";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Check, CircleCheck, Loader2, Plus, Tags, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { Steps } from "@/components/ui/steps";
import dayjs from "dayjs";
import { getAllClients } from "@/lib/clientService";
import { getAllProducts } from "@/lib/productService";
import { createOffer } from "@/lib/offerService";
import { formatCurrency, calculateInvoiceTotals } from "@/lib/currencyUtils";
import type {
    Client,
    Product,
    OfferFormData,
    OfferItemFormData,
} from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface LineItem {
    key: string;
    description: string;
    quantity: number;
    unit_of_measure: string;
    price: number;
    tax_rate_percent: number;
    discount_percent: number;
}

const vatOptions = VAT_RATE_OPTIONS;

export default function OfferCreatePage() {
    const router = useRouter();
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [smallBusiness, setSmallBusiness] = useState(false);
    const [flatRateFarming, setFlatRateFarming] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [offerDate, setOfferDate] = useState(dayjs());
    const [validUntil, setValidUntil] = useState(dayjs().add(30, "day"));
    const [offerNumber, setOfferNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("");
    const [createdOfferId, setCreatedOfferId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        const now = new Date();
        const yyyyMM = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const suffix = Math.floor(Math.random() * 900 + 100);
        setOfferNumber(`AN-${yyyyMM}-${suffix}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clientsData, productsData, companyData] = await Promise.all([
                getAllClients(),
                getAllProducts(),
                getCompanyInfo(),
            ]);
            setClients(clientsData);
            setSmallBusiness(!!companyData?.is_small_business);
            setFlatRateFarming(!!companyData?.is_flat_rate_farming);
            setProducts(productsData);
        } catch {
            toast.error(t("offerCreate.saveError"));
        } finally {
            setLoading(false);
        }
    };

    const addEmptyLine = () => {
        setLineItems((prev) => [
            ...prev,
            {
                key: Date.now().toString(),
                description: "",
                quantity: 1,
                unit_of_measure: "Stück",
                price: 0,
                tax_rate_percent: defaultVatRate(smallBusiness, null, flatRateFarming),
                discount_percent: 0,
            },
        ]);
    };

    const addFromProduct = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        setLineItems((prev) => [
            ...prev,
            {
                key: Date.now().toString(),
                description: product.name,
                quantity: 1,
                unit_of_measure: product.unit_of_measure,
                price: product.price,
                tax_rate_percent: defaultVatRate(smallBusiness, product.tax_rate_percent, flatRateFarming),
                discount_percent: 0,
            },
        ]);
    };

    const updateLineItem = (
        key: string,
        field: keyof LineItem,
        value: string | number,
    ) => {
        setLineItems((prev) =>
            prev.map((item) =>
                item.key === key ? { ...item, [field]: value } : item,
            ),
        );
    };

    const removeLineItem = (key: string) => {
        setLineItems((prev) => prev.filter((item) => item.key !== key));
    };

    const totals = calculateInvoiceTotals(
        lineItems.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            tax_rate_percent: item.tax_rate_percent,
            discount_percent: item.discount_percent,
        })),
    );

    const handleCreate = async () => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            const offerData: OfferFormData = {
                client_id: selectedClient.id!,
                offer_number: offerNumber,
                issue_date: offerDate.format("YYYY-MM-DD"),
                valid_until: validUntil.format("YYYY-MM-DD"),
                notes: notes || undefined,
                payment_terms: paymentTerms || undefined,
                items: lineItems.map(
                    (item): OfferItemFormData => ({
                        description: item.description,
                        quantity: item.quantity,
                        unit_of_measure: item.unit_of_measure,
                        price: item.price,
                        tax_rate_percent: item.tax_rate_percent,
                        discount_percent: item.discount_percent,
                    }),
                ),
            };
            const id = await createOffer(offerData);
            setCreatedOfferId(id);
            setCurrentStep(3);
        } catch {
            toast.error(t("offerCreate.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const steps = [
        { title: t("offerCreate.selectClient") },
        { title: t("offerCreate.addItems") },
        { title: t("offerCreate.review") },
        { title: t("offerCreate.done") },
    ];

    const selectOptions = (options: Array<{ value: string | number; label: string }>, value: string | number | undefined, onChange: (v: string) => void, placeholder?: string, disabled = false) => (
        <Select value={value !== undefined && value !== null && value !== "" ? String(value) : undefined} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
            <div className="flex items-center gap-3">
                <Tags className="size-6 text-primary" />
                <h2 className="text-xl font-semibold">{t("offerCreate.title")}</h2>
            </div>

            <Steps current={currentStep} items={steps} />

            {currentStep === 0 && (
                <Card>
                    <CardContent className="flex flex-col gap-4">
                        <h3 className="text-base font-semibold">{t("offerCreate.selectClient")}</h3>
                        {selectOptions(
                            clients.map((c) => ({ value: c.id ?? "", label: c.name })),
                            selectedClient?.id,
                            (val) => setSelectedClient(clients.find((c) => c.id === val) || null),
                            t("invoiceCreate.searchClients"),
                            loading,
                        )}
                        <div className="flex justify-end">
                            <Button type="button" disabled={!selectedClient} onClick={() => setCurrentStep(1)}>
                                {t("offerCreate.next")}
                                <ArrowRight />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 1 && (
                <Card>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="w-full sm:w-[250px]">
                                <Select
                                    value={undefined}
                                    onValueChange={(val) => addFromProduct(val)}
                                >
                                    <SelectTrigger aria-label={t("invoiceCreate.addFromProducts")}><SelectValue placeholder={t("invoiceCreate.addFromProducts")} /></SelectTrigger>
                                    <SelectContent>
                                        {products.map((prod) => (
                                            <SelectItem key={prod.id} value={prod.id ?? ""}>{prod.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" variant="outline" onClick={addEmptyLine}>
                                <Plus />
                                {t("invoiceCreate.addEmptyLine")}
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("invoiceCreate.description")}</TableHead>
                                        <TableHead className="w-[110px]">{t("invoiceCreate.quantity")}</TableHead>
                                        <TableHead className="w-[140px]">{t("invoiceCreate.unitPrice")}</TableHead>
                                        <TableHead className="w-[110px]">MwSt.</TableHead>
                                        <TableHead className="w-[110px] text-right">{t("invoiceCreate.lineTotal")}</TableHead>
                                        <TableHead className="w-[50px]"><span className="sr-only">Delete</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lineItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                {t("invoiceCreate.noItems")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lineItems.map((record) => {
                                            const net = record.quantity * record.price * (1 - record.discount_percent / 100);
                                            const gross = net * (1 + record.tax_rate_percent / 100);
                                            return (
                                                <TableRow key={record.key}>
                                                    <TableCell className="min-w-[180px]">
                                                        <Textarea
                                                            value={record.description}
                                                            onChange={(e) => updateLineItem(record.key, "description", e.target.value)}
                                                            placeholder={t("invoiceCreate.description")}
                                                            rows={1}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <DecimalInput
                                                            value={record.quantity}
                                                            min={0}
                                                            step={0.5}
                                                            onChange={(v) => updateLineItem(record.key, "quantity", v ?? 0)}
                                                            style={{ width: "100%" }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <DecimalInput
                                                            value={record.price}
                                                            min={0}
                                                            step={0.01}
                                                            addonAfter="€"
                                                            onChange={(v) => updateLineItem(record.key, "price", v ?? 0)}
                                                            style={{ width: "100%" }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={String(record.tax_rate_percent)}
                                                            onValueChange={(v) => updateLineItem(record.key, "tax_rate_percent", Number(v))}
                                                        >
                                                            <SelectTrigger aria-label="MwSt."><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {vatOptions.map((o) => (
                                                                    <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(gross)}</TableCell>
                                                    <TableCell>
                                                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeLineItem(record.key)} aria-label="Delete">
                                                            <Trash2 />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {lineItems.length > 0 && (
                            <div className="flex flex-col items-end gap-1 text-sm">
                                <span>{t("invoiceCreate.subtotal")}: {formatCurrency(totals.netAfterDiscount)}</span>
                                <span>{t("invoiceCreate.vat")}: {formatCurrency(totals.totalVAT)}</span>
                                <span className="text-base font-semibold">{t("invoiceCreate.total")}: {formatCurrency(totals.totalGross)}</span>
                            </div>
                        )}

                        <Separator />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>
                                <ArrowLeft />
                                {t("offerCreate.back")}
                            </Button>
                            <Button type="button" disabled={lineItems.length === 0} onClick={() => setCurrentStep(2)}>
                                {t("offerCreate.next")}
                                <ArrowRight />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 2 && (
                <Card>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="offer-number">{t("offerCreate.offerNumber")}</Label>
                                <Input id="offer-number" value={offerNumber} onChange={(e) => setOfferNumber(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>{t("offerCreate.offerDate")}</Label>
                                <DatePicker value={offerDate} onChange={(d) => d && setOfferDate(d)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>{t("offerCreate.validUntil")}</Label>
                                <DatePicker value={validUntil} onChange={(d) => d && setValidUntil(d)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="offer-terms">{t("offerCreate.paymentTerms")}</Label>
                                <Input id="offer-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="offer-notes">{t("offerCreate.notes")}</Label>
                                <Textarea id="offer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder={t("offerCreate.notesPlaceholder")} />
                            </div>
                        </div>

                        <Separator />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                                <ArrowLeft />
                                {t("offerCreate.back")}
                            </Button>
                            <Button type="button" disabled={saving || !offerNumber} onClick={() => void handleCreate()}>
                                {saving ? <Loader2 className="animate-spin" /> : <Check />}
                                {t("offerCreate.createOffer")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {currentStep === 3 && createdOfferId && (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                        <CircleCheck className="size-12 text-emerald-500" />
                        <h3 className="text-lg font-semibold">{t("offerCreate.success")}</h3>
                        <p className="text-sm text-muted-foreground">{t("offerCreate.successDesc")}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button type="button" onClick={() => router.push(`/dashboard/offers/${createdOfferId}`)}>
                                {t("offerCreate.viewOffer")}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/offers/create")}>
                                {t("offerCreate.createAnother")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
