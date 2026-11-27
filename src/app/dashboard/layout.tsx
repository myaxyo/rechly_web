import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardAppearance from "@/components/dashboard/DashboardAppearance";
import { UiModeProvider } from "@/contexts/UiModeContext";
import "./dashboard.css";

export const metadata: Metadata = {
    title: "Dashboard",
    robots: {
        index: false,
        follow: false,
        noarchive: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

export default function DashboardLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <DashboardAppearance>
            <UiModeProvider>
                <DashboardShell>{children}</DashboardShell>
            </UiModeProvider>
        </DashboardAppearance>
    );
}
