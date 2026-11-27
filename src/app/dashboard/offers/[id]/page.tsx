"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Check, Loader2, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    getOfferById,
    updateOfferStatus,
    deleteOffer,
    convertOfferToInvoice,
} from "@/lib/offerService";
import { formatCurrency } from "@/lib/currencyUtils";
import type { OfferWithDetails, OfferStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusBadgeClass: Record<OfferStatus, string> = {
    draft: "bg-secondary text-secondary-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    expired: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    converted: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

type ConfirmKind = "convert" | "delete" | null;

export default function OfferDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useLanguage();

    const [offer, setOffer] = useState<OfferWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmKind>(null);

    useEffect(() => {
        void loadOffer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadOffer = async () => {
        setLoading(true);
        try {
            const data = await getOfferById(id);
            setOffer(data);
        } catch {
            toast.error(t("offers.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: OfferStatus) => {
        if (!offer) return;
        try {
            await updateOfferStatus(offer.id!, status);
            setOffer({ ...offer, status });
            toast.success(t("offers.statusUpdated"));
        } catch {
            toast.error(t("offers.updateError"));
        }
    };

    const handleConvert = async () => {
        if (!offer) return;
        setConverting(true);
        try {
            const invoiceId = await convertOfferToInvoice(offer.id!);
            toast.success(t("offers.converted"));
            router.push(`/dashboard/invoices/${invoiceId}`);
        } catch {
            toast.error(t("offers.convertError"));
        } finally {
            setConverting(false);
        }
    };

    const handleDelete = async () => {
        if (!offer) return;
        try {
            await deleteOffer(offer.id!);
            toast.success(t("offers.deleted"));
            router.push("/dashboard/offers");
        } catch {
            toast.error(t("offers.deleteError"));
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        );
    }
    if (!offer) {
        return (
            <Card>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t("offers.loadError")}</p>
                </CardContent>
            </Card>
        );
    }

    const canConvert = offer.status === "accepted" || offer.status === "sent";

    const facts: Array<{ label: string; value: React.ReactNode; span?: boolean }> = [
        { label: t("offers.client"), value: offer.client?.name || "—" },
        { label: t("offers.date"), value: offer.issue_date },
        { label: t("offers.validUntil"), value: offer.valid_until || "—" },
        ...(offer.purchase_order_ref ? [{ label: "Referenz", value: offer.purchase_order_ref }] : []),
        ...(offer.payment_terms ? [{ label: t("offerCreate.paymentTerms"), value: offer.payment_terms, span: true }] : []),
        ...(offer.notes ? [{ label: t("offerCreate.notes"), value: offer.notes, span: true }] : []),
    ];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/offers")}>
                    <ArrowLeft />
                    {t("offerDetail.backToOffers")}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader className="gap-3">
                        <CardTitle className="flex flex-wrap items-center gap-2">
                            <span>{offer.offer_number}</span>
                            <Badge className={statusBadgeClass[offer.status]}>
                                {t(`status.${offer.status}`) || offer.status}
                            </Badge>
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                            {offer.status === "draft" && (
                                <Button type="button" variant="outline" size="sm" onClick={() => void handleStatusUpdate("sent")}>
                                    <Send />
                                    {t("offers.markSent")}
                                </Button>
                            )}
                            {(offer.status === "sent" || offer.status === "draft") && (
                                <Button type="button" variant="outline" size="sm" onClick={() => void handleStatusUpdate("accepted")}>
                                    <Check />
                                    {t("offers.markAccepted")}
                                </Button>
                            )}
                            {offer.status === "sent" && (
                                <Button type="button" variant="destructive" size="sm" onClick={() => void handleStatusUpdate("rejected")}>
                                    <X />
                                    {t("offers.markRejected")}
                                </Button>
                            )}
                            {canConvert && (
                                <Button type="button" size="sm" disabled={converting} onClick={() => setConfirm("convert")}>
                                    {converting ? <Loader2 className="animate-spin" /> : <ArrowLeftRight />}
                                    {t("offers.convertToInvoice")}
                                </Button>
                            )}
                            <Button type="button" variant="destructive" size="icon-sm" onClick={() => setConfirm("delete")} aria-label={t("offers.delete")}>
                                <Trash2 />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
                            {facts.map((fact) => (
                                <div key={fact.label} className={`flex flex-col gap-1 bg-card px-3 py-2.5 ${fact.span ? "sm:col-span-2" : ""}`}>
                                    <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                                    <dd className="text-sm">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="flex items-center gap-3">
                            <Separator className="flex-1" />
                            <span className="text-sm font-medium text-muted-foreground">{t("offerDetail.positions")}</span>
                            <Separator className="flex-1" />
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("invoiceCreate.description")}</TableHead>
                                        <TableHead className="w-[90px] text-right">{t("invoiceCreate.quantity")}</TableHead>
                                        <TableHead className="w-[120px] text-right">{t("invoiceCreate.unitPrice")}</TableHead>
                                        <TableHead className="w-[80px] text-right">MwSt.</TableHead>
                                        <TableHead className="w-[120px] text-right">{t("invoiceCreate.lineTotal")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(offer.items ?? []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-right">{item.tax_rate_percent}%</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-sm">
                            <span>{t("invoiceCreate.subtotal")}: {formatCurrency(offer.subtotal)}</span>
                            <span>MwSt.: {formatCurrency(offer.total_vat)}</span>
                            <span className="text-base font-semibold">{t("invoiceCreate.total")}: {formatCurrency(offer.total_gross)}</span>
                        </div>
                    </CardContent>
                </Card>

                {offer.converted_invoice_id && (
                    <Card className="h-fit">
                        <CardContent className="flex flex-col gap-2">
                            <p className="text-sm text-muted-foreground">{t("status.converted")}</p>
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto justify-start p-0"
                                onClick={() => router.push(`/dashboard/invoices/${offer.converted_invoice_id}`)}
                            >
                                {t("correction.viewDoc")}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm === "convert" ? t("offerDetail.convertTitle") : t("offers.deleteConfirm")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm === "convert" ? t("offerDetail.convertDesc") : t("offers.deleteDesc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("offers.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant={confirm === "delete" ? "destructive" : "default"}
                            onClick={() => {
                                if (confirm === "convert") void handleConvert();
                                else void handleDelete();
                                setConfirm(null);
                            }}
                        >
                            {confirm === "convert" ? t("offerDetail.confirm") : t("offers.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
