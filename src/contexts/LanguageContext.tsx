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
        "dashboard.home": "Dashboard",
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
        "dashboard.guestWarning": "Gastmodus: Daten nur temporär",
        "dashboard.guestWarningDesc":
            "Melde dich an, um deine Daten dauerhaft zu speichern!",
        "dashboard.registerNow": "Jetzt registrieren",

        // Status
        "status.draft": "Entwurf",
        "status.sent": "Versendet",
        "status.paid": "Bezahlt",
        "status.cancelled": "Storniert",

        // Clients page
        "clients.title": "Kunden",
        "clients.search": "Suchen...",
        "clients.new": "Neuer Kunde",
        "clients.name": "Name",
        "clients.contactPerson": "Kontaktperson",
        "clients.city": "Stadt",
        "clients.email": "E-Mail",
        "clients.phone": "Telefon",
        "clients.actions": "Aktionen",
        "clients.deleteConfirm": "Kunde löschen?",
        "clients.deleteDesc":
            "Diese Aktion kann nicht rückgängig gemacht werden.",
        "clients.delete": "Löschen",
        "clients.cancel": "Abbrechen",
        "clients.updated": "Kunde aktualisiert",
        "clients.created": "Kunde erstellt",
        "clients.deleted": "Kunde gelöscht",
        "clients.saveError": "Fehler beim Speichern",
        "clients.deleteError": "Fehler beim Löschen",
        "clients.editTitle": "Kunde bearbeiten",
        "clients.newTitle": "Neuer Kunde",
        "clients.companyName": "Firmenname",
        "clients.required": "Pflichtfeld",
        "clients.address": "Adresse",
        "clients.streetNumber": "Straße und Hausnummer",
        "clients.addressExtra": "Zusätzliche Adressangaben",
        "clients.postalCode": "PLZ",
        "clients.country": "Land",
        "clients.vatId": "USt-IdNr.",
        "clients.taxNumber": "Steuernummer",
        "clients.leitwegId": "Leitweg-ID",
        "clients.leitwegPlaceholder": "Leitweg-ID für E-Rechnung",
        "clients.save": "Speichern",
        "clients.create": "Erstellen",
        "clients.pagination": "{0}-{1} von {2} Kunden",

        // Products page
        "products.title": "Produkte & Dienstleistungen",
        "products.search": "Suchen...",
        "products.new": "Neues Produkt",
        "products.name": "Name",
        "products.description": "Beschreibung",
        "products.price": "Preis",
        "products.vat": "MwSt.",
        "products.unit": "Einheit",
        "products.actions": "Aktionen",
        "products.deleteConfirm": "Produkt löschen?",
        "products.deleteDesc":
            "Diese Aktion kann nicht rückgängig gemacht werden.",
        "products.delete": "Löschen",
        "products.cancel": "Abbrechen",
        "products.updated": "Produkt aktualisiert",
        "products.created": "Produkt erstellt",
        "products.deleted": "Produkt gelöscht",
        "products.saveError": "Fehler beim Speichern",
        "products.deleteError": "Fehler beim Löschen",
        "products.editTitle": "Produkt bearbeiten",
        "products.newTitle": "Neues Produkt",
        "products.productName": "Produktname",
        "products.required": "Pflichtfeld",
        "products.descPlaceholder":
            "Beschreibung des Produkts oder der Dienstleistung",
        "products.priceLabel": "Preis (€)",
        "products.vatRate": "MwSt.-Satz",
        "products.save": "Speichern",
        "products.create": "Erstellen",
        "products.pagination": "{0}-{1} von {2} Produkten",
        "products.unit.piece": "Stück",
        "products.unit.hour": "Stunde",
        "products.unit.day": "Tag",
        "products.unit.month": "Monat",
        "products.unit.flatRate": "Pauschal",
        "products.unit.kg": "kg",
        "products.unit.m": "m",
        "products.unit.sqm": "m²",
        "products.unit.liter": "Liter",
        "products.vat.standard": "19% (Standard)",
        "products.vat.reduced": "7% (Ermäßigt)",
        "products.vat.exempt": "0% (Steuerfrei)",

        // Settings page
        "settings.title": "Einstellungen",
        "settings.company": "Unternehmen",
        "settings.account": "Konto",
        "settings.saved": "Einstellungen gespeichert",
        "settings.saveError": "Fehler beim Speichern",
        "settings.uploadLogo": "Logo hochladen",
        "settings.removeLogo": "Entfernen",
        "settings.companyName": "Firmenname",
        "settings.legalForm": "Rechtsform",
        "settings.legalFormPlaceholder": "GmbH, UG, Einzelunternehmen, etc.",
        "settings.address": "Adresse",
        "settings.streetNumber": "Straße und Hausnummer",
        "settings.addressExtra": "Gebäude, Etage, etc.",
        "settings.postalCode": "PLZ",
        "settings.city": "Stadt",
        "settings.country": "Land",
        "settings.contact": "Kontakt",
        "settings.email": "E-Mail",
        "settings.phone": "Telefon",
        "settings.website": "Website",
        "settings.taxInfo": "Steuerinformationen",
        "settings.vatId": "USt-IdNr.",
        "settings.taxNumber": "Steuernummer",
        "settings.commercialRegister": "Handelsregisternummer",
        "settings.registryCourt": "Registergericht",
        "settings.managingDirectors": "Geschäftsführer",
        "settings.bankDetails": "Bankverbindung",
        "settings.bankName": "Bank",
        "settings.iban": "IBAN",
        "settings.bic": "BIC",
        "settings.invoiceSettings": "Rechnungseinstellungen",
        "settings.paymentTerms": "Standard-Zahlungsbedingungen",
        "settings.paymentTermsPlaceholder":
            "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
        "settings.save": "Speichern",
        "settings.required": "Pflichtfeld",
        "settings.invalidEmail": "Ungültige E-Mail",
        "settings.imageOnly": "Nur Bilddateien sind erlaubt",
        "settings.imageTooLarge": "Bild muss kleiner als 2MB sein",
        "settings.accountInfo": "Kontoinformationen",
        "settings.accountEmail": "E-Mail:",
        "settings.accountId": "Konto-ID:",
        "settings.guest": "Gast",
        "settings.logout": "Abmelden",
        "settings.logoutDesc":
            "Sie werden von Ihrem Konto abgemeldet und zur Anmeldeseite weitergeleitet.",
        "settings.deleteAccount": "Konto löschen",
        "settings.deleteAccountTitle": "Konto löschen",
        "settings.deleteAccountConfirm":
            "Sind Sie sicher, dass Sie Ihr Konto löschen möchten?",
        "settings.deleteAccountWarning":
            "Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden unwiderruflich gelöscht.",
        "settings.deleteAccountButton": "Ja, Konto löschen",
        "settings.deleteAccountCancel": "Abbrechen",
        "settings.accountDeleted": "Ihr Konto wurde gelöscht",
        "settings.deleteError": "Fehler beim Löschen des Kontos",

        // Invoices page
        "invoices.title": "Rechnungen",
        "invoices.search": "Suchen...",
        "invoices.new": "Neue Rechnung",
        "invoices.number": "Rechnungs-Nr.",
        "invoices.client": "Kunde",
        "invoices.date": "Datum",
        "invoices.dueDate": "Fällig",
        "invoices.amount": "Betrag",
        "invoices.status": "Status",
        "invoices.actions": "Aktionen",
        "invoices.view": "Anzeigen",
        "invoices.edit": "Bearbeiten",
        "invoices.downloadPdf": "PDF herunterladen",
        "invoices.markSent": "Als versendet markieren",
        "invoices.markPaid": "Als bezahlt markieren",
        "invoices.deleteConfirm": "Rechnung löschen?",
        "invoices.deleteDesc":
            "Diese Aktion kann nicht rückgängig gemacht werden.",
        "invoices.delete": "Löschen",
        "invoices.cancel": "Abbrechen",
        "invoices.deleted": "Rechnung gelöscht",
        "invoices.statusUpdated": "Status aktualisiert",
        "invoices.deleteError": "Fehler beim Löschen",
        "invoices.updateError": "Fehler beim Aktualisieren",
        "invoices.total": "Gesamt",
        "invoices.open": "Offen",
        "invoices.overdue": "Überfällig",
        "invoices.loadError": "Fehler beim Laden der Daten",
        "invoices.pagination": "{0}-{1} von {2} Rechnungen",

        // Invoice create page
        "invoiceCreate.title": "Rechnung erstellen",
        "invoiceCreate.selectClient": "Kunde wählen",
        "invoiceCreate.addItems": "Positionen",
        "invoiceCreate.review": "Überprüfen",
        "invoiceCreate.done": "Fertig",
        "invoiceCreate.next": "Weiter",
        "invoiceCreate.back": "Zurück",
        "invoiceCreate.createInvoice": "Rechnung erstellen",
        "invoiceCreate.selectClientTitle": "Kunde auswählen",
        "invoiceCreate.searchClients": "Kunden suchen...",
        "invoiceCreate.noClients": "Keine Kunden gefunden",
        "invoiceCreate.createClient": "Kunde anlegen",
        "invoiceCreate.addLineItems": "Positionen hinzufügen",
        "invoiceCreate.addFromProducts": "Aus Produkten hinzufügen",
        "invoiceCreate.addEmptyLine": "Leere Zeile hinzufügen",
        "invoiceCreate.noItems": "Keine Positionen vorhanden",
        "invoiceCreate.addItemsHint":
            "Fügen Sie Produkte oder Dienstleistungen hinzu",
        "invoiceCreate.invoiceNumber": "Rechnungsnummer",
        "invoiceCreate.invoiceDate": "Rechnungsdatum",
        "invoiceCreate.notes": "Anmerkungen",
        "invoiceCreate.notesPlaceholder":
            "Zusätzliche Hinweise oder Zahlungsinformationen",
        "invoiceCreate.subtotal": "Zwischensumme",
        "invoiceCreate.vat": "MwSt.",
        "invoiceCreate.total": "Gesamt",
        "invoiceCreate.success": "Rechnung erfolgreich erstellt",
        "invoiceCreate.successDesc":
            "Ihre Rechnung wurde erstellt und gespeichert.",
        "invoiceCreate.viewInvoice": "Rechnung anzeigen",
        "invoiceCreate.downloadPdf": "PDF herunterladen",
        "invoiceCreate.createAnother": "Weitere erstellen",
        "invoiceCreate.saveError": "Fehler beim Erstellen der Rechnung",
        "invoiceCreate.description": "Beschreibung",
        "invoiceCreate.quantity": "Menge",
        "invoiceCreate.unitPrice": "Einzelpreis",
        "invoiceCreate.discount": "Rabatt",
        "invoiceCreate.lineTotal": "Gesamt",
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

        // Dashboard navigation
        "dashboard.home": "Dashboard",
        "dashboard.guestWarning": "Guest Mode: Data is temporary only",
        "dashboard.guestWarningDesc": "Log in to save your data permanently!",
        "dashboard.registerNow": "Register now",

        // Status
        "status.draft": "Draft",
        "status.sent": "Sent",
        "status.paid": "Paid",
        "status.cancelled": "Cancelled",

        // Clients page
        "clients.title": "Clients",
        "clients.search": "Search...",
        "clients.new": "New Client",
        "clients.name": "Name",
        "clients.contactPerson": "Contact Person",
        "clients.city": "City",
        "clients.email": "Email",
        "clients.phone": "Phone",
        "clients.actions": "Actions",
        "clients.deleteConfirm": "Delete client?",
        "clients.deleteDesc": "This action cannot be undone.",
        "clients.delete": "Delete",
        "clients.cancel": "Cancel",
        "clients.updated": "Client updated",
        "clients.created": "Client created",
        "clients.deleted": "Client deleted",
        "clients.saveError": "Error saving",
        "clients.deleteError": "Error deleting",
        "clients.editTitle": "Edit Client",
        "clients.newTitle": "New Client",
        "clients.companyName": "Company Name",
        "clients.required": "Required",
        "clients.address": "Address",
        "clients.streetNumber": "Street and Number",
        "clients.addressExtra": "Additional Address",
        "clients.postalCode": "Postal Code",
        "clients.country": "Country",
        "clients.vatId": "VAT ID",
        "clients.taxNumber": "Tax Number",
        "clients.leitwegId": "Leitweg ID",
        "clients.leitwegPlaceholder": "Leitweg ID for e-invoicing",
        "clients.save": "Save",
        "clients.create": "Create",
        "clients.pagination": "{0}-{1} of {2} clients",

        // Products page
        "products.title": "Products & Services",
        "products.search": "Search...",
        "products.new": "New Product",
        "products.name": "Name",
        "products.description": "Description",
        "products.price": "Price",
        "products.vat": "VAT",
        "products.unit": "Unit",
        "products.actions": "Actions",
        "products.deleteConfirm": "Delete product?",
        "products.deleteDesc": "This action cannot be undone.",
        "products.delete": "Delete",
        "products.cancel": "Cancel",
        "products.updated": "Product updated",
        "products.created": "Product created",
        "products.deleted": "Product deleted",
        "products.saveError": "Error saving",
        "products.deleteError": "Error deleting",
        "products.editTitle": "Edit Product",
        "products.newTitle": "New Product",
        "products.productName": "Product Name",
        "products.required": "Required",
        "products.descPlaceholder": "Description of the product or service",
        "products.priceLabel": "Price (€)",
        "products.vatRate": "VAT Rate",
        "products.save": "Save",
        "products.create": "Create",
        "products.pagination": "{0}-{1} of {2} products",
        "products.unit.piece": "Piece",
        "products.unit.hour": "Hour",
        "products.unit.day": "Day",
        "products.unit.month": "Month",
        "products.unit.flatRate": "Flat Rate",
        "products.unit.kg": "kg",
        "products.unit.m": "m",
        "products.unit.sqm": "m²",
        "products.unit.liter": "Liter",
        "products.vat.standard": "19% (Standard)",
        "products.vat.reduced": "7% (Reduced)",
        "products.vat.exempt": "0% (Tax-free)",

        // Settings page
        "settings.title": "Settings",
        "settings.company": "Company",
        "settings.account": "Account",
        "settings.saved": "Settings saved",
        "settings.saveError": "Error saving",
        "settings.uploadLogo": "Upload Logo",
        "settings.removeLogo": "Remove",
        "settings.companyName": "Company Name",
        "settings.legalForm": "Legal Form",
        "settings.legalFormPlaceholder": "GmbH, UG, Sole Proprietor, etc.",
        "settings.address": "Address",
        "settings.streetNumber": "Street and Number",
        "settings.addressExtra": "Building, Floor, etc.",
        "settings.postalCode": "Postal Code",
        "settings.city": "City",
        "settings.country": "Country",
        "settings.contact": "Contact",
        "settings.email": "Email",
        "settings.phone": "Phone",
        "settings.website": "Website",
        "settings.taxInfo": "Tax Information",
        "settings.vatId": "VAT ID",
        "settings.taxNumber": "Tax Number",
        "settings.commercialRegister": "Commercial Register Number",
        "settings.registryCourt": "Registry Court",
        "settings.managingDirectors": "Managing Directors",
        "settings.bankDetails": "Bank Details",
        "settings.bankName": "Bank",
        "settings.iban": "IBAN",
        "settings.bic": "BIC",
        "settings.invoiceSettings": "Invoice Settings",
        "settings.paymentTerms": "Default Payment Terms",
        "settings.paymentTermsPlaceholder":
            "Payable within 14 days without deduction.",
        "settings.save": "Save",
        "settings.required": "Required",
        "settings.invalidEmail": "Invalid email",
        "settings.imageOnly": "Only image files are allowed",
        "settings.imageTooLarge": "Image must be smaller than 2MB",
        "settings.accountInfo": "Account Information",
        "settings.accountEmail": "Email:",
        "settings.accountId": "Account ID:",
        "settings.guest": "Guest",
        "settings.logout": "Log Out",
        "settings.logoutDesc":
            "You will be logged out and redirected to the login page.",
        "settings.deleteAccount": "Delete Account",
        "settings.deleteAccountTitle": "Delete Account",
        "settings.deleteAccountConfirm":
            "Are you sure you want to delete your account?",
        "settings.deleteAccountWarning":
            "This action cannot be undone. All your data will be permanently deleted.",
        "settings.deleteAccountButton": "Yes, delete account",
        "settings.deleteAccountCancel": "Cancel",
        "settings.accountDeleted": "Your account has been deleted",
        "settings.deleteError": "Error deleting account",

        // Invoices page
        "invoices.title": "Invoices",
        "invoices.search": "Search...",
        "invoices.new": "New Invoice",
        "invoices.number": "Invoice No.",
        "invoices.client": "Client",
        "invoices.date": "Date",
        "invoices.dueDate": "Due Date",
        "invoices.amount": "Amount",
        "invoices.status": "Status",
        "invoices.actions": "Actions",
        "invoices.view": "View",
        "invoices.edit": "Edit",
        "invoices.downloadPdf": "Download PDF",
        "invoices.markSent": "Mark as sent",
        "invoices.markPaid": "Mark as paid",
        "invoices.deleteConfirm": "Delete invoice?",
        "invoices.deleteDesc": "This action cannot be undone.",
        "invoices.delete": "Delete",
        "invoices.cancel": "Cancel",
        "invoices.deleted": "Invoice deleted",
        "invoices.statusUpdated": "Status updated",
        "invoices.deleteError": "Error deleting",
        "invoices.updateError": "Error updating",
        "invoices.total": "Total",
        "invoices.open": "Open",
        "invoices.overdue": "Overdue",
        "invoices.loadError": "Error loading data",
        "invoices.pagination": "{0}-{1} of {2} invoices",

        // Invoice create page
        "invoiceCreate.title": "Create Invoice",
        "invoiceCreate.selectClient": "Select Client",
        "invoiceCreate.addItems": "Add Items",
        "invoiceCreate.review": "Review",
        "invoiceCreate.done": "Done",
        "invoiceCreate.next": "Next",
        "invoiceCreate.back": "Back",
        "invoiceCreate.createInvoice": "Create Invoice",
        "invoiceCreate.selectClientTitle": "Select a Client",
        "invoiceCreate.searchClients": "Search clients...",
        "invoiceCreate.noClients": "No clients found",
        "invoiceCreate.createClient": "Create Client",
        "invoiceCreate.addLineItems": "Add Line Items",
        "invoiceCreate.addFromProducts": "Add from Products",
        "invoiceCreate.addEmptyLine": "Add Empty Line",
        "invoiceCreate.noItems": "No items added",
        "invoiceCreate.addItemsHint": "Add products or services to the invoice",
        "invoiceCreate.invoiceNumber": "Invoice Number",
        "invoiceCreate.invoiceDate": "Invoice Date",
        "invoiceCreate.notes": "Notes",
        "invoiceCreate.notesPlaceholder":
            "Additional notes or payment information",
        "invoiceCreate.subtotal": "Subtotal",
        "invoiceCreate.vat": "VAT",
        "invoiceCreate.total": "Total",
        "invoiceCreate.success": "Invoice created successfully",
        "invoiceCreate.successDesc": "Your invoice has been created and saved.",
        "invoiceCreate.viewInvoice": "View Invoice",
        "invoiceCreate.downloadPdf": "Download PDF",
        "invoiceCreate.createAnother": "Create Another",
        "invoiceCreate.saveError": "Error creating invoice",
        "invoiceCreate.description": "Description",
        "invoiceCreate.quantity": "Qty",
        "invoiceCreate.unitPrice": "Unit Price",
        "invoiceCreate.discount": "Discount",
        "invoiceCreate.lineTotal": "Total",
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
