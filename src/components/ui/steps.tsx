"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
    title: string;
}

/** Mobile-friendly stepper (horizontal, scrollable on small screens). */
export function Steps({ items, current, className }: { items: StepItem[]; current: number; className?: string }) {
    return (
        <ol className={cn("flex items-start gap-0 overflow-x-auto pb-1", className)} aria-label="Progress">
            {items.map((item, index) => {
                const done = index < current;
                const active = index === current;
                return (
                    <li key={index} className="flex min-w-0 flex-1 items-start last:flex-none">
                        <div className="flex min-w-0 flex-col items-center gap-1.5 px-1 text-center">
                            <span
                                className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                                    done && "border-primary bg-primary text-primary-foreground",
                                    active && "border-primary text-primary",
                                    !done && !active && "border-border text-muted-foreground",
                                )}
                                aria-current={active ? "step" : undefined}
                            >
                                {done ? <Check className="size-4" /> : index + 1}
                            </span>
                            <span className={cn("max-w-28 truncate text-xs sm:text-sm", active ? "font-semibold" : "text-muted-foreground")}>
                                {item.title}
                            </span>
                        </div>
                        {index < items.length - 1 && (
                            <span className={cn("mt-4 h-px min-w-4 flex-1", done ? "bg-primary" : "bg-border")} aria-hidden />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
