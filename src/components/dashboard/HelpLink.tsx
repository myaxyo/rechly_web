"use client";
import { CircleHelp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/** A new tab keeps the current form and its unsaved inputs in place. */
export default function HelpLink({ href, label }: { href: string; label: string }) {
    const { language } = useLanguage();
    const text = language === "de" ? label : "Help guide (German)";
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${text} (${language === "de" ? "öffnet einen neuen Tab" : "opens in a new tab"})`}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline"
        >
            <CircleHelp className="size-4" /> {text} <span aria-hidden="true">↗</span>
        </a>
    );
}
