"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button, Space, message, Spin, Card } from "antd";
import {
    ArrowLeftOutlined,
    DownloadOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFViewer,
    PDFDownloadLink,
} from "@react-pdf/renderer";
import { getInvoiceById } from "@/lib/invoiceService";
import { getCompanyInfo } from "@/lib/companyService";
import { formatCurrency } from "@/lib/currencyUtils";
import { formatDateGerman } from "@/lib/dateUtils";
import type { InvoiceWithDetails, UserCompany, InvoiceItem } from "@/types";

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40,
    },
    companyInfo: {
        maxWidth: "50%",
    },
    companyName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1976d2",
        marginBottom: 4,
    },
    invoiceNumber: {
        fontSize: 12,
        color: "#666",
    },
    addresses: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    addressBlock: {
        width: "45%",
    },
    addressLabel: {
        fontSize: 8,
        color: "#666",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    addressName: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 2,
    },
    addressText: {
        lineHeight: 1.4,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    infoItem: {
        width: "30%",
    },
    infoLabel: {
        fontSize: 8,
        color: "#666",
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 11,
        fontWeight: "bold",
    },
    table: {
        marginTop: 20,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    colDescription: {
        flex: 3,
    },
    colQuantity: {
        flex: 1,
        textAlign: "right",
    },
    colUnit: {
        flex: 1,
    },
    colPrice: {
        flex: 1,
        textAlign: "right",
    },
    colTax: {
        flex: 0.8,
        textAlign: "right",
    },
    colTotal: {
        flex: 1.2,
        textAlign: "right",
    },
    headerText: {
        fontWeight: "bold",
        fontSize: 9,
        color: "#666",
    },
    totals: {
        marginTop: 20,
        alignItems: "flex-end",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        width: 200,
        marginBottom: 4,
    },
    totalLabel: {
        flex: 1,
        textAlign: "right",
        paddingRight: 10,
    },
    totalValue: {
        width: 80,
        textAlign: "right",
    },
    totalFinal: {
        flexDirection: "row",
        justifyContent: "flex-end",
        width: 200,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 2,
        borderTopColor: "#1976d2",
    },
    totalFinalLabel: {
        flex: 1,
        textAlign: "right",
        paddingRight: 10,
        fontWeight: "bold",
        fontSize: 12,
    },
    totalFinalValue: {
        width: 80,
        textAlign: "right",
        fontWeight: "bold",
        fontSize: 12,
        color: "#1976d2",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
    },
    footerDivider: {
        borderTopWidth: 1,
        borderTopColor: "#ddd",
        paddingTop: 10,
    },
    footerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    footerColumn: {
        width: "30%",
    },
    footerLabel: {
        fontSize: 8,
        color: "#666",
        marginBottom: 2,
    },
    footerText: {
        fontSize: 8,
        lineHeight: 1.3,
    },
    notes: {
        marginTop: 30,
        padding: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 4,
    },
    notesLabel: {
        fontSize: 9,
        fontWeight: "bold",
        marginBottom: 4,
    },
    notesText: {
        fontSize: 9,
        lineHeight: 1.4,
    },
    paymentTerms: {
        marginTop: 20,
        fontSize: 9,
        color: "#666",
    },
});

interface InvoicePDFProps {
    invoice: InvoiceWithDetails;
    company: UserCompany | null;
}

