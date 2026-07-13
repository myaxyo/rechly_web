import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
    // Use stable dates to signal actual content changes to Google.
    // Update these when page content is meaningfully modified.
    const routes: Array<{
        url: string;
        lastModified: string;
        changeFrequency:
            | "always"
            | "hourly"
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | "never";
        priority: number;
    }> = [
        {
            url: "",
            lastModified: "2026-07-10",
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: "/features",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: "/rechnungssoftware-fuer-freelancer",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: "/rechnungsprogramm-kostenlos",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: "/kleinunternehmer-rechnung",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.88,
        },
        {
            url: "/e-rechnung-software",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.9,
        },
        {
            url: "/rechnung-fuer-kleinunternehmer-erstellen",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.87,
        },
        {
            url: "/lexoffice-alternative",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.87,
        },
        {
            url: "/sevdesk-alternative",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.87,
        },
        {
            url: "/rechnungsvorlage",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.86,
        },
        {
            url: "/zahlungserinnerung-schreiben",
            lastModified: "2026-07-10",
            changeFrequency: "monthly",
            priority: 0.86,
        },
        {
            url: "/impressum",
            lastModified: "2025-12-01",
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: "/datenschutz",
            lastModified: "2025-12-01",
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: "/agb",
            lastModified: "2025-12-01",
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: "/cookies",
            lastModified: "2025-12-01",
            changeFrequency: "yearly",
            priority: 0.2,
        },
    ];

    return routes.map((route) => ({
        url: `${siteUrl}${route.url}`,
        lastModified: route.lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));
}
