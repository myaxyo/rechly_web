import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
    const currentDate = new Date().toISOString();

    // Define all public pages with their priorities and change frequencies
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
            url: "/login",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        },
        {
            url: "/register",
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.8,
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
        // Add hreflang alternates for multi-language support
        alternates: {
            languages: {
                de: `${siteUrl}${route.url}`,
                en: `${siteUrl}${route.url}`,
            },
        },
    }));
}
