import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
    const currentDate = new Date().toISOString();

    const routes = [
        {
            url: "",
            lastModified: currentDate,
            changeFrequency: "weekly" as const,
            priority: 1.0,
        },
        {
            url: "/features",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.9,
        },
        {
            url: "/rechnungssoftware-fuer-freelancer",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.9,
        },
        {
            url: "/kleinunternehmer-rechnung",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.88,
        },
        {
            url: "/e-rechnung-software",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.88,
        },
        {
            url: "/lexoffice-alternative",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.87,
        },
        {
            url: "/sevdesk-alternative",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.87,
        },
        {
            url: "/rechnungsprogramm-kostenlos",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.89,
        },
        {
            url: "/rechnungsvorlage",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.86,
        },
        {
            url: "/zahlungserinnerung-schreiben",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.86,
        },
        {
            url: "/rechnung-fuer-kleinunternehmer-erstellen",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.86,
        },
        {
            url: "/impressum",
            lastModified: currentDate,
            changeFrequency: "yearly" as const,
            priority: 0.3,
        },
        {
            url: "/datenschutz",
            lastModified: currentDate,
            changeFrequency: "yearly" as const,
            priority: 0.3,
        },
        {
            url: "/agb",
            lastModified: currentDate,
            changeFrequency: "yearly" as const,
            priority: 0.3,
        },
        {
            url: "/cookies",
            lastModified: currentDate,
            changeFrequency: "yearly" as const,
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
