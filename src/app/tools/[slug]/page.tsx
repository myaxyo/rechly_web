import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS_CATALOG, getToolBySlug } from "@/lib/tools/catalog";
import { createPageMetadata } from "@/lib/seo";
import ToolLayout from "@/components/tools/ToolLayout";

// Tool Components
import ERechnungViewer from "@/components/tools/ERechnungViewer";
import GiroCodeGenerator from "@/components/tools/GiroCodeGenerator";
import VerzugszinsenRechner from "@/components/tools/VerzugszinsenRechner";
import VatIdChecker from "@/components/tools/VatIdChecker";
import SkontoRechner from "@/components/tools/SkontoRechner";
import StundensatzRechner from "@/components/tools/StundensatzRechner";
import KleinunternehmerRechner from "@/components/tools/KleinunternehmerRechner";
import ImpressumGenerator from "@/components/tools/ImpressumGenerator";
import BewirtungsbelegRechner from "@/components/tools/BewirtungsbelegRechner";
import ArbeitstageRechner from "@/components/tools/ArbeitstageRechner";
import LeitwegIdValidator from "@/components/tools/LeitwegIdValidator";
import GewerbesteuerRechner from "@/components/tools/GewerbesteuerRechner";
import SpesenRechner from "@/components/tools/SpesenRechner";
import KassenbuchEigenbeleg from "@/components/tools/KassenbuchEigenbeleg";
import BautagebuchBuilder from "@/components/tools/BautagebuchBuilder";
import SteuerkalenderRechner from "@/components/tools/SteuerkalenderRechner";
import MahnungGenerator from "@/components/tools/MahnungGenerator";
import EuerRechner from "@/components/tools/EuerRechner";
import ReverseChargeRechner from "@/components/tools/ReverseChargeRechner";
import AfaRechner from "@/components/tools/AfaRechner";
import SepaXmlGenerator from "@/components/tools/SepaXmlGenerator";
import RechnungsGenerator from "@/components/tools/RechnungsGenerator";
import AngebotsGenerator from "@/components/tools/AngebotsGenerator";
import MehrwertsteuerRechner from "@/components/tools/MehrwertsteuerRechner";
import QuittungGenerator from "@/components/tools/QuittungGenerator";
import LieferscheinGenerator from "@/components/tools/LieferscheinGenerator";
import StornorechnungGenerator from "@/components/tools/StornorechnungGenerator";
import FahrtkostenRechner from "@/components/tools/FahrtkostenRechner";
import StundenzettelGenerator from "@/components/tools/StundenzettelGenerator";
import MargeRechner from "@/components/tools/MargeRechner";

interface ToolPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return TOOLS_CATALOG.map((tool) => ({
        slug: tool.slug,
    }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
    const { slug } = await params;
    const tool = getToolBySlug(slug);
    if (!tool) return {};

    return createPageMetadata({
        title: tool.metaTitle,
        description: tool.metaDescription,
        path: tool.path,
        type: "website",
        keywords: tool.keywords,
        category: tool.category,
    });
}

export default async function ToolPage({ params }: ToolPageProps) {
    const { slug } = await params;
    const tool = getToolBySlug(slug);
    if (!tool) notFound();

    // Resolve related tools
    const relatedTools = tool.relatedToolIds
        .map((id) => getToolBySlug(id))
        .filter((t): t is typeof tool => t !== undefined)
        .map((t) => ({
            title: t.shortTitle,
            description: t.description,
            href: t.path,
            badge: t.badge,
        }));

    return (
        <ToolLayout
            path={tool.path}
            title={tool.title}
            eyebrow={tool.eyebrow}
            description={tool.description}
            category={tool.category}
            keywords={tool.keywords}
            guideSections={tool.guideSections}
            faqs={tool.faqs}
            relatedTools={relatedTools}
        >
            <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Werkzeug wird geladen...</div>}>
                {renderToolComponent(tool.slug)}
            </Suspense>
        </ToolLayout>
    );
}

function renderToolComponent(slug: string) {
    switch (slug) {
        case "e-rechnung-viewer":
            return <ERechnungViewer />;
        case "girocode-generator":
            return <GiroCodeGenerator />;
        case "verzugszinsen-rechner":
            return <VerzugszinsenRechner />;
        case "ust-idnr-pruefen":
            return <VatIdChecker />;
        case "skontorechner":
            return <SkontoRechner />;
        case "stundensatz-rechner":
            return <StundensatzRechner />;
        case "kleinunternehmer-rechner":
            return <KleinunternehmerRechner />;
        case "impressum-generator":
            return <ImpressumGenerator />;
        case "bewirtungsbeleg-rechner":
            return <BewirtungsbelegRechner />;
        case "arbeitstage-rechner":
            return <ArbeitstageRechner />;
        case "leitweg-id-pruefen":
            return <LeitwegIdValidator />;
        case "gewerbesteuer-rechner":
            return <GewerbesteuerRechner />;
        case "verpflegungsmehraufwand-rechner":
            return <SpesenRechner />;
        case "kassenbuch-vorlage":
            return <KassenbuchEigenbeleg />;
        case "bautagebuch-vorlage":
            return <BautagebuchBuilder />;
        case "steuerkalender-2026":
            return <SteuerkalenderRechner year={2026} />;
        case "steuerkalender-2027":
            return <SteuerkalenderRechner year={2027} />;
        case "mahnung-generator":
            return <MahnungGenerator />;
        case "euer-rechner":
            return <EuerRechner />;
        case "reverse-charge-rechner":
            return <ReverseChargeRechner />;
        case "afa-rechner":
            return <AfaRechner />;
        case "sepa-xml-generator":
            return <SepaXmlGenerator />;
        case "rechnungsgenerator":
            return <RechnungsGenerator />;
        case "angebotsgenerator":
            return <AngebotsGenerator />;
        case "mehrwertsteuer-rechner":
            return <MehrwertsteuerRechner />;
        case "quittung-erstellen":
            return <QuittungGenerator />;
        case "lieferschein-generator":
            return <LieferscheinGenerator />;
        case "stornorechnung-generator":
            return <StornorechnungGenerator />;
        case "fahrtkosten-rechner":
            return <FahrtkostenRechner />;
        case "stundenzettel-generator":
            return <StundenzettelGenerator />;
        case "marge-rechner":
            return <MargeRechner />;
        default:
            return <div>Tool nicht gefunden.</div>;
    }
}
