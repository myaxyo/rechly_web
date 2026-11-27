"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeftRight, Check, EllipsisVertical, Eye, Loader2, Plus, Search, Send, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfferStore } from "@/store/offerStore";
import { formatCurrency } from "@/lib/currencyUtils";
import { convertOfferToInvoice } from "@/lib/offerService";
import type { OfferWithClient, OfferStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const statusBadgeClass: Record<OfferStatus, string> = {
    draft: "bg-secondary text-secondary-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    expired: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    converted: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

type ConfirmState =
    | { kind: "delete"; id: string }
    | { kind: "convert"; id: string }
    | null;

export default function OffersPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { offers, loading, fetchOffers, updateStatus, removeOffer } =
        useOfferStore();

    const [search, setSearch] = useState("");
    const [converting, setConverting] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<ConfirmState>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const filtered = offers.filter(
        (o) =>
            search === "" ||
            o.offer_number?.toLowerCase().includes(search.toLowerCase()) ||
            o.client?.name?.toLowerCase().includes(search.toLowerCase()),
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pageCount);
    const pageOffers = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleStatusUpdate = useCallback(
        async (id: string, status: OfferStatus) => {
            try {
                await updateStatus(id, status);
                toast.success(t("offers.statusUpdated"));
            } catch {
                toast.error(t("offers.updateError"));
            }
        },
        [updateStatus, t],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await removeOffer(id);
                toast.success(t("offers.deleted"));
            } catch {
                toast.error(t("offers.deleteError"));
            }
        },
        [removeOffer, t],
    );

    const handleConvert = useCallback(
        async (id: string) => {
            setConverting(id);
            try {
                const invoiceId = await convertOfferToInvoice(id);
                toast.success(t("offers.converted"));
                fetchOffers(true);
                router.push(`/dashboard/invoices/${invoiceId}`);
            } catch {
                toast.error(t("offers.convertError"));
            } finally {
                setConverting(null);
            }
        },
        [t, fetchOffers, router],
    );

    const totalOffers = offers.length;
    const sentOffers = offers.filter((o) => o.status === "sent").length;
    const acceptedOffers = offers.filter((o) => o.status === "accepted").length;
    const expiredOffers = offers.filter((o) => o.status === "expired").length;

    const stats = [
        { label: t("offers.total"), value: String(totalOffers), className: "" },
        { label: t("offers.sent"), value: String(sentOffers), className: "" },
        { label: t("offers.accepted"), value: String(acceptedOffers), className: "text-emerald-500" },
        { label: t("offers.expired"), value: String(expiredOffers), className: "text-amber-500" },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">{t("offers.title")}</h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-1">
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className={cn("mt-1 text-2xl font-semibold", stat.className)}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-md">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("offers.search")}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9"
                        aria-label={t("offers.search")}
                    />
                </div>
                <div className="sm:ml-auto">
                    <Button type="button" onClick={() => router.push("/dashboard/offers/create")} className="w-full sm:w-auto">
                        <Plus />
                        {t("offers.new")}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("offers.number")}</TableHead>
                                <TableHead>{t("offers.client")}</TableHead>
                                <TableHead>{t("offers.date")}</TableHead>
                                <TableHead>{t("offers.validUntil")}</TableHead>
                                <TableHead className="text-right">{t("offers.amount")}</TableHead>
                                <TableHead>{t("offers.status")}</TableHead>
                                <TableHead className="text-right">{t("offers.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && pageOffers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        <Loader2 className="mr-2 inline size-4 animate-spin" />…
                                    </TableCell>
                                </TableRow>
                            ) : pageOffers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        {t("offers.title")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageOffers.map((record) => (
                                    <TableRow key={record.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/offers/${record.id}`)}>
                                        <TableCell className="font-medium">{record.offer_number}</TableCell>
                                        <TableCell>{record.client?.name || "—"}</TableCell>
                                        <TableCell>{record.issue_date}</TableCell>
                                        <TableCell>{record.valid_until || "—"}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(record.total_gross)}</TableCell>
                                        <TableCell>
                                            <Badge className={statusBadgeClass[record.status]}>
                                                {t(`status.${record.status}`) || record.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="ghost" size="icon" aria-label={t("offers.actions")}>
                                                            <EllipsisVertical />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/offers/${record.id}`)}>
                                                            <Eye />{t("offers.view")}
                                                        </DropdownMenuItem>
                                                        {record.status === "draft" && (
                                                            <DropdownMenuItem onClick={() => void handleStatusUpdate(record.id!, "sent")}>
                                                                <Send />{t("offers.markSent")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {(record.status === "sent" || record.status === "draft") && (
                                                            <DropdownMenuItem onClick={() => void handleStatusUpdate(record.id!, "accepted")}>
                                                                <Check />{t("offers.markAccepted")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {record.status === "sent" && (
                                                            <DropdownMenuItem onClick={() => void handleStatusUpdate(record.id!, "rejected")}>
                                                                <X />{t("offers.markRejected")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {(record.status === "accepted" || record.status === "sent") && (
                                                            <DropdownMenuItem disabled={converting === record.id} onClick={() => setConfirm({ kind: "convert", id: record.id! })}>
                                                                <ArrowLeftRight />
                                                                {converting === record.id ? t("offers.converting") : t("offers.convertToInvoice")}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem variant="destructive" onClick={() => setConfirm({ kind: "delete", id: record.id! })}>
                                                            <Trash2 />{t("offers.delete")}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        {filtered.length === 0
                            ? t("offers.pagination").replace("{0}", "0").replace("{1}", "0").replace("{2}", "0")
                            : t("offers.pagination")
                                  .replace("{0}", String((safePage - 1) * pageSize + 1))
                                  .replace("{1}", String(Math.min(safePage * pageSize, filtered.length)))
                                  .replace("{2}", String(filtered.length))}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</Button>
                        <span className="text-sm">{safePage} / {pageCount}</span>
                        <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>›</Button>
                    </div>
                </div>
            </Card>

            <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.kind === "convert" ? t("offerDetail.convertTitle") : t("offers.deleteConfirm")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm?.kind === "convert" ? t("offerDetail.convertDesc") : t("offers.deleteDesc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("offers.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            variant={confirm?.kind === "delete" ? "destructive" : "default"}
                            onClick={() => {
                                if (!confirm) return;
                                if (confirm.kind === "delete") void handleDelete(confirm.id);
                                else void handleConvert(confirm.id);
                                setConfirm(null);
                            }}
                        >
                            {confirm?.kind === "convert" ? t("offerDetail.confirm") : t("offers.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
