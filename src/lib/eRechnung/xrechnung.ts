/**
 * XRechnung 3.0 / EN 16931 XML generation (UN/CEFACT CII D16B)
 */

import type { InvoiceWithDetails, UserCompany } from "@/types";

export function escapeXml(str: string): string {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Validate whether the invoice + company data is ready for XRechnung export.
 * Returns array of error strings (empty = valid).
 */
export function validateXRechnung(
    invoice: InvoiceWithDetails,
    company: UserCompany,
): string[] {
    const errors: string[] = [];

    // Company checks
    if (!company.name) errors.push("Firmenname fehlt");
    if (!company.address_line1) errors.push("Firmenadresse fehlt");
    if (!company.postal_code) errors.push("Postleitzahl der Firma fehlt");
    if (!company.city) errors.push("Stadt der Firma fehlt");
    if (!company.vat_id && !company.tax_number) {
        errors.push("USt-IdNr. oder Steuernummer der Firma fehlt");
    }

    // Client checks
    if (!invoice.client) {
        errors.push("Kundendaten fehlen");
    } else {
        if (!invoice.client.name) errors.push("Kundenname fehlt");
        if (!invoice.client.address_line1) errors.push("Kundenadresse fehlt");
        if (!invoice.client.postal_code)
            errors.push("Postleitzahl des Kunden fehlt");
        if (!invoice.client.city) errors.push("Stadt des Kunden fehlt");
    }

    // Invoice checks
    if (!invoice.invoice_number) errors.push("Rechnungsnummer fehlt");
    if (!invoice.issue_date) errors.push("Rechnungsdatum fehlt");
    if (!invoice.items || invoice.items.length === 0)
        errors.push("Keine Positionen vorhanden");

    // Leitweg-ID for B2G (optional but recommended)
    // Format: digits-digits-2digits e.g. 991-12345-03
    if (invoice.client?.leitweg_id) {
        const leitwegPattern = /^\d+-\d+-\d{2}$/;
        if (!leitwegPattern.test(invoice.client.leitweg_id)) {
            errors.push(
                "Leitweg-ID hat ein ungültiges Format (erwartet: Z.B. 991-12345-03)",
            );
        }
    }

    return errors;
}

/**
 * Generate XRechnung 3.0 (CII / Cross Industry Invoice) XML string.
 */
export function generateXRechnungXML(
    invoice: InvoiceWithDetails,
    company: UserCompany,
): string {
    const client = invoice.client!;
    const issueDate = invoice.issue_date.replace(/-/g, "");
    const dueDate = invoice.due_date?.replace(/-/g, "") ?? "";

    const sellerVatId = company.vat_id || "";
    const sellerTaxNum = company.tax_number || "";

    // Build line items
    const lineItems = invoice.items
        .map((item, index) => {
            const lineNet =
                item.quantity *
                item.price *
                (1 - (item.discount_percent || 0) / 100);
            const vatRate = item.tax_rate_percent;
            const vatCode = vatRate === 0 ? "E" : "S";

            return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${item.price.toFixed(4)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${escapeXml(item.unit_of_measure || "C62")}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${vatCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${vatRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${lineNet.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
        })
        .join("\n");

    // Collect unique VAT rates for tax breakdown
    const vatBreakdown = new Map<number, { net: number; vat: number }>();
    for (const item of invoice.items) {
        const net =
            item.quantity *
            item.price *
            (1 - (item.discount_percent || 0) / 100);
        const vatAmt = (net * item.tax_rate_percent) / 100;
        const existing = vatBreakdown.get(item.tax_rate_percent) || {
            net: 0,
            vat: 0,
        };
        vatBreakdown.set(item.tax_rate_percent, {
            net: existing.net + net,
            vat: existing.vat + vatAmt,
        });
    }

    const taxEntries = Array.from(vatBreakdown.entries())
        .map(([rate, amounts]) => {
            const vatCode = rate === 0 ? "E" : "S";
            return `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${amounts.vat.toFixed(2)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${amounts.net.toFixed(2)}</ram:BasisAmount>
      <ram:CategoryCode>${vatCode}</ram:CategoryCode>
      <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`;
        })
        .join("\n");

    const buyerReference = client.leitweg_id
        ? `<ram:BuyerReference>${escapeXml(client.leitweg_id)}</ram:BuyerReference>`
        : "<ram:BuyerReference>XRECHNUNG</ram:BuyerReference>";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoice.invoice_number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    ${lineItems}

    <ram:ApplicableHeaderTradeAgreement>
      ${buyerReference}

      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(company.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(company.postal_code || "")}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(company.address_line1 || "")}</ram:LineOne>
          <ram:CityName>${escapeXml(company.city || "")}</ram:CityName>
          <ram:CountryID>${escapeXml(company.country || "DE")}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${company.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${escapeXml(company.email)}</ram:URIID></ram:URIUniversalCommunication>` : ""}
        <ram:SpecifiedTaxRegistration>
          ${sellerVatId ? `<ram:ID schemeID="VA">${escapeXml(sellerVatId)}</ram:ID>` : ""}
          ${!sellerVatId && sellerTaxNum ? `<ram:ID schemeID="FC">${escapeXml(sellerTaxNum)}</ram:ID>` : ""}
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(client.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(client.postal_code || "")}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(client.address_line1 || "")}</ram:LineOne>
          <ram:CityName>${escapeXml(client.city || "")}</ram:CityName>
          <ram:CountryID>${escapeXml(client.country || "DE")}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${client.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${escapeXml(client.email)}</ram:URIID></ram:URIUniversalCommunication>` : ""}
        ${client.vat_id ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(client.vat_id)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery />

    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${escapeXml(invoice.invoice_number)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${dueDate ? `<ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">${dueDate}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>` : ""}
      ${taxEntries}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${invoice.subtotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${invoice.subtotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${invoice.total_vat.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${invoice.total_gross.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${invoice.total_gross.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

    return xml;
}
