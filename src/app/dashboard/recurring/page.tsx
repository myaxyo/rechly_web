"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRecurringStore } from "@/store/recurringStore";
import { generateNextInvoice } from "@/lib/recurringService";
import { formatCurrency } from "@/lib/currencyUtils";
import type { RecurringInterval } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const intervalBadgeClass: Record<RecurringInterval, string> = {
    weekly: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    monthly: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    quarterly: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    annually: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export default function RecurringPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { templates, loading, fetchTemplates, toggleActive, removeTemplate } =
        useRecurringStore();
    const [generating, setGenerating] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleGenerate = async (id: string) => {
        setGenerating(id);
        try {
            const invoiceId = await generateNextInvoice(id);
            toast.success(t("recurring.invoiceGenerated"));
            fetchTemplates(true);
            router.push(`/dashboard/invoices/${invoiceId}`);
        } catch {
            toast.error(t("recurring.generateError"));
        } finally {
            setGenerating(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await removeTemplate(deleteTarget.id);
            toast.success(t("recurring.deleted"));
        } catch {
            toast.error(t("recurring.deleteError"));
        } finally {
            setDeleteTarget(null);
        }
    };

    const activeCount = templates.filter((tpl) => tpl.is_active).length;
    const overdueCount = templates.filter(
        (tpl) => tpl.is_active && dayjs(tpl.next_due_date).isBefore(dayjs(), "day"),
    ).length;

    const stats = [
        { label: t("recurring.total"), value: String(templates.length), className: "" },
        { label: t("recurring.active"), value: String(activeCount), className: "text-emerald-500" },
        { label: t("recurring.overdue"), value: String(overdueCount), className: "text-amber-500" },
    ];

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">{t("recurring.title")}</h2>

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

                <div className="flex justify-end">
                    <Button type="button" onClick={() => router.push("/dashboard/recurring/create")}>
                        <Plus />
                        {t("recurring.new")}
                    </Button>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("recurring.name")}</TableHead>
                                    <TableHead>{t("recurring.client")}</TableHead>
                                    <TableHead>{t("recurring.interval")}</TableHead>
                                    <TableHead>{t("recurring.nextDue")}</TableHead>
                                    <TableHead className="text-right">{t("recurring.amount")}</TableHead>
                                    <TableHead>{t("recurring.active")}</TableHead>
                                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            <Loader2 className="mr-2 inline size-4 animate-spin" />
                                            …
                                        </TableCell>
                                    </TableRow>
                                ) : templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            {t("recurring.title")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    templates.map((r) => {
                                        const isOverdue = r.next_due_date
                                            ? dayjs(r.next_due_date).isBefore(dayjs(), "day")
                                            : false;
                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.template_name}</TableCell>
                                                <TableCell>{r.client?.name || "—"}</TableCell>
                                                <TableCell>
                                                    <Badge className={intervalBadgeClass[r.interval]}>
                                                        {t(`recurring.interval.${r.interval}`) || r.interval}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {r.next_due_date ? (
                                                        <Badge className={isOverdue ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-secondary text-secondary-foreground"}>
                                                            {r.next_due_date}
                                                        </Badge>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(r.total_gross)}</TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={r.is_active}
                                                        onCheckedChange={(checked) => void toggleActive(r.id!, checked)}
                                                        aria-label={t("recurring.active")}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    size="icon-sm"
                                                                    disabled={generating === r.id}
                                                                    onClick={() => void handleGenerate(r.id!)}
                                                                    aria-label={t("recurring.generate")}
                                                                >
                                                                    {generating === r.id ? <Loader2 className="animate-spin" /> : <Play />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t("recurring.generate")}</TooltipContent>
                                                        </Tooltip>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon-sm"
                                                            onClick={() => setDeleteTarget({ id: r.id!, name: r.template_name })}
                                                            aria-label={t("recurring.delete")}
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
                    </div>
                </Card>

                <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("recurring.deleteConfirm")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {deleteTarget ? `"${deleteTarget.name}" ${t("recurring.deleteDesc")}` : ""}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("recurring.cancel")}</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
                                {t("recurring.delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
