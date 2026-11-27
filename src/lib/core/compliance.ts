/** Lightweight compliance checklist for invoice readiness (not a KoSIT certificate). */

export type ComplianceSeverity = "pass" | "warn" | "fail";

export interface ComplianceCheck {
  id: string;
  label: string;
  severity: ComplianceSeverity;
  detail?: string;
}

export interface ComplianceInvoiceInput {
  invoiceNumber?: string | null;
  issueDate?: string | null;
  sellerName?: string | null;
  sellerAddress?: string | null;
  buyerName?: string | null;
  buyerAddress?: string | null;
  /** Seller tax id or VAT id present */
  sellerTaxId?: string | null;
  sellerVatId?: string | null;
  iban?: string | null;
  currency?: string | null;
  totalGross?: number | null;
  lineCount?: number | null;
  isSmallBusiness?: boolean;
  hasServicePeriod?: boolean;
  hasBuyerLeitwegOrVat?: boolean;
}

export interface ComplianceReport {
  score: number;
  checks: ComplianceCheck[];
  summary: string;
}

function present(value: string | null | undefined): boolean {
  return Boolean(value && String(value).trim());
}

/** Build a human-readable readiness report for UI surfaces on web and desktop. */
export function buildComplianceReport(input: ComplianceInvoiceInput): ComplianceReport {
  const checks: ComplianceCheck[] = [];

  checks.push({
    id: "number",
    label: "Rechnungsnummer",
    severity: present(input.invoiceNumber) ? "pass" : "fail",
    detail: present(input.invoiceNumber) ? undefined : "Fehlt — für GoBD/XRechnung erforderlich.",
  });
  checks.push({
    id: "date",
    label: "Rechnungsdatum",
    severity: present(input.issueDate) ? "pass" : "fail",
  });
  checks.push({
    id: "seller",
    label: "Verkäufer (Name)",
    severity: present(input.sellerName) ? "pass" : "fail",
  });
  checks.push({
    id: "seller-address",
    label: "Verkäuferadresse",
    severity: present(input.sellerAddress) ? "pass" : "warn",
  });
  checks.push({
    id: "buyer",
    label: "Kunde (Name)",
    severity: present(input.buyerName) ? "pass" : "fail",
  });
  checks.push({
    id: "buyer-address",
    label: "Kundenadresse",
    severity: present(input.buyerAddress) ? "pass" : "warn",
  });

  const taxOk = present(input.sellerVatId) || present(input.sellerTaxId);
  checks.push({
    id: "tax",
    label: "Steuerkennzeichen (USt-IdNr. oder Steuernummer)",
    severity: taxOk ? "pass" : input.isSmallBusiness ? "warn" : "fail",
    detail: taxOk ? undefined : "Für B2B-E-Rechnung und Pflichtangaben empfohlen.",
  });

  checks.push({
    id: "lines",
    label: "Positionen",
    severity: (input.lineCount ?? 0) > 0 ? "pass" : "fail",
  });

  const gross = input.totalGross;
  checks.push({
    id: "total",
    label: "Bruttobetrag",
    severity: Number.isFinite(gross) && (gross as number) > 0 ? "pass" : "warn",
  });

  checks.push({
    id: "currency",
    label: "Währung EUR",
    severity: !input.currency || input.currency === "EUR" ? "pass" : "warn",
  });

  checks.push({
    id: "iban",
    label: "IBAN (Zahlungs-QR / Überweisung)",
    severity: present(input.iban) ? "pass" : "warn",
    detail: present(input.iban) ? undefined : "Optional — für GiroCode erforderlich.",
  });

  checks.push({
    id: "service-period",
    label: "Leistungszeitraum",
    severity: input.hasServicePeriod ? "pass" : "warn",
  });

  checks.push({
    id: "buyer-id",
    label: "Käufer-Kennung (Leitweg-ID / USt-IdNr.)",
    severity: input.hasBuyerLeitwegOrVat ? "pass" : "warn",
    detail: "Für XRechnung an öffentliche Auftraggeber oft Pflicht (BT-10).",
  });

  const fails = checks.filter((c) => c.severity === "fail").length;
  const warns = checks.filter((c) => c.severity === "warn").length;
  const passes = checks.filter((c) => c.severity === "pass").length;
  const score = Math.round((passes / checks.length) * 100);

  let summary: string;
  if (fails > 0) summary = `${fails} Pflichtpunkt(e) offen — Export prüfen.`;
  else if (warns > 0) summary = `Bereit mit ${warns} Hinweis(en).`;
  else summary = "Checkliste erfüllt (kein Ersatz für KoSIT/veraPDF).";

  return { score, checks, summary };
}
