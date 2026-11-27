"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeftRight, Calculator, CalendarDays, CalendarClock, CircleHelp, Clock, FileText,
    FolderKanban, Landmark, LayoutDashboard, Plus, Repeat, Settings, ShoppingBag, Tags, Users, Wallet,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface CommandEntry {
    key: string;
    label: string;
    hint?: string;
    icon: React.ReactNode;
    path: string;
}

export default function CommandPalette({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const { language } = useLanguage();
    const l = (de: string, en: string) => (language === "de" ? de : en);

    const commands: CommandEntry[] = [
        { key: "help", label: l("Hilfe & Anleitungen", "Help (German)"), icon: <CircleHelp />, path: "/hilfe" },
        { key: "new-invoice", label: l("Neue Rechnung erstellen", "Create new invoice"), hint: l("Aktion", "Action"), icon: <Plus />, path: "/dashboard/invoices/create" },
        { key: "new-offer", label: l("Neues Angebot erstellen", "Create new quote"), hint: l("Aktion", "Action"), icon: <Plus />, path: "/dashboard/offers/create" },
        { key: "home", label: l("Übersicht", "Overview"), icon: <LayoutDashboard />, path: "/dashboard" },
        { key: "invoices", label: l("Rechnungen", "Invoices"), icon: <FileText />, path: "/dashboard/invoices" },
        { key: "offers", label: l("Angebote", "Quotes"), icon: <Tags />, path: "/dashboard/offers" },
        { key: "recurring", label: l("Wiederkehrende Rechnungen", "Recurring invoices"), icon: <Repeat />, path: "/dashboard/recurring" },
        { key: "clients", label: l("Kunden", "Clients"), icon: <Users />, path: "/dashboard/clients" },
        { key: "products", label: l("Produkte & Leistungen", "Products & services"), icon: <ShoppingBag />, path: "/dashboard/products" },
        { key: "expenses", label: l("Ausgaben", "Expenses"), icon: <Wallet />, path: "/dashboard/expenses" },
        { key: "bank", label: l("Bank & Abgleich", "Bank & reconciliation"), icon: <Landmark />, path: "/dashboard/bank" },
        { key: "reports", label: l("Berichte & Controlling", "Reports & controlling"), icon: <Calculator />, path: "/dashboard/reports" },
        { key: "calendar", label: l("Kalender & Termine", "Calendar & appointments"), icon: <CalendarDays />, path: "/dashboard/calendar" },
        { key: "bookings", label: l("Buchungen & Zeiten", "Bookings & hours"), icon: <CalendarClock />, path: "/dashboard/termine/buchungen" },
        { key: "workspace", label: l("Projekte & Aufgaben", "Projects & tasks"), icon: <FolderKanban />, path: "/dashboard/workspace" },
        { key: "time", label: l("Zeiterfassung", "Time tracking"), icon: <Clock />, path: "/dashboard/workspace/time" },
        { key: "migration", label: l("Daten-Umzug & Import", "Migration & import"), icon: <ArrowLeftRight />, path: "/dashboard/migration" },
        { key: "settings", label: l("Einstellungen", "Settings"), icon: <Settings />, path: "/dashboard/settings" },
    ];

    const run = (command: CommandEntry) => {
        onClose();
        router.push(command.path);
    };

    return (
        <CommandDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }} title={l("Befehl suchen", "Search command")} description={l("Seite oder Aktion suchen", "Search a page or action")}>
            <CommandInput placeholder={l("Seite oder Aktion suchen …", "Search a page or action …")} aria-label={l("Befehl suchen", "Search command")} />
            <CommandList>
                <CommandEmpty>{l("Nichts gefunden.", "Nothing found.")}</CommandEmpty>
                <CommandGroup>
                    {commands.map((command) => (
                        <CommandItem key={command.key} value={command.label} onSelect={() => run(command)}>
                            <span className="text-primary">{command.icon}</span>
                            <span className="flex-1">{command.label}</span>
                            {command.hint && <Badge variant="secondary" className="text-[11px]">{command.hint}</Badge>}
                            <span className="text-[11px] text-muted-foreground">{command.path.replace("/dashboard", "") || "/"}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
            <div className="flex gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                <span>↑↓ {l("Navigieren", "Navigate")}</span>
                <span>↵ {l("Öffnen", "Open")}</span>
                <span>Esc {l("Schließen", "Close")}</span>
            </div>
        </CommandDialog>
    );
}
