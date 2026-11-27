"use client";

import { toast } from "sonner";
import {
    downloadEInvoiceFile,
    EInvoiceDownloadError,
    type EInvoiceFormat,
} from "@/lib/eRechnung/downloadClient";
import { Button } from "@/components/ui/button";

interface DownloadWithFeedbackOptions {
    invoiceId: string;
    invoiceNumber?: string;
    format: EInvoiceFormat;
    t: (key: string) => string;
    onNavigate?: (path: string) => void;
}

export async function downloadInvoiceWithFeedback({
    invoiceId,
    invoiceNumber,
    format,
    t,
    onNavigate,
}: DownloadWithFeedbackOptions): Promise<void> {
    try {
        await downloadEInvoiceFile(invoiceId, format, invoiceNumber);
    } catch (error) {
        if (
            error instanceof EInvoiceDownloadError &&
            error.status === 422 &&
            error.errors.length > 0
        ) {
            const id = toast.warning(t("erechnung.validationModalTitle"), {
                duration: Infinity,
                description: (
                    <div className="flex flex-col gap-2">
                        <p>{t("erechnung.validationModalHint")}</p>
                        <ul className="list-disc pl-5">
                            {error.errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                        {onNavigate && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        toast.dismiss(id);
                                        onNavigate("/dashboard/settings");
                                    }}
                                >
                                    {t("erechnung.fixSettings")}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        toast.dismiss(id);
                                        onNavigate("/dashboard/clients");
                                    }}
                                >
                                    {t("erechnung.fixClient")}
                                </Button>
                            </div>
                        )}
                    </div>
                ),
            });
            return;
        }

        toast.error(
            error instanceof Error && error.message
                ? error.message
                : t("erechnung.downloadError"),
        );
    }
}
