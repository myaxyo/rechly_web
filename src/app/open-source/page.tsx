import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getRepoUrl, getSiteUrl } from "@/lib/env";
import { createPageMetadata } from "@/lib/seo";

const siteUrl = getSiteUrl();
const repoUrl = getRepoUrl();
const path = "/open-source";

export const metadata = createPageMetadata({
    title: "Open-Source Rechnungssoftware",
    description:
        "Rechly ist offene Rechnungssoftware unter AGPL-3.0: Quellcode prüfen, selbst hosten, Fehler melden und gemeinsam Funktionen entwickeln.",
    path,
});

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebPage",
            "@id": `${siteUrl}${path}#webpage`,
            name: "Rechly als Open-Source Rechnungssoftware",
            url: `${siteUrl}${path}`,
            inLanguage: "de-DE",
            isPartOf: { "@id": `${siteUrl}/#website` },
            about: { "@id": `${siteUrl}/#source-code` },
        },
        {
            "@type": "SoftwareSourceCode",
            "@id": `${siteUrl}/#source-code`,
            name: "Rechly",
            codeRepository: repoUrl,
            license: `${repoUrl}/blob/main/LICENSE`,
            programmingLanguage: "TypeScript",
            runtimePlatform: "Web",
        },
        {
            "@type": "BreadcrumbList",
            "@id": `${siteUrl}${path}#breadcrumb`,
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Startseite",
                    item: siteUrl,
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "Open Source",
                    item: `${siteUrl}${path}`,
                },
            ],
        },
    ],
};

export default function OpenSourcePage() {
    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <Navbar />
            <main style={{ padding: "128px 24px 80px" }}>
                <article style={{ maxWidth: 860, margin: "0 auto" }}>
                    <nav
                        aria-label="Brotkrümelnavigation"
                        style={{ marginBottom: 24, color: "#64748b" }}
                    >
                        <Link href="/">Startseite</Link>
                        <span aria-hidden="true"> / </span>
                        <span aria-current="page">Open Source</span>
                    </nav>
                    <p className="landing-eyebrow">TRANSPARENT ENTWICKELT</p>
                    <h1
                        style={{
                            fontSize: 46,
                            lineHeight: 1.1,
                            margin: "16px 0 20px",
                            color: "#0f172a",
                        }}
                    >
                        Open-Source Rechnungssoftware, die du prüfen und
                        mitgestalten kannst
                    </h1>
                    <p
                        style={{
                            fontSize: 19,
                            lineHeight: 1.75,
                            color: "#475569",
                            maxWidth: 760,
                        }}
                    >
                        Rechly wird öffentlich auf GitHub entwickelt. Du kannst
                        nachvollziehen, wie Funktionen umgesetzt werden,
                        Verbesserungsvorschläge einreichen, Fehler melden oder
                        eine eigene Instanz betreiben.
                    </p>

                    <section style={{ marginTop: 52 }}>
                        <h2>AGPL-3.0: offen mit klaren Regeln</h2>
                        <p style={{ lineHeight: 1.75, color: "#475569" }}>
                            Der Quellcode steht unter der GNU Affero General
                            Public License v3.0. Die Lizenz erlaubt Nutzung,
                            Prüfung, Anpassung und Weitergabe. Wer eine
                            veränderte Version als Netzwerkdienst anbietet,
                            stellt den zugehörigen Quellcode ebenfalls bereit.
                        </p>
                    </section>

                    <section style={{ marginTop: 40 }}>
                        <h2>Warum Open Source bei Rechnungssoftware wichtig ist</h2>
                        <ul style={{ lineHeight: 1.9, color: "#334155" }}>
                            <li>Transparenz über Funktionen und Datenflüsse</li>
                            <li>Unabhängige Prüfung durch die Community</li>
                            <li>Selbsthosting auf eigener Infrastruktur</li>
                            <li>Offene Issues, Roadmap und nachvollziehbare Änderungen</li>
                            <li>Keine Bindung an ein geschlossenes Dateiformat</li>
                        </ul>
                    </section>

                    <section style={{ marginTop: 40 }}>
                        <h2>Mitmachen und beitragen</h2>
                        <p style={{ lineHeight: 1.75, color: "#475569" }}>
                            Beiträge sind willkommen – von Fehlerberichten und
                            Übersetzungen bis zu Dokumentation, Design und Code.
                            Bitte beachte vor einem Pull Request die vorhandenen
                            Contribution- und Sicherheitsrichtlinien im Repository.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 12,
                                marginTop: 24,
                            }}
                        >
                            <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: "12px 18px",
                                    borderRadius: 10,
                                    background: "#1677ff",
                                    color: "#fff",
                                    fontWeight: 700,
                                }}
                            >
                                Quellcode auf GitHub
                            </a>
                            <a
                                href={`${repoUrl}/issues`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: "12px 18px",
                                    borderRadius: 10,
                                    border: "1px solid #cbd5e1",
                                    color: "#0f172a",
                                    fontWeight: 700,
                                }}
                            >
                                Issue melden
                            </a>
                        </div>
                    </section>
                </article>
            </main>
            <Footer />
        </div>
    );
}
