import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS_CATALOG, getToolBySlug } from "@/lib/tools/catalog";
import { createPageMetadata } from "@/lib/seo";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolLoader from "@/components/tools/ToolLoader";

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
            <Suspense fallback={<ToolSkeleton />}>
                {renderToolComponent(tool.slug)}
            </Suspense>
        </ToolLayout>
    );
}

function renderToolComponent(slug: string) {
    return <ToolLoader slug={slug} />;
}
