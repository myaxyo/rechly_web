import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/dashboard/",
                    "/onboarding/",
                    "/auth/",
                    "/_next/",
                    "/private/",
                ],
            },
            {
                // Allow Googlebot full access to static assets
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/api/", "/dashboard/", "/onboarding/", "/auth/"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
