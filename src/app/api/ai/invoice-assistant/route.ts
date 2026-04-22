import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite-server";
import {
    AI_PREFS_KEY,
    assertAndRecordAIUsage,
    generateAIText,
    resolveAISettings,
    sanitizeStoredAISettings,
} from "@/lib/server/ai";

type AssistantAction =
    | "invoice_note"
    | "payment_terms"
    | "payment_reminder"
    | "line_item_description"
    | "overdue_client_reply";

type InvoiceLineItemInput = {
    description: string;
    quantity: number;
    unit_of_measure?: string;
    price: number;
};

type InvoiceAssistantBody = {
    action?: AssistantAction;
    companyName?: string;
    clientName?: string;
    clientEmail?: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
    totalGross?: number;
    currency?: string;
    notes?: string;
    paymentTerms?: string;
    serviceSummary?: string;
    lineItems?: InvoiceLineItemInput[];
    invoices?: Array<{
        invoiceNumber?: string;
        issueDate?: string;
        dueDate?: string;
        totalGross?: number;
        status?: string;
    }>;
};

function buildPrompt(
    body: Required<Pick<InvoiceAssistantBody, "action">> & InvoiceAssistantBody,
): string {
    const amount =
        typeof body.totalGross === "number" && Number.isFinite(body.totalGross)
            ? body.totalGross.toFixed(2)
            : "unbekannt";
    const lineSummary = (body.lineItems || [])
        .map(
            (item) =>
                `- ${item.description}: ${item.quantity} ${item.unit_of_measure || "Einheit"} zu ${item.price.toFixed(2)} EUR`,
        )
        .join("\n");
    const invoiceSummary = (body.invoices || [])
        .map(
            (invoice) =>
                `- ${invoice.invoiceNumber || "Unbekannt"}: fällig ${invoice.dueDate || "Unbekannt"}, Betrag ${typeof invoice.totalGross === "number" ? invoice.totalGross.toFixed(2) : "unbekannt"} ${body.currency || "EUR"}, Status ${invoice.status || "offen"}`,
        )
        .join("\n");

    if (body.action === "line_item_description") {
        return [
            "Schreibe eine professionelle Positionsbeschreibung für eine Rechnung auf Deutsch.",
            "Die Antwort soll direkt einsetzbar sein, ohne Einleitung, ohne Aufzählung, in einem Satz oder kurzen Absatz.",
            `Kurze Leistungszusammenfassung: ${body.serviceSummary || ""}`,
            `Unternehmen: ${body.companyName || "Unbekannt"}`,
            `Kunde: ${body.clientName || "Unbekannt"}`,
            typeof body.totalGross === "number"
                ? `Gesamtangebot bisher: ${body.totalGross.toFixed(2)} ${body.currency || "EUR"}`
                : "",
            "Formuliere die Beschreibung konkret, professionell und abrechnungsfähig.",
        ]
            .filter(Boolean)
            .join("\n\n");
    }

    if (body.action === "invoice_note") {
        return [
            "Schreibe kurze professionelle Rechnungsnotizen auf Deutsch.",
            "Die Antwort soll direkt einsetzbar sein und keine Einleitung enthalten.",
            `Unternehmen: ${body.companyName || "Unbekannt"}`,
            `Kunde: ${body.clientName || "Unbekannt"}`,
            `Rechnungsnummer: ${body.invoiceNumber || "Unbekannt"}`,
            `Rechnungsdatum: ${body.issueDate || "Unbekannt"}`,
            `Fälligkeitsdatum: ${body.dueDate || "Unbekannt"}`,
            `Gesamtbetrag: ${amount} ${body.currency || "EUR"}`,
            lineSummary ? `Positionen:\n${lineSummary}` : "",
            "Erzeuge 3 bis 5 Sätze, freundlich und sachlich.",
        ]
            .filter(Boolean)
            .join("\n\n");
    }

    if (body.action === "payment_terms") {
        return [
            "Formuliere professionelle Zahlungsbedingungen auf Deutsch für eine Rechnung.",
            "Die Antwort soll direkt einsetzbar sein und keine Aufzählung enthalten, außer wenn es klar sinnvoll ist.",
            `Unternehmen: ${body.companyName || "Unbekannt"}`,
            `Kunde: ${body.clientName || "Unbekannt"}`,
            `Rechnungsnummer: ${body.invoiceNumber || "Unbekannt"}`,
            `Rechnungsdatum: ${body.issueDate || "Unbekannt"}`,
            `Fälligkeitsdatum: ${body.dueDate || "Unbekannt"}`,
            `Gesamtbetrag: ${amount} ${body.currency || "EUR"}`,
            body.notes ? `Kontextnotizen: ${body.notes}` : "",
            "Schreibe einen kurzen Absatz mit Zahlungsziel, Verwendungszweck und höflichem Hinweis auf fristgerechte Zahlung.",
        ]
            .filter(Boolean)
            .join("\n\n");
    }

    if (body.action === "overdue_client_reply") {
        return [
            "Entwirf eine professionelle Nachricht auf Deutsch an einen Kunden mit überfälligen Rechnungen.",
            "Struktur: zuerst eine Betreffzeile in der Form 'Betreff: ...', dann eine Leerzeile, dann der Nachrichtentext.",
            `Unternehmen: ${body.companyName || "Unbekannt"}`,
            `Kunde: ${body.clientName || "Unbekannt"}`,
            `Kunden-E-Mail: ${body.clientEmail || "Nicht hinterlegt"}`,
            invoiceSummary ? `Überfällige Rechnungen:\n${invoiceSummary}` : "",
            "Ton: freundlich, bestimmt, professionell. Bitte um kurze Rückmeldung und Zahlungsausgleich. Keine Markdown-Formatierung.",
        ]
            .filter(Boolean)
            .join("\n\n");
    }

    return [
        "Entwirf eine professionelle Zahlungserinnerung auf Deutsch als E-Mail.",
        "Struktur: zuerst eine Betreffzeile in der Form 'Betreff: ...', dann eine Leerzeile, dann der E-Mail-Text.",
        `Unternehmen: ${body.companyName || "Unbekannt"}`,
        `Kunde: ${body.clientName || "Unbekannt"}`,
        `Kunden-E-Mail: ${body.clientEmail || "Nicht hinterlegt"}`,
        `Rechnungsnummer: ${body.invoiceNumber || "Unbekannt"}`,
        `Rechnungsdatum: ${body.issueDate || "Unbekannt"}`,
        `Fälligkeitsdatum: ${body.dueDate || "Unbekannt"}`,
        `Gesamtbetrag: ${amount} ${body.currency || "EUR"}`,
        body.paymentTerms
            ? `Bisherige Zahlungsbedingungen: ${body.paymentTerms}`
            : "",
        body.notes ? `Notizen: ${body.notes}` : "",
        "Ton: freundlich, bestimmt, professionell. Keine rechtliche Drohung und keine Markdown-Formatierung.",
    ]
        .filter(Boolean)
        .join("\n\n");
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as InvoiceAssistantBody;
        if (
            body.action !== "invoice_note" &&
            body.action !== "payment_terms" &&
            body.action !== "payment_reminder" &&
            body.action !== "line_item_description" &&
            body.action !== "overdue_client_reply"
        ) {
            return NextResponse.json(
                { error: "Invalid assistant action" },
                { status: 400 },
            );
        }

        const sessionClient = await createSessionClient();
        const user = await sessionClient.account.get();
        const prefs = (user.prefs || {}) as Record<string, unknown>;
        const account = sessionClient.account;
        const settings = resolveAISettings(
            sanitizeStoredAISettings(prefs[AI_PREFS_KEY]),
        );

        if (!settings) {
            return NextResponse.json(
                {
                    error: "AI settings are incomplete. Save provider, model, and API key first.",
                },
                { status: 400 },
            );
        }

        await assertAndRecordAIUsage({
            account,
            prefs,
            provider: settings.provider,
            model: settings.model,
            action: body.action,
        });

        const response = await generateAIText(
            settings,
            buildPrompt(
                body as Required<Pick<InvoiceAssistantBody, "action">> &
                    InvoiceAssistantBody,
            ),
        );
        return NextResponse.json(response);
    } catch (error) {
        console.error("Error running invoice assistant:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to run invoice assistant",
            },
            { status: 500 },
        );
    }
}
