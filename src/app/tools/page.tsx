"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    QrCode,
    FileSearch,
    DollarSign,
    Percent,
    Calculator,
    Store,
    FileCheck,
    Coffee,
    Calendar,
    ClipboardCheck,
    Landmark,
    Compass,
    ClipboardList,
    Wrench,
    FileText,
    Files,
    Car,
    Undo2,
    Clock,
    TrendingUp,
    CircleAlert,
    BookOpen,
    Globe,
    X } from "lucide-react";
import { TOOLS_CATALOG } from "@/lib/tools/catalog";
import s from "@/components/tools/tool.module.css";
import hub from "./tools.module.css";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

const ICON_MAP: Record<string, React.ReactNode> = {
    FileSearchOutlined: <FileSearch style={{ width: 24, height: 24, color: "#2855d9" }} />,
    QrcodeOutlined: <QrCode style={{ width: 24, height: 24, color: "#2855d9" }} />,
    DollarOutlined: <DollarSign style={{ width: 24, height: 24, color: "#2855d9" }} />,
    SafetyCertificateOutlined: <ShieldCheck style={{ width: 24, height: 24, color: "#2855d9" }} />,
    PercentageOutlined: <Percent style={{ width: 24, height: 24, color: "#2855d9" }} />,
    CalculatorOutlined: <Calculator style={{ width: 24, height: 24, color: "#2855d9" }} />,
    ShopOutlined: <Store style={{ width: 24, height: 24, color: "#2855d9" }} />,
    FileProtectOutlined: <FileCheck style={{ width: 24, height: 24, color: "#2855d9" }} />,
    CoffeeOutlined: <Coffee style={{ width: 24, height: 24, color: "#2855d9" }} />,
    CalendarOutlined: <Calendar style={{ width: 24, height: 24, color: "#2855d9" }} />,
    AuditOutlined: <ClipboardCheck style={{ width: 24, height: 24, color: "#2855d9" }} />,
    BankOutlined: <Landmark style={{ width: 24, height: 24, color: "#2855d9" }} />,
    CompassOutlined: <Compass style={{ width: 24, height: 24, color: "#2855d9" }} />,
    SolutionOutlined: <ClipboardList style={{ width: 24, height: 24, color: "#2855d9" }} />,
    ToolOutlined: <Wrench style={{ width: 24, height: 24, color: "#2855d9" }} />,
    FileTextOutlined: <FileText style={{ width: 24, height: 24, color: "#2855d9" }} />,
    SnippetsOutlined: <Files style={{ width: 24, height: 24, color: "#2855d9" }} />,
    CarOutlined: <Car style={{ width: 24, height: 24, color: "#2855d9" }} />,
    RollbackOutlined: <Undo2 style={{ width: 24, height: 24, color: "#2855d9" }} />,
    ClockCircleOutlined: <Clock style={{ width: 24, height: 24, color: "#2855d9" }} />,
    LineChartOutlined: <TrendingUp style={{ width: 24, height: 24, color: "#2855d9" }} />,
    ExclamationCircleOutlined: <CircleAlert style={{ width: 24, height: 24, color: "#2855d9" }} />,
    AccountBookOutlined: <BookOpen style={{ width: 24, height: 24, color: "#2855d9" }} />,
    GlobalOutlined: <Globe style={{ width: 24, height: 24, color: "#2855d9" }} /> };

const CATEGORIES = [
    "Alle",
    "Tagesgeschäft & E-Rechnung",
    "Finanzen & Steuern",
    "Kalkulation & HR",
    "Recht & Vorlagen",
] as const;

