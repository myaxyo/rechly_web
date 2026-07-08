/**
 * ZUGFeRD 2.x / Factur-X EN 16931 PDF generation with embedded XML
 * Uses pdfkit for PDF generation and embeds the CII XML as a file attachment.
 */

import PDFDocument from "pdfkit";
import type { InvoiceWithDetails, UserCompany } from "@/types";
import {
    generateXRechnungXML,
    validateXRechnung,
} from "./xrechnung";

function formatAmount(n: number): string {
    return new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}.${m}.${y}`;
}

/**
 * Generate a ZUGFeRD-compatible PDF with embedded Factur-X XML.
 * Returns a Buffer containing the PDF bytes.
 */
export async function generateZUGFeRDPDF(
    invoice: InvoiceWithDetails,
    company: UserCompany,
): Promise<Buffer> {
    const errors = validateXRechnung(invoice, company);
    if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join("; ")}`);
    }

    const xml = generateXRechnungXML(invoice, company);
    const xmlBuffer = Buffer.from(xml, "utf-8");

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
            autoFirstPage: true,
            size: "A4",
            margins: { top: 50, bottom: 50, left: 60, right: 60 },
        });

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const client = invoice.client!;
        const pageWidth = doc.page.width - 120; // margins

        // Header
        doc.fontSize(20).font("Helvetica-Bold").text(company.name, 60, 50);
        doc.fontSize(9).font("Helvetica").fillColor("#666666");
        const companyLine = [
            company.address_line1,
            company.postal_code,
            company.city,
            company.country || "Deutschland",
        ]
            .filter(Boolean)
            .join(", ");
        doc.text(companyLine, 60, 75);
        if (company.email) doc.text(company.email, 60, 90);
        if (company.vat_id) doc.text(`USt-IdNr.: ${company.vat_id}`, 60, 105);
        else if (company.tax_number)
            doc.text(`Steuernummer: ${company.tax_number}`, 60, 105);

        // Invoice label
        doc.fillColor("#000000").fontSize(16).font("Helvetica-Bold");
        const title =
            invoice.correction_type === "credit_note"
                ? "GUTSCHRIFT"
                : invoice.correction_type === "correction"
                  ? "KORREKTURRECHNUNG"
                  : "RECHNUNG";
        doc.text(title, 60, 150);

        // Billing info columns
        doc.fontSize(9).font("Helvetica");

        // Left: recipient
        doc.fillColor("#666666").text("An:", 60, 190);
        doc.fillColor("#000000")
            .font("Helvetica-Bold")
            .text(client.name, 60, 205);
        doc.font("Helvetica");
        if (client.address_line1) doc.text(client.address_line1, 60, 220);
        if (client.address_line2) doc.text(client.address_line2, 60, 235);
        const clientCity =
            `${client.postal_code || ""} ${client.city || ""}`.trim();
        doc.text(clientCity, 60, client.address_line2 ? 250 : 235);
        doc.text(
            client.country || "Deutschland",
            60,
            client.address_line2 ? 265 : 250,
        );

        // Right: invoice details
        const rightX = 380;
        let rightY = 190;
        const addDetail = (label: string, value: string) => {
            doc.fillColor("#666666").text(label, rightX, rightY);
            doc.fillColor("#000000").text(value, rightX + 120, rightY);
            rightY += 15;
        };
        addDetail("Rechnungsnummer:", invoice.invoice_number);
        addDetail("Datum:", formatDate(invoice.issue_date));
        if (invoice.due_date)
            addDetail("Fällig:", formatDate(invoice.due_date));
        if (client.leitweg_id) addDetail("Leitweg-ID:", client.leitweg_id);

        // Line items table
        const tableY = 320;
        const colPositions = {
            desc: 60,
            qty: 310,
            price: 380,
            vat: 450,
            total: 490,
        };

        // Table header
        doc.fillColor("#f0f0f0")
            .rect(60, tableY - 5, pageWidth, 20)
            .fill();
        doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);
        doc.text("Beschreibung", colPositions.desc, tableY);
        doc.text("Menge", colPositions.qty, tableY, {
            align: "right",
            width: 60,
        });
        doc.text("Einzelpreis", colPositions.price, tableY, {
            align: "right",
            width: 60,
        });
        doc.text("MwSt.", colPositions.vat, tableY, {
            align: "right",
            width: 40,
        });
        doc.text("Gesamt", colPositions.total, tableY, {
            align: "right",
            width: 60,
        });

        let itemY = tableY + 25;
        doc.font("Helvetica").fontSize(9);

        for (const item of invoice.items) {
            const lineNet =
                item.quantity *
                item.price *
                (1 - (item.discount_percent || 0) / 100);
            const lineGross = lineNet * (1 + item.tax_rate_percent / 100);

            if (itemY > 700) {
                doc.addPage();
                itemY = 60;
            }

            doc.fillColor("#000000").text(
                item.description,
                colPositions.desc,
                itemY,
                { width: 240 },
            );
            const descHeight = doc.heightOfString(item.description, {
                width: 240,
            });
            doc.text(
                `${item.quantity} ${item.unit_of_measure}`,
                colPositions.qty,
                itemY,
                { align: "right", width: 60 },
            );
            doc.text(
                `€ ${formatAmount(item.price)}`,
                colPositions.price,
                itemY,
                { align: "right", width: 60 },
            );
            doc.text(`${item.tax_rate_percent}%`, colPositions.vat, itemY, {
                align: "right",
                width: 40,
            });
            doc.text(
                `€ ${formatAmount(lineGross)}`,
                colPositions.total,
                itemY,
                { align: "right", width: 60 },
            );

            itemY += Math.max(descHeight, 18) + 4;

            // Divider line
            doc.fillColor("#e0e0e0")
                .rect(60, itemY - 2, pageWidth, 1)
                .fill();
        }

        // Totals
        const totalsX = 380;
        let totalsY = itemY + 15;

        doc.fillColor("#000000").font("Helvetica").fontSize(9);
        doc.text("Nettobetrag:", totalsX, totalsY);
        doc.text(
            `€ ${formatAmount(invoice.subtotal)}`,
            totalsX + 120,
            totalsY,
            { align: "right", width: 55 },
        );
        totalsY += 15;
        doc.text("MwSt. gesamt:", totalsX, totalsY);
        doc.text(
            `€ ${formatAmount(invoice.total_vat)}`,
            totalsX + 120,
            totalsY,
            { align: "right", width: 55 },
        );
        totalsY += 5;
        doc.fillColor("#e0e0e0").rect(totalsX, totalsY, 175, 1).fill();
        totalsY += 8;
        doc.fillColor("#000000").font("Helvetica-Bold").fontSize(12);
        doc.text("Gesamtbetrag:", totalsX, totalsY);
        doc.text(
            `€ ${formatAmount(invoice.total_gross)}`,
            totalsX + 110,
            totalsY,
            { align: "right", width: 65 },
        );

        // Notes
        if (invoice.notes) {
            totalsY += 40;
            doc.font("Helvetica-Bold")
                .fontSize(9)
                .text("Notizen:", 60, totalsY);
            doc.font("Helvetica").text(invoice.notes, 60, totalsY + 15, {
                width: pageWidth,
            });
        }

        // Footer: Factur-X XMP metadata (prepared for future PDF/A XMP embedding)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const xmpMetadata = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

        // Embed XML as file attachment
        (
            doc as unknown as {
                file: (buf: Buffer, opts: Record<string, unknown>) => void;
            }
        ).file(xmlBuffer, {
            name: "factur-x.xml",
            description: "Factur-X/ZUGFeRD Invoice Data",
            creationDate: new Date(),
            modifiedDate: new Date(),
            AFRelationship: "Alternative",
        });

        doc.end();
    });
}
