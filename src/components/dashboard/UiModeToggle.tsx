"use client";

import { Button as AntdButton, Tooltip as AntdTooltip } from "antd";
import { Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUiMode } from "@/contexts/UiModeContext";
import { useLanguage } from "@/contexts/LanguageContext";

/** Legacy (Ant Design) header action: invites the user to preview the new UI. */
export function TryNewUiButton({ compact = false }: { compact?: boolean }) {
    const { setMode } = useUiMode();
    const { language } = useLanguage();
    const label = language === "de" ? "Neue UI testen" : "Try new UI";
    const button = (
        <AntdButton
            type="default"
            icon={<Sparkles size={16} />}
            onClick={() => {
                setMode("new");
                toast.success(language === "de" ? "Willkommen in der neuen UI" : "Welcome to the new UI", {
                    description: language === "de"
                        ? "Du kannst jederzeit über „Zur alten UI“ im Header zurückwechseln."
                        : "You can switch back any time with “Back to old UI” in the header.",
                });
            }}
            style={{ borderColor: "#2855d9", color: "#2855d9", fontWeight: 600 }}
        >
            {compact ? null : label}
        </AntdButton>
    );
    return compact ? <AntdTooltip title={label}>{button}</AntdTooltip> : button;
}

/** New (shadcn/ui) header action: always-visible way back to the legacy UI. */
export function BackToOldUiButton({ compact = false }: { compact?: boolean }) {
    const { setMode } = useUiMode();
    const { language } = useLanguage();
    const label = language === "de" ? "Zur alten UI" : "Back to old UI";
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
                setMode("legacy");
                toast.success(language === "de" ? "Zurück in der bisherigen UI" : "Back in the classic UI", {
                    description: language === "de"
                        ? "Über „Neue UI testen“ kannst du jederzeit wieder wechseln."
                        : "Use “Try new UI” any time to switch again.",
                });
            }}
            className="gap-1.5"
            title={label}
        >
            <Undo2 className="size-4" />
            {!compact && <span>{label}</span>}
        </Button>
    );
}

/** Small "Beta" marker shown in the new UI so users know it is a preview. */
export function NewUiBadge() {
    const { language } = useLanguage();
    return <Badge variant="secondary" className="font-semibold">{language === "de" ? "Neue UI · Beta" : "New UI · Beta"}</Badge>;
}
