"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Select as UiSelect, SelectContent as UiSelectContent, SelectItem as UiSelectItem,
    SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue,
} from "@/components/ui/select";

type Appearance = "light" | "dark" | "system";
let memoryAppearance: Appearance = "light";
function getAppearance(): Appearance {
    try {
        const saved = localStorage.getItem("rechly.dashboard.appearance");
        if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch {}
    return memoryAppearance;
}
function subscribeAppearance(notify: () => void) {
    window.addEventListener("storage", notify);
    window.addEventListener("rechly-appearance", notify);
    return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener("rechly-appearance", notify);
    };
}
function subscribeSystem(notify: () => void) {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", notify);
    return () => query.removeEventListener("change", notify);
}
const AppearanceContext = createContext<{
    appearance: Appearance;
    change: (value: Appearance) => void;
}>({ appearance: "light", change: () => {} });

export default function DashboardAppearance({ children }: { children: React.ReactNode }) {
    const appearance = useSyncExternalStore(subscribeAppearance, getAppearance, () => "light" as Appearance);
    const systemDark = useSyncExternalStore(subscribeSystem, () => window.matchMedia("(prefers-color-scheme: dark)").matches, () => false);
    const dark = appearance === "dark" || (appearance === "system" && systemDark);
    const change = (value: Appearance) => {
        memoryAppearance = value;
        try { localStorage.setItem("rechly.dashboard.appearance", value); } catch {}
        window.dispatchEvent(new Event("rechly-appearance"));
    };
    return (
        <AppearanceContext.Provider value={{ appearance, change }}>
            <div className={`dashboard-appearance${dark ? " dark" : ""}`} data-appearance={dark ? "dark" : "light"}
                style={{ minHeight: "100vh", colorScheme: dark ? "dark" : "light" }}>
                {children}
            </div>
        </AppearanceContext.Provider>
    );
}

/** Appearance (light/dark/system) switcher for the dashboard header. */
export function AppearanceSelect() {
    const { appearance, change } = useContext(AppearanceContext);
    const { t } = useLanguage();
    return (
        <UiSelect value={appearance} onValueChange={(v) => change(v as Appearance)}>
            <UiSelectTrigger className="h-9 w-[118px]" aria-label={t("appearance.label")}>
                <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
                <UiSelectItem value="light">{t("appearance.light")}</UiSelectItem>
                <UiSelectItem value="dark">{t("appearance.dark")}</UiSelectItem>
                <UiSelectItem value="system">{t("appearance.system")}</UiSelectItem>
            </UiSelectContent>
        </UiSelect>
    );
}
