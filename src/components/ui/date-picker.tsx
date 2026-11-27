"use client";

import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
    value?: Dayjs | null;
    onChange?: (date: Dayjs | null) => void;
    format?: string;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
    className?: string;
    style?: React.CSSProperties;
    size?: "small" | "middle" | "large";
}

/** shadcn/ui date picker with the dayjs value contract the app already uses. */
export function DatePicker({ value, onChange, format = "DD.MM.YYYY", placeholder = "Datum wählen", disabled, className, style }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" disabled={disabled} style={style}
                    className={cn("h-9 w-full justify-start px-3 font-normal", !value && "text-muted-foreground", className)}>
                    <CalendarIcon className="mr-2 size-4 shrink-0" />
                    {value ? value.format(format) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={value ? value.toDate() : undefined}
                    onSelect={(d) => { onChange?.(d ? dayjs(d) : null); setOpen(false); }} autoFocus />
            </PopoverContent>
        </Popover>
    );
}

export interface DateRangePickerProps {
    value?: [Dayjs | null, Dayjs | null] | null;
    onChange?: (range: [Dayjs | null, Dayjs | null] | null) => void;
    format?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    size?: "small" | "middle" | "large";
}

export function DateRangePicker({ value, onChange, format = "DD.MM.YYYY", disabled, className, style }: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);
    const from = value?.[0] ?? undefined;
    const to = value?.[1] ?? undefined;
    const label = from && to ? `${from.format(format)} – ${to.format(format)}` : from ? `${from.format(format)} – …` : "Zeitraum wählen";
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" disabled={disabled} style={style}
                    className={cn("h-9 w-full justify-start px-3 font-normal", !from && "text-muted-foreground", className)}>
                    <CalendarIcon className="mr-2 size-4 shrink-0" />
                    {label}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" numberOfMonths={1}
                    selected={{ from: from?.toDate(), to: to?.toDate() }}
                    onSelect={(r) => {
                        onChange?.([r?.from ? dayjs(r.from) : null, r?.to ? dayjs(r.to) : null]);
                        if (r?.from && r?.to) setOpen(false);
                    }} autoFocus />
            </PopoverContent>
        </Popover>
    );
}
