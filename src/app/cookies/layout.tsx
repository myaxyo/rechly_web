import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cookie-Einstellungen",
    description:
        "Informationen zu technisch notwendigen Cookies und Cookie-Einstellungen bei Rechly.",
    alternates: {
        canonical: "/cookies",
    },
};

export default function CookiesLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
