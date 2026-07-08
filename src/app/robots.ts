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
                    "/private/",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
