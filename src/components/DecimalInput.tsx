"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { parseDecimalInput } from "@/lib/decimalInput";
import { cn } from "@/lib/utils";

export interface DecimalInputProps {
    value?: number | null;
    onChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    placeholder?: string;
    disabled?: boolean;
    addonAfter?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    id?: string;
}

/** Locale-aware decimal input (comma and dot) built on the shadcn/ui input styling. */
export default function DecimalInput({ value, onChange, min, max, precision, placeholder, disabled, addonAfter, style, className, id }: DecimalInputProps) {
    const { language } = useLanguage();
    const separator = language === "de" ? "," : ".";
    const format = (v: number | null | undefined) => {
        if (v === null || v === undefined || Number.isNaN(v)) return "";
        const text = precision !== undefined ? v.toFixed(precision) : String(v);
        return separator === "," ? text.replace(".", ",") : text;
    };
    const [text, setText] = useState(() => format(value));
    const [focused, setFocused] = useState(false);

    useEffect(() => { if (!focused) setText(format(value)); }, [value, focused]); // eslint-disable-line react-hooks/exhaustive-deps

    const commit = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) { onChange?.(null); return; }
        const parsed = parseDecimalInput(trimmed);
        if (Number.isNaN(parsed)) { onChange?.(null); return; }
        const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
        onChange?.(clamped);
    };

    const input = (
        <input
            id={id}
            type="text"
            inputMode="decimal"
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
            onBlur={() => { setFocused(false); setText(format(value)); }}
            style={addonAfter ? undefined : style}
            className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
        />
    );

    if (!addonAfter) return input;
    return (
        <div className="flex" style={style}>
            <div className="min-w-0 flex-1 [&>input]:rounded-r-none">{input}</div>
            <span className="flex h-9 shrink-0 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">{addonAfter}</span>
        </div>
    );
}
