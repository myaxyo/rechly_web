"use client";

import DashboardShellNew from "@/components/dashboard/DashboardShellNew";

/**
 * The dashboard shell (shadcn/ui). During the migration this component
 * switched between the legacy Ant Design shell and the new shell based
 * on the per-user opt-in (UiModeContext); since the cutover the new
 * shell is the only shell — see docs/SHADCN_MIGRATION.md.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
    return <DashboardShellNew>{children}</DashboardShellNew>;
}