export default function ToolsHubPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Alle");

    const filteredTools = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return TOOLS_CATALOG.filter((tool) => {
            const matchesCategory =
                selectedCategory === "Alle" || tool.category === selectedCategory;
            const matchesSearch =
                !query ||
                tool.title.toLowerCase().includes(query) ||
                tool.shortTitle.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query) ||
                tool.keywords.some((k) => k.toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${siteUrl}/tools#collection`,
                name: "Kostenlose Business-Tools & Rechner für deutsche Unternehmen | Rechly",
                url: `${siteUrl}/tools`,
                description:
                    "Die deutsche Business-Superapp: Kostenlose Rechner, E-Rechnung Viewer, GiroCode Generator, Verzugszinsen, USt-IdNr.-Prüfer und Vorlagen ohne Registrierung.",
                inLanguage: "de-DE",
                isPartOf: {
                    "@id": `${siteUrl}/#website` },
                hasPart: TOOLS_CATALOG.map((tool) => ({
                    "@type": "SoftwareApplication",
                    name: tool.title,
                    url: `${siteUrl}${tool.path}`,
                    applicationCategory: "BusinessApplication",
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "EUR" } })) },
        ] };

    return (
        <div className={s.page}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
            />
            <Navbar />

            <section className={s.hero}>
                <div className={hub.hubWrap}>
                    <p className={hub.kicker}>Kostenlose Tools — ohne Registrierung</p>
                    <h1 className={hub.hubH1}>Rechner & Werkzeuge für deinen Geschäftsalltag</h1>
                    <p className={s.lede}>
                        Vom Rechnungsgenerator bis zum Verzugszinsen-Rechner: alle Tools kostenlos,
                        ohne Login und direkt im Browser. Und wenn du mehr brauchst, wächst Rechly mit —
                        Rechnungen, Kunden und Termine in einem Konto für 0 €.
                    </p>
                    <div className={hub.search}>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tool suchen — z. B. Skonto, GiroCode, USt-IdNr …"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 pl-10 pr-10"
                            />
                            {searchQuery && (
                                <button type="button" aria-label="Suche löschen" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={hub.chips} role="group" aria-label="Kategorie filtern">
                        {CATEGORIES.map((cat) => {
                            const active = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={active ? hub.chipActive : hub.chip}
                                    aria-pressed={active}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <main className={hub.hubMain}>
                <div className={hub.metaRow}>
                    <span>
                        {filteredTools.length} {filteredTools.length === 1 ? "Werkzeug" : "Werkzeuge"}
                    </span>
                    <span className={hub.metaTrust}>
                        <span><CheckCircle2 /> Ohne Login nutzbar</span>
                        <span><ShieldCheck /> Berechnung nur in deinem Browser</span>
                    </span>
                </div>

                {filteredTools.length === 0 ? (
                    <div className={hub.empty}>
                        <p>Kein Tool gefunden. Versuch ein anderes Stichwort — oder leg direkt los:</p>
                        <Link href="/register" className={s.ctaBtn}>
                            Kostenlos mit Rechly starten <ArrowRight />
                        </Link>
                    </div>
                ) : (
                    <div className={hub.grid}>
                        {filteredTools.map((tool) => (
                            <Link key={tool.id} href={tool.path} className={hub.card}>
                                <div>
                                    <div className={hub.cardTop}>
                                        <span className={hub.cardIcon}>
                                            {ICON_MAP[tool.icon] || <Calculator style={{ width: 22, height: 22, color: "#2855d9" }} />}
                                        </span>
                                        {tool.badge && <Badge>{tool.badge}</Badge>}
                                    </div>
                                    <h2 className={hub.cardTitle}>{tool.shortTitle}</h2>
                                    <p className={hub.cardText}>{tool.description}</p>
                                </div>
                                <div className={hub.cardFoot}>
                                    <span>{tool.category}</span>
                                    <span className={hub.open}>
                                        Tool öffnen <ArrowRight style={{ width: 11, height: 11 }} />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <nav aria-label="Ratgeber" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
                    <Link href="/rechnungsprogramm-kostenlos">Rechnungsprogramm kostenlos: Vollversion ohne Abo</Link>
                    <Link href="/kleinunternehmer-rechnung">Kleinunternehmer-Rechnung nach § 19 UStG erstellen</Link>
                    <Link href="/rechnungssoftware-fuer-freelancer">Rechnungssoftware für Freelancer im Überblick</Link>
                    <Link href="/rechnung-fuer-kleinunternehmer-erstellen">Rechnung für Kleinunternehmer online erstellen</Link>
                </nav>

                <div className={s.cta}>
                    <div>
                        <span className={s.ctaKicker}>Mehr als Einzel-Tools</span>
                        <h2>Vom kostenlosen Tool zum kompletten Büro</h2>
                        <p>
                            Rechnungen, E-Rechnungen (XRechnung & ZUGFeRD), Angebote, Kunden,
                            Mahnungen, Ausgaben und Terminbuchung — in einer kostenlosen,
                            offenen Plattform statt in fünf Bezahl-Abos.
                        </p>
                    </div>
                    <Link href="/register" className={s.ctaBtn}>
                        Kostenlos registrieren <ArrowRight />
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
