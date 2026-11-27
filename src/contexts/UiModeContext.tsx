"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type UiMode = "legacy" | "new";

const STORAGE_KEY = "rechly.ui-mode";
const EVENT_NAME = "rechly-ui-mode";
let memoryMode: UiMode = "legacy";

function getMode(): UiMode {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "new" || saved === "legacy") return saved;
    } catch {}
    return memoryMode;
}

function subscribe(notify: () => void) {
    window.addEventListener("storage", notify);
    window.addEventListener(EVENT_NAME, notify);
    return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener(EVENT_NAME, notify);
    };
}

interface UiModeValue {
    mode: UiMode;
    isNew: boolean;
    setMode: (mode: UiMode) => void;
}

const UiModeContext = createContext<UiModeValue>({ mode: "legacy", isNew: false, setMode: () => {} });

/**
 * Opt-in UI rollout: every user stays on the current ("legacy") Ant Design
 * UI until they explicitly choose "Try new UI". The choice is per-browser,
 * persisted, synced across tabs, and reversible at any time from the
 * dashboard header ("Back to old UI"). Default is always legacy, so the
 * migration never disturbs existing users.
 */
export function UiModeProvider({ children }: { children: ReactNode }) {
    const mode = useSyncExternalStore(subscribe, getMode, () => "legacy" as UiMode);
    const setMode = (next: UiMode) => {
        memoryMode = next;
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
        window.dispatchEvent(new Event(EVENT_NAME));
    };
    return <UiModeContext.Provider value={{ mode, isNew: mode === "new", setMode }}>{children}</UiModeContext.Provider>;
}

export function useUiMode() {
    return useContext(UiModeContext);
}
