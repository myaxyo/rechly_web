"use client";

import { Mail, Code2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getContactEmail, getOptionalLinkedInUrl, getRepoUrl } from "@/lib/env";

const contactEmail = getContactEmail();
const linkedInUrl = getOptionalLinkedInUrl();
const repoUrl = getRepoUrl();

const content = {
    de: {
        title: "Impressum",
        aboutTitle: "Über das Projekt",
        aboutText:
            "Rechly ist ein privates, nicht-kommerzielles Open-Source-Projekt. Es wird als Hobbyprojekt von einem Studenten entwickelt und ist kostenlos nutzbar.",
        aboutNote:
            "Da es sich um ein rein privates Projekt ohne geschäftsmäßige Absichten handelt, besteht keine Impressumspflicht gemäß § 5 DDG.",
        contactTitle: "Kontakt",
        liabilityContentTitle: "Haftung für Inhalte",
        liabilityContentText:
            "Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.",
        liabilityLinksTitle: "Haftung für Links",
        liabilityLinksText:
            "Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte kein Einfluss besteht. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.",
        lastUpdated: "Stand: Dezember 2025",
    },
    en: {
        title: "Imprint",
        aboutTitle: "About the Project",
        aboutText:
            "Rechly is a private, non-commercial open-source project. It is developed as a hobby project by a student and is free to use.",
        aboutNote:
            "As this is a purely private project without commercial intent, there is no legal imprint requirement under German law (§ 5 DDG).",
        contactTitle: "Contact",
        liabilityContentTitle: "Liability for Content",
        liabilityContentText:
            "The contents of these pages were created with the utmost care. However, no guarantee can be given for the correctness, completeness, and timeliness of the content.",
        liabilityLinksTitle: "Liability for Links",
        liabilityLinksText:
            "This website contains links to external third-party websites over whose content we have no influence. The respective provider is always responsible for the content of linked pages.",
        lastUpdated: "Last updated: December 2025",
    },
};

export default function ImpressumPage() {
    const { language } = useLanguage();
    const t = content[language];

    return (
        <div style={{ minHeight: "100vh", background: "#fff" }}>
            <Navbar showAuth={false} />

            <main
                style={{
                    paddingTop: 100,
                    paddingBottom: 60,
                    paddingLeft: 24,
                    paddingRight: 24,
                    maxWidth: 700,
                    margin: "0 auto",
                }}
            >
                <Card className="legal-prose" style={{ borderRadius: 10 }}>
                    <CardContent>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: 24 }}>
                        {t.title}
                    </h1>

                    <h2>{t.aboutTitle}</h2>
                    <p style={{ fontSize: 15 }}>
                        {t.aboutText}
                    </p>

                    <p style={{ fontSize: 15, color: "#64748b" }}>
                        {t.aboutNote}
                    </p>

                    <h2>{t.contactTitle}</h2>
                    <div className="flex flex-col items-start gap-2" style={{ marginBottom: 24 }}>
                        <Button asChild variant="link" style={{ padding: 0, height: "auto" }}>
                            <a href={`mailto:${contactEmail}`}>
                                <Mail size={14} />
                                {contactEmail}
                            </a>
                        </Button>
                        <Button asChild variant="link" style={{ padding: 0, height: "auto" }}>
                            <a href={repoUrl} target="_blank" rel="noreferrer">
                                <Code2 size={14} />
                                {repoUrl.replace(/^https?:\/\//, "")}
                            </a>
                        </Button>
                        {linkedInUrl ? (
                            <Button asChild variant="link" style={{ padding: 0, height: "auto" }}>
                                <a href={linkedInUrl} target="_blank" rel="noreferrer">
                                    <Globe size={14} />
                                    {linkedInUrl.replace(/^https?:\/\//, "")}
                                </a>
                            </Button>
                        ) : null}
                    </div>

                    <h2>{t.liabilityContentTitle}</h2>
                    <p style={{ fontSize: 15 }}>
                        {t.liabilityContentText}
                    </p>

                    <h2>{t.liabilityLinksTitle}</h2>
                    <p style={{ fontSize: 15 }}>
                        {t.liabilityLinksText}
                    </p>

                    <span className="text-muted-foreground" style={{
                            fontSize: 13,
                            marginTop: 24,
                            display: "block",
                        }}>
                        {t.lastUpdated}
                    </span>
                </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
