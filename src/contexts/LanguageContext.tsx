"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "de" | "en";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
    undefined
);

const translations: Record<Language, Record<string, string>> = {
    de: {
        // Navigation
        "nav.login": "Anmelden",
        "nav.register": "Registrieren",
        "nav.features": "Funktionen",
        "nav.github": "GitHub",

        // Hero
        "hero.badge": "Open Source • Kostenlos",
        "hero.title": "Rechnungen erstellen,",
        "hero.titleHighlight": "einfach gemacht.",
        "hero.subtitle":
            "Ein kostenloses Open-Source-Projekt für Freelancer, Selbstständige und kleine Unternehmen. Erstelle rechtskonforme Rechnungen in wenigen Klicks.",
        "hero.cta": "Kostenlos starten",
        "hero.secondary": "Auf GitHub ansehen",

        // About
        "about.badge": "ÜBER DAS PROJEKT",
        "about.title": "Von einem Studenten für alle.",
        "about.description":
            "Rechly ist ein Nebenprojekt, das ich als Student entwickle. Keine versteckten Kosten, keine Premium-Pläne – einfach ein nützliches Tool, das ich selbst gebraucht habe und jetzt mit euch teile.",
        "about.point1": "100% kostenlos & Open Source",
        "about.point2": "DSGVO-konform, Server in Deutschland",
        "about.point3": "Entwickelt mit GitHub Student Pack",
        "about.point4": "Aktiv weiterentwickelt",

        // Features
        "features.title": "Was Rechly kann",
        "features.invoices.title": "Rechnungen erstellen",
        "features.invoices.desc":
            "Professionelle PDF-Rechnungen mit allen Pflichtangaben.",
        "features.clients.title": "Kunden verwalten",
        "features.clients.desc":
            "Speichere Kundendaten und greife schnell darauf zu.",
        "features.sync.title": "Cloud-Sync",
        "features.sync.desc":
            "Deine Daten sind sicher gespeichert und überall verfügbar.",
        "features.mobile.title": "Mobile App",
        "features.mobile.desc": "Native Android-App, iOS folgt bald.",

        // CTA
        "cta.title": "Probier es aus",
        "cta.subtitle":
            "Erstelle dein kostenloses Konto und schreibe deine erste Rechnung.",
        "cta.button": "Jetzt registrieren",
        "cta.note": "Keine Kreditkarte • Keine versteckten Kosten",

        // Footer
        "footer.tagline":
            "Open-Source Rechnungssoftware für Freelancer und kleine Unternehmen.",
        "footer.product": "Produkt",
        "footer.legal": "Rechtliches",
        "footer.language": "Sprache",
        "footer.impressum": "Impressum",
        "footer.privacy": "Datenschutz",
        "footer.terms": "AGB",
        "footer.cookies": "Cookies",
        "footer.copyright": "Open Source Projekt",
        "footer.madeBy": "Entwickelt von einem Studenten in Deutschland",

        // Legal pages
        "legal.backToHome": "Zurück zur Startseite",
    },
    en: {
        // Navigation
        "nav.login": "Sign In",
        "nav.register": "Sign Up",
        "nav.features": "Features",
        "nav.github": "GitHub",

        // Hero
        "hero.badge": "Open Source • Free",
        "hero.title": "Create invoices,",
        "hero.titleHighlight": "made simple.",
        "hero.subtitle":
            "A free open-source project for freelancers, self-employed, and small businesses. Create compliant invoices in just a few clicks.",
        "hero.cta": "Get Started Free",
        "hero.secondary": "View on GitHub",

        // About
        "about.badge": "ABOUT THE PROJECT",
        "about.title": "Built by a student, for everyone.",
        "about.description":
            "Rechly is a side project I'm building as a student. No hidden costs, no premium plans – just a useful tool I needed myself and now share with you.",
        "about.point1": "100% free & Open Source",
        "about.point2": "GDPR compliant, servers in Germany",
        "about.point3": "Built with GitHub Student Pack",
        "about.point4": "Actively maintained",

        // Features
        "features.title": "What Rechly does",
        "features.invoices.title": "Create Invoices",
        "features.invoices.desc":
            "Professional PDF invoices with all required fields.",
        "features.clients.title": "Manage Clients",
        "features.clients.desc": "Store client data and access it quickly.",
        "features.sync.title": "Cloud Sync",
        "features.sync.desc":
            "Your data is securely stored and available everywhere.",
        "features.mobile.title": "Mobile App",
        "features.mobile.desc": "Native Android app, iOS coming soon.",

        // CTA
        "cta.title": "Try it out",
        "cta.subtitle":
            "Create your free account and write your first invoice.",
        "cta.button": "Sign Up Now",
        "cta.note": "No credit card • No hidden costs",

        // Footer
        "footer.tagline":
            "Open-source invoicing software for freelancers and small businesses.",
        "footer.product": "Product",
        "footer.legal": "Legal",
        "footer.language": "Language",
        "footer.impressum": "Imprint",
        "footer.privacy": "Privacy",
        "footer.terms": "Terms",
        "footer.cookies": "Cookies",
        "footer.copyright": "Open Source Project",
        "footer.madeBy": "Built by a student in Germany",

        // Legal pages
        "legal.backToHome": "Back to Home",
    },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [language, setLanguageState] = useState<Language>("de");

    useEffect(() => {
        const stored = localStorage.getItem("language") as Language | null;
        if (stored && (stored === "de" || stored === "en")) {
            setLanguageState(stored);
        } else {
            const browserLang = navigator.language.toLowerCase();
            setLanguageState(browserLang.startsWith("de") ? "de" : "en");
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
