import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rechly.de";

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
