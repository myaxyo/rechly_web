import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
    title: "Cookie-Einstellungen",
    description:
        "Informationen zu technisch notwendigen Cookies, Analyse und Cookie-Einstellungen bei Rechly.",
    path: "/cookies",
});

export default function CookiesLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
