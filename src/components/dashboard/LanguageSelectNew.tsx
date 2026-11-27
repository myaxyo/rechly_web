"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** shadcn/ui language switcher for the new dashboard shell. */
export default function LanguageSelectNew() {
    const { language, setLanguage } = useLanguage();
    return (
        <Select value={language} onValueChange={(v) => setLanguage(v as "de" | "en")}>
            <SelectTrigger className="h-9 w-[92px]" aria-label="Language">
                <Globe className="size-4 shrink-0" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="en">EN</SelectItem>
            </SelectContent>
        </Select>
    );
}
