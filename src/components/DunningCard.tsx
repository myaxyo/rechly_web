"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Printer } from "lucide-react";
import { toast } from "sonner";
import DecimalInput from "@/components/DecimalInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import {
    generateDunningLetterHTML,
    type DunningNoticeData,
} from "@/lib/dunningLetter";
import type { InvoiceWithDetails, UserCompany } from "@/types";

const LEVEL_LABELS: Record<number, string> = {
    1: "Zahlungserinnerung",
    2: "1. Mahnung",
    3: "2. Mahnung",
};

interface DunningNotice extends DunningNoticeData {
    id: string;
}

interface DunningCardProps {
    invoice: InvoiceWithDetails;
    company: UserCompany | null;
}

/**
 * Mahnwesen section on the invoice detail page: staged dunning with
 * printable letters. Only shown for sent invoices past their due date
 * (or ones that already have notices).
 */
export default function DunningCard({ invoice, company }: DunningCardProps) {
    const [notices, setNotices] = useState<DunningNotice[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [fee, setFee] = useState(0);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/invoices/${invoice.id}/dunning`);
            if (res.ok) setNotices(await res.json());
        } catch (error) {
            console.error("Error loading dunning notices:", error);
        }
    }, [invoice.id]);

    useEffect(() => {
        load();
    }, [load]);

    const today = new Date().toISOString().slice(0, 10);
    const isOverdue =
        invoice.status === "sent" &&
        !!invoice.due_date &&
        invoice.due_date < today &&
        !invoice.correction_type;

    if (!isOverdue && notices.length === 0) return null;

    const maxLevel = notices.reduce(
        (max, notice) => Math.max(max, notice.level),
        0
    );
    const nextLevel = Math.min(3, maxLevel + 1);

    const printLetter = async (notice: DunningNoticeData) => {
        if (!company) return;
        const html = await generateDunningLetterHTML(company, invoice, notice);
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
    };

    const handleCreate = async () => {
        try {
            setBusy(true);
            const res = await fetch(`/api/invoices/${invoice.id}/dunning`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ level: nextLevel, fee }),
            });
            if (!res.ok) throw new Error("failed");
            const notice: DunningNotice = await res.json();
            setModalOpen(false);
            await load();
            await printLetter(notice);
        } catch (error) {
            console.error("Dunning creation failed:", error);
            toast.error("Mahnung konnte nicht erstellt werden.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Mahnwesen</CardTitle>
                {maxLevel < 3 && isOverdue && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            setFee(nextLevel === 1 ? 0 : nextLevel === 2 ? 5 : 10);
                            setModalOpen(true);
                        }}
                    >
                        <Mail />
                        {LEVEL_LABELS[nextLevel]} erstellen
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {notices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Diese Rechnung ist überfällig. Erstellen Sie eine
                        Zahlungserinnerung — die Mahnstufen (Erinnerung, 1. und 2.
                        Mahnung) bauen aufeinander auf.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y divide-border">
                        {notices.map((notice) => (
                            <li key={notice.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <div className="flex flex-col gap-1">
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                            {LEVEL_LABELS[notice.level]}
                                        </Badge>
                                        {notice.notice_number}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {`${formatDateGerman(notice.issue_date)} · ${notice.days_overdue} Tage überfällig${notice.fee ? ` · Gebühr ${formatCurrency(notice.fee, "de")}` : ""}`}
                                    </span>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => void printLetter(notice)}>
                                    <Printer />
                                    Drucken
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{`${LEVEL_LABELS[nextLevel]} erstellen`}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Es wird ein Mahnschreiben mit fortlaufender Nummer
                        erstellt. Die Mahngebühr wird zum offenen Betrag addiert
                        (Girocode inklusive).
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <Label>Mahngebühr (€)</Label>
                        <DecimalInput
                            min={0}
                            value={fee}
                            onChange={(value) => setFee(value ?? 0)}
                            style={{ width: 260 }}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button type="button" disabled={busy} onClick={() => void handleCreate()}>
                            {busy && <Loader2 className="animate-spin" />}
                            Erstellen &amp; drucken
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
