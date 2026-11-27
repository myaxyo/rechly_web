"use client";

import { buildComplianceReport, type ComplianceInvoiceInput } from "@/lib/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function ComplianceReportCard(props: ComplianceInvoiceInput) {
    const { language } = useLanguage();
    const isDe = language !== "en";
    const report = buildComplianceReport(props);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="size-4 text-primary" />
                    {isDe ? "Compliance-Checkliste" : "Compliance checklist"}
                </CardTitle>
                <Badge variant="outline">{report.score}%</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{report.summary}</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                    {report.checks.map((check) => (
                        <li key={check.id} className="flex items-start justify-between gap-3">
                            <span>
                                {check.label}
                                {check.detail ? (
                                    <span className="mt-0.5 block text-xs text-muted-foreground">{check.detail}</span>
                                ) : null}
                            </span>
                            <span
                                className={cn(
                                    "shrink-0 text-xs font-medium uppercase",
                                    check.severity === "pass" && "text-emerald-600",
                                    check.severity === "warn" && "text-amber-600",
                                    check.severity === "fail" && "text-destructive",
                                )}
                            >
                                {check.severity === "pass" ? (isDe ? "OK" : "OK") : check.severity === "warn" ? (isDe ? "Hinweis" : "Warn") : (isDe ? "Fehlt" : "Fail")}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                    {isDe
                        ? "Keine KoSIT-/veraPDF-Zertifizierung — nur eine Produkt-Checkliste."
                        : "Not a KoSIT/veraPDF certificate — product readiness checklist only."}
                </p>
            </CardContent>
        </Card>
    );
}
