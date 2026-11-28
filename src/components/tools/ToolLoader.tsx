"use client";

import React from "react";
import dynamic from "next/dynamic";

function ToolSkeleton() {
    return (
        <div
            role="status"
            aria-label="Werkzeug wird geladen"
            style={{ minHeight: 560, padding: 24 }}
        >
            <div className="animate-pulse" style={{ display: "grid", gap: 16 }}>
                <div style={{ height: 20, width: "38%", borderRadius: 8, background: "#e2e8f0" }} />
                <div style={{ height: 44, borderRadius: 12, background: "#e2e8f0" }} />
                <div style={{ height: 44, borderRadius: 12, background: "#e2e8f0" }} />
                <div style={{ height: 180, borderRadius: 16, background: "#e2e8f0" }} />
                <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, margin: 0 }}>
                    Werkzeug wird geladen...
                </p>
            </div>
        </div>
    );
}

const loading = () => <ToolSkeleton />;

// One lazy entry per slug: only the rendered tool's chunk is fetched.
// All tool components are "use client" with a default export and render on
// the server, so SSR stays enabled (no ssr: false).
const TOOL_COMPONENTS = {
    "e-rechnung-viewer": dynamic(() => import("./ERechnungViewer"), { loading }),
    "girocode-generator": dynamic(() => import("./GiroCodeGenerator"), { loading }),
    "verzugszinsen-rechner": dynamic(() => import("./VerzugszinsenRechner"), { loading }),
    "ust-idnr-pruefen": dynamic(() => import("./VatIdChecker"), { loading }),
    skontorechner: dynamic(() => import("./SkontoRechner"), { loading }),
    "stundensatz-rechner": dynamic(() => import("./StundensatzRechner"), { loading }),
    "kleinunternehmer-rechner": dynamic(() => import("./KleinunternehmerRechner"), { loading }),
    "impressum-generator": dynamic(() => import("./ImpressumGenerator"), { loading }),
    "bewirtungsbeleg-rechner": dynamic(() => import("./BewirtungsbelegRechner"), { loading }),
    "arbeitstage-rechner": dynamic(() => import("./ArbeitstageRechner"), { loading }),
    "leitweg-id-pruefen": dynamic(() => import("./LeitwegIdValidator"), { loading }),
    "gewerbesteuer-rechner": dynamic(() => import("./GewerbesteuerRechner"), { loading }),
    "verpflegungsmehraufwand-rechner": dynamic(() => import("./SpesenRechner"), { loading }),
    "kassenbuch-vorlage": dynamic(() => import("./KassenbuchEigenbeleg"), { loading }),
    "bautagebuch-vorlage": dynamic(() => import("./BautagebuchBuilder"), { loading }),
    "steuerkalender-2026": dynamic(() => import("./SteuerkalenderRechner"), { loading }),
    "steuerkalender-2027": dynamic(() => import("./SteuerkalenderRechner"), { loading }),
    "mahnung-generator": dynamic(() => import("./MahnungGenerator"), { loading }),
    "euer-rechner": dynamic(() => import("./EuerRechner"), { loading }),
    "reverse-charge-rechner": dynamic(() => import("./ReverseChargeRechner"), { loading }),
    "afa-rechner": dynamic(() => import("./AfaRechner"), { loading }),
    "sepa-xml-generator": dynamic(() => import("./SepaXmlGenerator"), { loading }),
    rechnungsgenerator: dynamic(() => import("./RechnungsGenerator"), { loading }),
    angebotsgenerator: dynamic(() => import("./AngebotsGenerator"), { loading }),
    "mehrwertsteuer-rechner": dynamic(() => import("./MehrwertsteuerRechner"), { loading }),
    "quittung-erstellen": dynamic(() => import("./QuittungGenerator"), { loading }),
    "lieferschein-generator": dynamic(() => import("./LieferscheinGenerator"), { loading }),
    "stornorechnung-generator": dynamic(() => import("./StornorechnungGenerator"), { loading }),
    "fahrtkosten-rechner": dynamic(() => import("./FahrtkostenRechner"), { loading }),
    "stundenzettel-generator": dynamic(() => import("./StundenzettelGenerator"), { loading }),
    "marge-rechner": dynamic(() => import("./MargeRechner"), { loading }),
} as const;

type ToolSlug = keyof typeof TOOL_COMPONENTS;

export default function ToolLoader({ slug }: { slug: string }) {
    const Tool = TOOL_COMPONENTS[slug as ToolSlug] as
        | React.ComponentType<{ year?: number }>
        | undefined;
    if (!Tool) return <div>Tool nicht gefunden.</div>;
    if (slug === "steuerkalender-2026") return <Tool year={2026} />;
    if (slug === "steuerkalender-2027") return <Tool year={2027} />;
    return <Tool />;
}
