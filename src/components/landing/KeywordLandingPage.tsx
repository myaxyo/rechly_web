import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getSiteUrl } from "@/lib/env";

type KeywordSection = {
    title: string;
    body: string[];
    bullets?: string[];
};

type KeywordFaq = {
    question: string;
    answer: string;
};

type KeywordLink = {
    href: string;
    title: string;
    description: string;
};

interface KeywordLandingPageProps {
    path: string;
    title: string;
    eyebrow: string;
    intro: string;
    summary: string;
    keywordPills: string[];
    sections: KeywordSection[];
    faqs: KeywordFaq[];
    clusterLinks: KeywordLink[];
}

const siteUrl = getSiteUrl();

export default function KeywordLandingPage({
    path,
    title,
    eyebrow,
    intro,
    summary,
    keywordPills,
    sections,
    faqs,
    clusterLinks,
}: KeywordLandingPageProps) {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                name: title,
                url: `${siteUrl}${path}`,
                description: summary,
                inLanguage: "de-DE",
                isPartOf: {
                    "@type": "WebSite",
                    "@id": `${siteUrl}/#website`,
                },
            },
            {
                "@type": "BreadcrumbList",
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
                        name: title,
                        item: `${siteUrl}${path}`,
                    },
                ],
            },
            {
                "@type": "FAQPage",
                mainEntity: faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: faq.answer,
                    },
                })),
            },
        ],
    };

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />

            <Navbar />

            <main>
                <section
                    style={{
                        padding: "136px 24px 56px",
                        background:
                            "linear-gradient(180deg, #eef6ff 0%, #ffffff 70%)",
                    }}
                >
                    <div style={{ maxWidth: 980, margin: "0 auto" }}>
                        <div className="landing-eyebrow">{eyebrow}</div>
                        <h1
                            style={{
                                marginTop: 18,
                                marginBottom: 16,
                                fontSize: 46,
                                lineHeight: 1.1,
                                color: "#0f172a",
                                fontWeight: 800,
                                maxWidth: 760,
                            }}
                        >
                            {title}
                        </h1>
                        <p
                            style={{
                                maxWidth: 760,
                                fontSize: 19,
                                lineHeight: 1.7,
                                color: "#475569",
                                marginBottom: 20,
                            }}
                        >
                            {intro}
                        </p>
                        <p
                            style={{
                                maxWidth: 760,
                                fontSize: 16,
                                lineHeight: 1.75,
                                color: "#64748b",
                                marginBottom: 28,
                            }}
                        >
                            {summary}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                            }}
                        >
                            {keywordPills.map((keyword) => (
                                <span
                                    key={keyword}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 999,
                                        background: "#f8fafc",
                                        border: "1px solid rgba(15, 23, 42, 0.08)",
                                        color: "#334155",
                                        fontSize: 14,
                                        fontWeight: 600,
                                    }}
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ padding: "0 24px 48px" }}>
                    <div style={{ maxWidth: 980, margin: "0 auto" }}>
                        <div
                            style={{
                                display: "grid",
                                gap: 20,
                            }}
                        >
                            {sections.map((section) => (
                                <article
                                    key={section.title}
                                    style={{
                                        padding: 28,
                                        borderRadius: 24,
                                        border: "1px solid rgba(15, 23, 42, 0.08)",
                                        background: "#ffffff",
                                        boxShadow:
                                            "0 18px 40px rgba(15, 23, 42, 0.05)",
                                    }}
                                >
                                    <h2
                                        style={{
                                            marginBottom: 16,
                                            fontSize: 28,
                                            color: "#0f172a",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {section.title}
                                    </h2>
                                    {section.body.map((paragraph) => (
                                        <p
                                            key={paragraph}
                                            style={{
                                                color: "#475569",
                                                fontSize: 16,
                                                lineHeight: 1.75,
                                                marginBottom: 14,
                                            }}
                                        >
                                            {paragraph}
                                        </p>
                                    ))}
                                    {section.bullets?.length ? (
                                        <ul
                                            style={{
                                                margin: "10px 0 0",
                                                paddingLeft: 20,
                                                color: "#334155",
                                                lineHeight: 1.8,
                                                fontSize: 15,
                                            }}
                                        >
                                            {section.bullets.map((bullet) => (
                                                <li key={bullet}>{bullet}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ padding: "0 24px 48px" }}>
                    <div style={{ maxWidth: 980, margin: "0 auto" }}>
                        <div
                            style={{
                                padding: 30,
                                borderRadius: 26,
                                background:
                                    "linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)",
                                color: "#f8fafc",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    marginBottom: 10,
                                }}
                            >
                                Rechly kostenlos ausprobieren
                            </div>
                            <p
                                style={{
                                    fontSize: 16,
                                    lineHeight: 1.75,
                                    color: "rgba(226, 232, 240, 0.92)",
                                    marginBottom: 18,
                                    maxWidth: 740,
                                }}
                            >
                                Wenn du eine deutsche Rechnungssoftware suchst,
                                mit der du schnell starten und deine Prozesse
                                später weiter ausbauen kannst, ist Rechly die
                                offene Basis dafür.
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 12,
                                }}
                            >
                                <Link
                                    href="/register"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 46,
                                        padding: "0 18px",
                                        borderRadius: 12,
                                        background: "#f8fafc",
                                        color: "#0f172a",
                                        fontWeight: 700,
                                        textDecoration: "none",
                                    }}
                                >
                                    Kostenlos registrieren
                                </Link>
                                <Link
                                    href="/features"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 46,
                                        padding: "0 18px",
                                        borderRadius: 12,
                                        border: "1px solid rgba(248, 250, 252, 0.24)",
                                        color: "#f8fafc",
                                        fontWeight: 600,
                                        textDecoration: "none",
                                    }}
                                >
                                    Funktionen ansehen
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section style={{ padding: "0 24px 80px" }}>
                    <div style={{ maxWidth: 980, margin: "0 auto" }}>
                        <h2
                            style={{
                                marginBottom: 18,
                                fontSize: 30,
                                color: "#0f172a",
                                fontWeight: 700,
                            }}
                        >
                            Häufige Fragen
                        </h2>
                        <div
                            style={{
                                display: "grid",
                                gap: 16,
                                marginBottom: 36,
                            }}
                        >
                            {faqs.map((faq) => (
                                <article
                                    key={faq.question}
                                    style={{
                                        padding: 24,
                                        borderRadius: 20,
                                        background: "#f8fafc",
                                        border: "1px solid rgba(15, 23, 42, 0.06)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            marginBottom: 10,
                                            fontSize: 18,
                                            color: "#0f172a",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {faq.question}
                                    </h3>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 15,
                                            lineHeight: 1.75,
                                            color: "#475569",
                                        }}
                                    >
                                        {faq.answer}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <h2
                            style={{
                                marginBottom: 18,
                                fontSize: 30,
                                color: "#0f172a",
                                fontWeight: 700,
                            }}
                        >
                            Mehr zu deutschen Rechnungsprozessen
                        </h2>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 18,
                            }}
                        >
                            {clusterLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    style={{ textDecoration: "none" }}
                                >
                                    <article
                                        style={{
                                            height: "100%",
                                            padding: 24,
                                            borderRadius: 20,
                                            border: "1px solid rgba(15, 23, 42, 0.08)",
                                            background: "#ffffff",
                                            boxShadow:
                                                "0 14px 30px rgba(15, 23, 42, 0.05)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                marginBottom: 10,
                                                fontSize: 19,
                                                fontWeight: 700,
                                                color: "#0f172a",
                                            }}
                                        >
                                            {link.title}
                                        </div>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 14,
                                                lineHeight: 1.7,
                                                color: "#64748b",
                                            }}
                                        >
                                            {link.description}
                                        </p>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
