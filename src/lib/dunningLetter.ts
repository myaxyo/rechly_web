import QRCode from "qrcode";
import { buildGirocodePayload } from "@/lib/girocode";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { InvoiceWithDetails, UserCompany } from "@/types";

/**
 * Mahnung letter HTML for browser printing (window.print).
 * Content kept in sync with the mobile letter (lib/pdfTemplates.ts).
 */

export interface DunningNoticeData {
    level: number;
    notice_number: string;
    issue_date: string;
    fee: number;
    days_overdue: number;
    notes?: string;
}

const TITLES: Record<number, string> = {
    1: "Zahlungserinnerung",
    2: "1. Mahnung",
    3: "2. Mahnung",
};

const BODIES: Record<number, string> = {
    1: "sicherlich ist es Ihrer Aufmerksamkeit entgangen, dass die unten aufgeführte Rechnung noch offen ist. Wir bitten Sie, den Betrag innerhalb von 14 Tagen zu begleichen. Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.",
    2: "trotz unserer Zahlungserinnerung konnten wir bislang keinen Zahlungseingang zur unten aufgeführten Rechnung feststellen. Wir fordern Sie hiermit auf, den offenen Betrag zuzüglich Mahngebühr innerhalb von 10 Tagen zu begleichen.",
    3: "leider ist die unten aufgeführte Rechnung trotz mehrfacher Aufforderung weiterhin offen. Wir fordern Sie letztmalig auf, den Gesamtbetrag innerhalb von 7 Tagen zu begleichen. Nach Ablauf dieser Frist behalten wir uns rechtliche Schritte sowie die Berechnung von Verzugszinsen gemäß §288 BGB vor.",
};

export const generateDunningLetterHTML = async (
    company: UserCompany,
    invoice: InvoiceWithDetails,
    notice: DunningNoticeData
): Promise<string> => {
    const client = invoice.client;
    const title = TITLES[notice.level] ?? TITLES[1];
    const body = BODIES[notice.level] ?? BODIES[1];
    const total = invoice.total_gross + (notice.fee || 0);

    let qrImg = "";
    const payload = buildGirocodePayload({
        name: company.name,
        iban: company.bank_iban,
        bic: company.bank_bic,
        amount: total,
        reference: `${title} ${invoice.invoice_number}`,
    });
    if (payload) {
        try {
            const url = await QRCode.toDataURL(payload, {
                errorCorrectionLevel: "M",
                margin: 1,
                width: 176,
            });
            qrImg = `<img src="${url}" alt="Girocode" width="88" height="88" />`;
        } catch {
            qrImg = "";
        }
    }

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title} ${notice.notice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #1a1a1a; padding: 48px 56px; line-height: 1.5; }
    .sender { font-size: 9px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 8px; }
    .recipient { margin-bottom: 32px; }
    .meta { text-align: right; color: #444; margin-bottom: 24px; }
    h1 { font-size: 19px; margin-bottom: 16px; }
    p { margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
    td.amount, th.amount { text-align: right; }
    tr.total td { font-weight: bold; border-top: 2px solid #1a1a1a; border-bottom: none; }
    .bank { margin-top: 24px; font-size: 11px; color: #444; }
    .qr { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
    .qr div { font-size: 9px; color: #555; max-width: 240px; }
    @media print { body { padding: 24px 32px; } }
  </style>
</head>
<body>
  <div class="sender">${company.name} · ${company.address_line1} · ${company.postal_code} ${company.city}</div>
  <div class="recipient">
    <div><strong>${client?.name ?? ""}</strong></div>
    ${client?.contact_person ? `<div>${client.contact_person}</div>` : ""}
    <div>${client?.address_line1 ?? ""}</div>
    ${client?.address_line2 ? `<div>${client.address_line2}</div>` : ""}
    <div>${client?.postal_code ?? ""} ${client?.city ?? ""}</div>
  </div>
  <div class="meta">
    <div>Mahnungsnummer: ${notice.notice_number}</div>
    <div>Datum: ${formatDateGerman(notice.issue_date)}</div>
  </div>

  <h1>${title}</h1>
  <p>Sehr geehrte Damen und Herren,</p>
  <p>${body}</p>

  <table>
    <tr>
      <th>Rechnung</th><th>Rechnungsdatum</th><th>Fällig seit</th>
      <th class="amount">Betrag</th>
    </tr>
    <tr>
      <td>${invoice.invoice_number}</td>
      <td>${formatDateGerman(invoice.issue_date)}</td>
      <td>${invoice.due_date ? formatDateGerman(invoice.due_date) : "–"} (${notice.days_overdue} Tage)</td>
      <td class="amount">${formatCurrency(invoice.total_gross, "de")}</td>
    </tr>
    ${
        notice.fee > 0
            ? `<tr><td colspan="3">Mahngebühr</td><td class="amount">${formatCurrency(notice.fee, "de")}</td></tr>`
            : ""
    }
    <tr class="total">
      <td colspan="3">Offener Gesamtbetrag</td>
      <td class="amount">${formatCurrency(total, "de")}</td>
    </tr>
  </table>

  ${notice.notes ? `<p>${notice.notes}</p>` : ""}

  <p>Mit freundlichen Grüßen<br>${company.name}</p>

  <div class="bank">
    <strong>Bankverbindung:</strong>${company.bank_name ? ` ${company.bank_name} ·` : ""}
    IBAN: ${company.bank_iban}${company.bank_bic ? ` · BIC: ${company.bank_bic}` : ""}
  </div>
  ${
      qrImg
          ? `<div class="qr">${qrImg}<div><strong>Bequem bezahlen mit Girocode</strong><br>QR-Code mit Ihrer Banking-App scannen – Empfänger, Betrag und Verwendungszweck werden automatisch übernommen.</div></div>`
          : ""
  }
</body>
</html>`;
};
