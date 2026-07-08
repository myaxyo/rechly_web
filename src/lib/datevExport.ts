/**
 * DATEV Buchungsstapel ASCII v9.0 export
 * Generates CSV for DATEV import (Buchungsstapel)
 */

import type { InvoiceWithClient } from "@/types";

type ChartOfAccounts = "SKR03" | "SKR04";

/**
 * Revenue accounts by VAT rate for SKR03 and SKR04
 */
function getRevenueAccount(vatRate: number, coa: ChartOfAccounts): string {
    if (coa === "SKR04") {
        if (vatRate === 19) return "4400";
        if (vatRate === 7) return "4300";
        return "4120"; // 0% / tax-free
    }
    // SKR03
    if (vatRate === 19) return "8400";
    if (vatRate === 7) return "8300";
    return "8120"; // 0%
}

/**
 * Receivables account (Forderungen aus Lieferungen und Leistungen)
 */
function getReceivablesAccount(coa: ChartOfAccounts): string {
    return coa === "SKR04" ? "1200" : "1400";
}

function formatDATEVDate(dateStr: string): string {
    // DATEV expects DDMM format for dates in header, DDMMYYYY for entries
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}${m}${y}`;
}

function formatDATEVShortDate(dateStr: string): string {
    if (!dateStr) return "";
    const [, m, d] = dateStr.split("-");
    return `${d}${m}`;
}

function sanitizeField(val: string | undefined | null): string {
    if (!val) return "";
    // Remove semicolons and double quotes to prevent CSV injection
    return val.replace(/[;"]/g, " ").replace(/\n/g, " ").trim();
}

export interface DATEVExportOptions {
    chartOfAccounts: ChartOfAccounts;
    consultantNumber?: string;
    clientNumber?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
}

/**
 * Generate DATEV Buchungsstapel CSV (ASCII v9.0 compatible)
 */
export function generateDATEVCSV(
    invoices: InvoiceWithClient[],
    options: DATEVExportOptions,
): string {
    const {
        chartOfAccounts,
        consultantNumber = "00000",
        clientNumber = "00000",
        startDate,
        endDate,
    } = options;

    const fromDate = formatDATEVShortDate(startDate); // DDMM
    const toDate = formatDATEVShortDate(endDate);
    const fromDateFull = formatDATEVDate(startDate);

    // DATEV Header line (fixed format)
    const header = [
        '"EXTF"', // Kennzeichen
        "700", // Versionsnummer
        "21", // Datenkategorie (21 = Buchungsstapel)
        '"Buchungsstapel"', // Formatname
        "9", // Formatversion
        new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14), // Erzeugungsdatum
        "", // Importiert
        "", // Herkunft
        "", // Exportiert von
        "", // Importiert von
        consultantNumber, // Beraternummer
        clientNumber, // Mandantennummer
        fromDateFull, // Wirtschaftsjahr Beginn
        "4", // Sachkontenlänge
        fromDate, // Datum von
        toDate, // Datum bis
        '"Rechly Export"', // Bezeichnung
        "", // Diktatzeichen
        "1", // Buchungstyp (1 = Finanzbuchführung)
        "0", // Rechnungslegungszweck
        "0", // Festschreibung
        "EUR", // WKZ
        "", // reserved
        "", // Derivatskennzeichen
        "", // reserved
        "", // reserved
        "", // Sachkontonummernlänge
        "", // Adressnummernlänge
        "", // reserved
        "", // reserved
        "", // reserved
    ].join(";");

    // Column headers (DATEV Buchungsstapel fields)
    const colHeaders = [
        "Umsatz (ohne Soll/Haben-Kz)",
        "Soll/Haben-Kennzeichen",
        "WKZ Umsatz",
        "Kurs",
        "Basis-Umsatz",
        "WKZ Basis-Umsatz",
        "Konto",
        "Gegenkonto (ohne BU-Schlüssel)",
        "BU-Schlüssel",
        "Belegdatum",
        "Belegfeld 1",
        "Belegfeld 2",
        "Skonto",
        "Buchungstext",
        "Postensperre",
        "Diverse Adressnummer",
        "Geschäftspartnerbank",
        "Sachverhalt",
        "Zinssperre",
        "Beleglink",
        "Beleginfo - Art 1",
        "Beleginfo - Inhalt 1",
        "Beleginfo - Art 2",
        "Beleginfo - Inhalt 2",
        "Beleginfo - Art 3",
        "Beleginfo - Inhalt 3",
        "Beleginfo - Art 4",
        "Beleginfo - Inhalt 4",
        "Beleginfo - Art 5",
        "Beleginfo - Inhalt 5",
        "Beleginfo - Art 6",
        "Beleginfo - Inhalt 6",
        "Beleginfo - Art 7",
        "Beleginfo - Inhalt 7",
        "Beleginfo - Art 8",
        "Beleginfo - Inhalt 8",
        "KOST1 - Kostenstelle",
        "KOST2 - Kostenstelle",
        "Kost-Menge",
        "EU-Land u. UmsatzsteuerID",
        "EU-Steuersatz",
        "Abw. Versteuerungsart",
        "Sachkontonummernlänge",
        "Zählweise",
        "Mehrwertsteuerkennung",
        "Mahnsperre",
        "Lastschriftsperre",
        "Zahlungssperre",
        "Verarbeitungskennzeichen",
    ].join(";");

    const rows: string[] = [];

    for (const invoice of invoices) {
        if (!invoice.total_gross) continue;

        // Collect unique VAT rates from invoice — we need per-rate breakdown
        // Since we only have totals here, we create one combined entry
        // For full breakdown, the API would need to pass items too
        const dateShort = formatDATEVShortDate(invoice.issue_date); // DDMM
        const receivables = getReceivablesAccount(chartOfAccounts);

        // Determine predominant VAT rate (use total_vat / subtotal ratio)
        const effectiveRate =
            invoice.subtotal > 0
                ? Math.round((invoice.total_vat / invoice.subtotal) * 100)
                : 19;
        const revenueAccount = getRevenueAccount(
            effectiveRate,
            chartOfAccounts,
        );

        // Gross amount posting: Debit receivables, Credit revenue
        const amountStr = invoice.total_gross.toFixed(2).replace(".", ",");
        const invoiceNumber = sanitizeField(invoice.invoice_number);
        const clientName = sanitizeField(invoice.client?.name);

        const row = [
            amountStr, // Umsatz
            "S", // Soll (Debit)
            "EUR", // WKZ
            "", // Kurs
            "", // Basis-Umsatz
            "", // WKZ Basis
            receivables, // Konto (Forderungen)
            revenueAccount, // Gegenkonto (Erlöse)
            "", // BU-Schlüssel
            dateShort, // Belegdatum DDMM
            `"${invoiceNumber}"`, // Belegfeld 1
            "", // Belegfeld 2
            "", // Skonto
            `"${clientName}"`, // Buchungstext
        ].join(";");

        rows.push(row);
    }

    return `${header}\n${colHeaders}\n${rows.join("\n")}`;
}