const InvoicePDF = ({ invoice, company }: InvoicePDFProps) => {
    const clientAddress = invoice.client
        ? `${invoice.client.address_line1}\n${invoice.client.postal_code} ${invoice.client.city}`
        : "";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>
                            {company?.name || "Firma"}
                        </Text>
                        <Text style={styles.addressText}>
                            {company?.address_line1}
                            {company?.address_line2 &&
                                `\n${company.address_line2}`}
                        </Text>
                        <Text style={styles.addressText}>
                            {company?.postal_code} {company?.city}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.invoiceTitle}>RECHNUNG</Text>
                        <Text style={styles.invoiceNumber}>
                            {invoice.invoice_number}
                        </Text>
                    </View>
                </View>

                {/* Addresses */}
                <View style={styles.addresses}>
                    <View style={styles.addressBlock}>
                        <Text style={styles.addressLabel}>
                            Rechnungsempfänger
                        </Text>
                        <Text style={styles.addressName}>
                            {invoice.client?.name || "Unbekannt"}
                        </Text>
                        <Text style={styles.addressText}>{clientAddress}</Text>
                        {invoice.client?.email && (
                            <Text style={styles.addressText}>
                                {invoice.client.email}
                            </Text>
                        )}
                    </View>
                    <View style={styles.addressBlock}>
                        <Text style={styles.addressLabel}>
                            Rechnungssteller
                        </Text>
                        <Text style={styles.addressName}>{company?.name}</Text>
                        <Text style={styles.addressText}>
                            {company?.address_line1}
                            {"\n"}
                            {company?.postal_code} {company?.city}
                        </Text>
                        {company?.email && (
                            <Text style={styles.addressText}>
                                {company.email}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Invoice Info */}
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Rechnungsdatum</Text>
                        <Text style={styles.infoValue}>
                            {formatDateGerman(invoice.issue_date)}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Fälligkeitsdatum</Text>
                        <Text style={styles.infoValue}>
                            {invoice.due_date
                                ? formatDateGerman(invoice.due_date)
                                : "-"}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Währung</Text>
                        <Text style={styles.infoValue}>EUR</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text
                            style={[styles.colDescription, styles.headerText]}
                        >
                            Beschreibung
                        </Text>
                        <Text style={[styles.colQuantity, styles.headerText]}>
                            Menge
                        </Text>
                        <Text style={[styles.colUnit, styles.headerText]}>
                            Einheit
                        </Text>
                        <Text style={[styles.colPrice, styles.headerText]}>
                            Preis
                        </Text>
                        <Text style={[styles.colTax, styles.headerText]}>
                            MwSt.
                        </Text>
                        <Text style={[styles.colTotal, styles.headerText]}>
                            Gesamt
                        </Text>
                    </View>

                    {/* Rows */}
                    {(invoice.items || []).map(
                        (item: InvoiceItem, index: number) => (
                            <View
                                key={item.id || index}
                                style={styles.tableRow}
                            >
                                <Text style={styles.colDescription}>
                                    {item.description}
                                </Text>
                                <Text style={styles.colQuantity}>
                                    {item.quantity}
                                </Text>
                                <Text style={styles.colUnit}>
                                    {item.unit_of_measure}
                                </Text>
                                <Text style={styles.colPrice}>
                                    {formatCurrency(item.price)}
                                </Text>
                                <Text style={styles.colTax}>
                                    {item.tax_rate_percent}%
                                </Text>
                                <Text style={styles.colTotal}>
                                    {formatCurrency(item.total)}
                                </Text>
                            </View>
                        )
                    )}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Zwischensumme:</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency(invoice.subtotal)}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>MwSt.:</Text>
                        <Text style={styles.totalValue}>
                            {formatCurrency(invoice.total_vat)}
                        </Text>
                    </View>
                    <View style={styles.totalFinal}>
                        <Text style={styles.totalFinalLabel}>
                            Gesamtbetrag:
                        </Text>
                        <Text style={styles.totalFinalValue}>
                            {formatCurrency(invoice.total_gross)}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {invoice.notes && (
                    <View style={styles.notes}>
                        <Text style={styles.notesLabel}>Hinweise:</Text>
                        <Text style={styles.notesText}>{invoice.notes}</Text>
                    </View>
                )}

                {/* Payment Terms */}
                {company?.payment_terms_default && (
                    <View style={styles.paymentTerms}>
                        <Text>{company.payment_terms_default}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerDivider}>
                        <View style={styles.footerContent}>
                            <View style={styles.footerColumn}>
                                <Text style={styles.footerLabel}>Kontakt</Text>
                                <Text style={styles.footerText}>
                                    {company?.email}
                                    {company?.phone && `\n${company.phone}`}
                                    {company?.website && `\n${company.website}`}
                                </Text>
                            </View>
                            <View style={styles.footerColumn}>
                                <Text style={styles.footerLabel}>
                                    Bankverbindung
                                </Text>
                                <Text style={styles.footerText}>
                                    {company?.bank_name}
                                    {company?.bank_iban &&
                                        `\nIBAN: ${company.bank_iban}`}
                                    {company?.bank_bic &&
                                        `\nBIC: ${company.bank_bic}`}
                                </Text>
                            </View>
                            <View style={styles.footerColumn}>
                                <Text style={styles.footerLabel}>Steuer</Text>
                                <Text style={styles.footerText}>
                                    {company?.vat_id &&
                                        `USt-IdNr.: ${company.vat_id}`}
                                    {company?.tax_number &&
                                        `\nSt.-Nr.: ${company.tax_number}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default function InvoicePDFPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const invoiceId = params.id as string;
    const shouldPrint = searchParams.get("print") === "true";

    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
    const [company, setCompany] = useState<UserCompany | null>(null);

    useEffect(() => {
        if (invoiceId) {
            loadData();
        }
    }, [invoiceId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [invoiceData, companyData] = await Promise.all([
                getInvoiceById(invoiceId),
                getCompanyInfo(),
            ]);
            setInvoice(invoiceData);
            setCompany(companyData);
        } catch (error) {
            console.error("Error loading data:", error);
            message.error("Fehler beim Laden der Rechnung");
            router.push("/dashboard/invoices");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    useEffect(() => {
        if (!loading && invoice && shouldPrint) {
            // Delay to ensure PDF is rendered
            setTimeout(handlePrint, 1000);
        }
    }, [loading, invoice, shouldPrint, handlePrint]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 50 }}>
                <Spin size="large" />
                <p>PDF wird geladen...</p>
            </div>
        );
    }

    if (!invoice) {
        return null;
    }

    return (
        <div>
            {/* Toolbar - hidden when printing */}
            <Card
                style={{ marginBottom: 16 }}
                className="no-print"
                styles={{ body: { padding: "12px 24px" } }}
            >
                <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                >
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() =>
                                router.push(`/dashboard/invoices/${invoiceId}`)
                            }
                        >
                            Zurück
                        </Button>
                        <span style={{ fontWeight: 500 }}>
                            PDF: {invoice.invoice_number}
                        </span>
                    </Space>
                    <Space>
                        <Button
                            icon={<PrinterOutlined />}
                            onClick={handlePrint}
                        >
                            Drucken
                        </Button>
                        <PDFDownloadLink
                            document={
                                <InvoicePDF
                                    invoice={invoice}
                                    company={company}
                                />
                            }
                            fileName={`Rechnung_${invoice.invoice_number}.pdf`}
                        >
                            {({ loading: pdfLoading }) => (
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    loading={pdfLoading}
                                >
                                    PDF herunterladen
                                </Button>
                            )}
                        </PDFDownloadLink>
                    </Space>
                </Space>
            </Card>

            {/* PDF Viewer */}
            <div style={{ height: "calc(100vh - 200px)", minHeight: 600 }}>
                <PDFViewer width="100%" height="100%" showToolbar={false}>
                    <InvoicePDF invoice={invoice} company={company} />
                </PDFViewer>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .ant-layout-sider,
                    .ant-layout-header {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
