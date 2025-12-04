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

        // Auth pages
        "auth.login": "Anmelden",
        "auth.register": "Registrieren",
        "auth.logout": "Abmelden",
        "auth.email": "E-Mail",
        "auth.password": "Passwort",
        "auth.confirmPassword": "Passwort bestätigen",
        "auth.fullName": "Vollständiger Name",
        "auth.loginSuccess": "Erfolgreich angemeldet!",
        "auth.loginFailed": "Anmeldung fehlgeschlagen",
        "auth.registerSuccess": "Registrierung erfolgreich!",
        "auth.registerFailed": "Registrierung fehlgeschlagen",
        "auth.guestSuccess": "Als Gast angemeldet!",
        "auth.guestFailed": "Gastanmeldung fehlgeschlagen",
        "auth.subtitle": "Professionelle Rechnungsverwaltung",
        "auth.createAccount": "Konto erstellen",
        "auth.startWithRechly": "Starten Sie mit Rechly",
        "auth.or": "oder",
        "auth.withGoogle": "Mit Google anmelden",
        "auth.registerWithGoogle": "Mit Google registrieren",
        "auth.asGuest": "Als Gast fortfahren",
        "auth.noAccount": "Noch kein Konto?",
        "auth.hasAccount": "Bereits ein Konto?",
        "auth.signUpNow": "Jetzt registrieren",
        "auth.signInNow": "Jetzt anmelden",
        "auth.emailRequired": "Bitte E-Mail eingeben",
        "auth.emailInvalid": "Ungültige E-Mail-Adresse",
        "auth.passwordRequired": "Bitte Passwort eingeben",
        "auth.passwordMin": "Mindestens 8 Zeichen",
        "auth.confirmPasswordRequired": "Bitte Passwort bestätigen",
        "auth.passwordMismatch": "Die Passwörter stimmen nicht überein",
        "auth.nameRequired": "Bitte Name eingeben",
        "auth.accountExists":
            "Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.",

        // Guest warning
        "guest.warningTitle": "Warnung: Gastzugang",
        "guest.warningMain":
            "Deine Daten werden gelöscht, wenn du den Tab schließt!",
        "guest.warningIntro": "Als Gast kannst du Rechly ausprobieren, aber:",
        "guest.warningPoint1": "Alle Rechnungen und Kundendaten gehen verloren",
        "guest.warningPoint2": "Du kannst deine Daten nicht wiederherstellen",
        "guest.warningPoint3":
            "Du kannst später nicht auf dein Konto zugreifen",
        "guest.warningNote":
            "Für dauerhafte Nutzung empfehlen wir die Registrierung mit E-Mail oder Google.",
        "guest.continue": "Verstanden, fortfahren",
        "guest.cancel": "Abbrechen",

        // Dashboard
        "dashboard.welcome": "Willkommen",
        "dashboard.welcomeDefault": "Willkommen bei Rechly",
        "dashboard.overview":
            "Hier ist Ihre Geschäftsübersicht auf einen Blick",
        "dashboard.invoices": "Rechnungen",
        "dashboard.clients": "Kunden",
        "dashboard.products": "Produkte",
        "dashboard.paid": "Bezahlt",
        "dashboard.revenueOverview": "Umsatzübersicht",
        "dashboard.openAmounts": "Offene Beträge",
        "dashboard.totalPaid": "Gesamt bezahlt",
        "dashboard.drafts": "Entwürfe",
        "dashboard.sent": "Versendet",
        "dashboard.quickActions": "Schnellaktionen",
        "dashboard.newInvoice": "Neue Rechnung",
        "dashboard.manageClients": "Kunden verwalten",
        "dashboard.manageProducts": "Produkte verwalten",
        "dashboard.allInvoices": "Alle Rechnungen",
        "dashboard.settings": "Einstellungen",
        "dashboard.recentInvoices": "Letzte Rechnungen",
        "dashboard.showAll": "Alle anzeigen",
        "dashboard.noInvoices": "Keine Rechnungen vorhanden",
        "dashboard.createFirst": "Erste Rechnung erstellen",
        "dashboard.unknownClient": "Unbekannter Kunde",

        // Status
        "status.draft": "Entwurf",
        "status.sent": "Versendet",
        "status.paid": "Bezahlt",
        "status.cancelled": "Storniert",
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

        // Auth pages
        "auth.login": "Sign In",
        "auth.register": "Sign Up",
        "auth.logout": "Sign Out",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.confirmPassword": "Confirm Password",
        "auth.fullName": "Full Name",
        "auth.loginSuccess": "Successfully signed in!",
        "auth.loginFailed": "Sign in failed",
        "auth.registerSuccess": "Registration successful!",
        "auth.registerFailed": "Registration failed",
        "auth.guestSuccess": "Signed in as guest!",
        "auth.guestFailed": "Guest sign in failed",
        "auth.subtitle": "Professional Invoice Management",
        "auth.createAccount": "Create Account",
        "auth.startWithRechly": "Get started with Rechly",
        "auth.or": "or",
        "auth.withGoogle": "Sign in with Google",
        "auth.registerWithGoogle": "Sign up with Google",
        "auth.asGuest": "Continue as Guest",
        "auth.noAccount": "Don't have an account?",
        "auth.hasAccount": "Already have an account?",
        "auth.signUpNow": "Sign up now",
        "auth.signInNow": "Sign in now",
        "auth.emailRequired": "Please enter your email",
        "auth.emailInvalid": "Invalid email address",
        "auth.passwordRequired": "Please enter your password",
        "auth.passwordMin": "At least 8 characters",
        "auth.confirmPasswordRequired": "Please confirm your password",
        "auth.passwordMismatch": "Passwords do not match",
        "auth.nameRequired": "Please enter your name",
        "auth.accountExists":
            "An account with this email already exists. Please sign in.",

        // Guest warning
        "guest.warningTitle": "Warning: Guest Access",
        "guest.warningMain":
            "Your data will be deleted when you close the tab!",
        "guest.warningIntro": "As a guest you can try Rechly, but:",
        "guest.warningPoint1": "All invoices and client data will be lost",
        "guest.warningPoint2": "You cannot recover your data",
        "guest.warningPoint3": "You cannot access your account later",
        "guest.warningNote":
            "For permanent use, we recommend signing up with email or Google.",
        "guest.continue": "I understand, continue",
        "guest.cancel": "Cancel",

        // Dashboard
        "dashboard.welcome": "Welcome",
        "dashboard.welcomeDefault": "Welcome to Rechly",
        "dashboard.overview": "Here's your business overview at a glance",
        "dashboard.invoices": "Invoices",
        "dashboard.clients": "Clients",
        "dashboard.products": "Products",
        "dashboard.paid": "Paid",
        "dashboard.revenueOverview": "Revenue Overview",
        "dashboard.openAmounts": "Open Amounts",
        "dashboard.totalPaid": "Total Paid",
        "dashboard.drafts": "Drafts",
        "dashboard.sent": "Sent",
        "dashboard.quickActions": "Quick Actions",
        "dashboard.newInvoice": "New Invoice",
        "dashboard.manageClients": "Manage Clients",
        "dashboard.manageProducts": "Manage Products",
        "dashboard.allInvoices": "All Invoices",
        "dashboard.settings": "Settings",
        "dashboard.recentInvoices": "Recent Invoices",
        "dashboard.showAll": "Show all",
        "dashboard.noInvoices": "No invoices yet",
        "dashboard.createFirst": "Create your first invoice",
        "dashboard.unknownClient": "Unknown Client",

        // Status
        "status.draft": "Draft",
        "status.sent": "Sent",
        "status.paid": "Paid",
        "status.cancelled": "Cancelled",
    },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    // Default to German for SEO - German is the primary target market
    const [language, setLanguageState] = useState<Language>("de");

    useEffect(() => {
        // Check for user's previously stored preference
        const stored = localStorage.getItem("language") as Language | null;
        if (stored && (stored === "de" || stored === "en")) {
            setLanguageState(stored);
        }
        // Note: We intentionally default to German and don't auto-detect browser language
        // This ensures German content is served by default for SEO purposes
        // Users can manually switch to English if needed
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
