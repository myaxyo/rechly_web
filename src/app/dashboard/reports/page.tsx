"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Card,
    Col,
    Row,
    Segmented,
    Select,
    Spin,
    Table,
    Typography,
} from "antd";
import { formatCurrency } from "@/lib/currencyUtils";
import type { UstvaReport, EuerReport } from "@/lib/taxReports";

const { Title, Paragraph, Text } = Typography;

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

export default function ReportsPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [part, setPart] = useState<string>(
        `Q${Math.floor(now.getMonth() / 3) + 1}`
    );
    const [loading, setLoading] = useState(true);
    const [ustva, setUstva] = useState<UstvaReport | null>(null);
    const [euer, setEuer] = useState<EuerReport | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/reports/tax?year=${year}&part=${part}`
            );
            if (!res.ok) throw new Error("failed");
            const data = await res.json();
            setUstva(data.ustva);
            setEuer(data.euer);
        } catch (error) {
            console.error("Error loading reports:", error);
        } finally {
            setLoading(false);
        }
    }, [year, part]);

    useEffect(() => {
        load();
    }, [load]);

    const ustvaRows = ustva
        ? [
              {
                  key: "81",
                  kz: "81",
                  label: "Steuerpflichtige Umsätze 19 % (netto)",
                  value: ustva.kz81Net,
              },
              {
                  key: "81t",
                  kz: "",
                  label: "Umsatzsteuer 19 %",
                  value: ustva.kz81Tax,
              },
              {
                  key: "86",
                  kz: "86",
                  label: "Steuerpflichtige Umsätze 7 % (netto)",
                  value: ustva.kz86Net,
              },
              {
                  key: "86t",
                  kz: "",
                  label: "Umsatzsteuer 7 %",
                  value: ustva.kz86Tax,
              },
              ...(ustva.taxFreeNet !== 0
                  ? [
                        {
                            key: "free",
                            kz: "–",
                            label: "Steuerfreie Umsätze (netto)",
                            value: ustva.taxFreeNet,
                        },
                    ]
                  : []),
              {
                  key: "66",
                  kz: "66",
                  label: "Vorsteuer aus Ausgaben",
                  value: ustva.kz66Vorsteuer,
              },
              {
                  key: "83",
                  kz: "83",
                  label: "Zahllast (+) / Erstattung (−)",
                  value: ustva.kz83Zahllast,
              },
          ]
        : [];

    return (
        <div style={{ maxWidth: 1000 }}>
            <Title level={3}>Steuer-Reports</Title>
            <Paragraph type="secondary">
                Vereinfachte Auswertung auf Rechnungsbasis: UStVA nach
                Soll-Versteuerung (Rechnungsdatum), EÜR näherungsweise über
                bezahlte Rechnungen. Werte zur Übernahme in ELSTER bzw. zur
                Abstimmung mit Ihrer Steuerberatung – keine Steuerberatung.
            </Paragraph>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col>
                    <Select
                        value={year}
                        onChange={setYear}
                        options={[year - 1, year, year + 1]
                            .filter((y) => y <= now.getFullYear())
                            .map((y) => ({ value: y, label: String(y) }))}
                        style={{ width: 100 }}
                    />
                </Col>
                <Col>
                    <Segmented
                        value={part}
                        onChange={(value) => setPart(String(value))}
                        options={[...QUARTERS]}
                    />
                </Col>
            </Row>

            {loading ? (
                <Spin size="large" />
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={`Umsatzsteuervoranmeldung ${part}/${year}`}
                        >
                            <Table
                                size="small"
                                pagination={false}
                                dataSource={ustvaRows}
                                columns={[
                                    {
                                        title: "KZ",
                                        dataIndex: "kz",
                                        width: 60,
                                    },
                                    { title: "Position", dataIndex: "label" },
                                    {
                                        title: "Betrag",
                                        dataIndex: "value",
                                        align: "right" as const,
                                        render: (value: number) => (
                                            <Text
                                                strong={value === ustva?.kz83Zahllast}
                                            >
                                                {formatCurrency(value, "de")}
                                            </Text>
                                        ),
                                    },
                                ]}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title={`EÜR ${year} (vereinfacht)`}>
                            {euer && (
                                <Table
                                    size="small"
                                    pagination={false}
                                    dataSource={[
                                        ...euer.incomeByRate.map((item) => ({
                                            key: `in-${item.rate}`,
                                            label: `Einnahmen ${item.rate} % (netto)`,
                                            value: item.net,
                                        })),
                                        {
                                            key: "vat-in",
                                            label: "Vereinnahmte Umsatzsteuer",
                                            value: euer.collectedVat,
                                        },
                                        {
                                            key: "sum-in",
                                            label: "Summe Betriebseinnahmen",
                                            value: euer.totalIncome,
                                        },
                                        ...euer.expenseGroups.map((group) => ({
                                            key: `ex-${group.category}`,
                                            label: `Ausgaben: ${group.category}`,
                                            value: -group.net,
                                        })),
                                        {
                                            key: "vat-out",
                                            label: "Gezahlte Vorsteuer",
                                            value: -euer.paidVorsteuer,
                                        },
                                        {
                                            key: "profit",
                                            label: "Gewinn / Verlust",
                                            value: euer.profit,
                                        },
                                    ]}
                                    columns={[
                                        {
                                            title: "Position",
                                            dataIndex: "label",
                                        },
                                        {
                                            title: "Betrag",
                                            dataIndex: "value",
                                            align: "right" as const,
                                            render: (
                                                value: number,
                                                record: { key: string }
                                            ) => (
                                                <Text
                                                    strong={
                                                        record.key ===
                                                            "profit" ||
                                                        record.key === "sum-in"
                                                    }
                                                >
                                                    {formatCurrency(
                                                        value,
                                                        "de"
                                                    )}
                                                </Text>
                                            ),
                                        },
                                    ]}
                                />
                            )}
                        </Card>
                    </Col>
                    <Col span={24}>
                        <Alert
                            type="info"
                            showIcon
                            message="Direkt in ELSTER übertragen"
                            description="Die Kennzahlen (KZ) entsprechen den Feldern der Umsatzsteuervoranmeldung in ELSTER. Eine direkte Übermittlung ist mit Open-Source-Software derzeit nicht möglich (die ELSTER-Schnittstelle ERiC ist proprietär) – kopieren Sie die Werte in Ihr ELSTER-Formular."
                        />
                    </Col>
                </Row>
            )}
        </div>
    );
}
