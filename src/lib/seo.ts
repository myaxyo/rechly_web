import type { Metadata } from "next";
import { getSiteUrl, getTwitterHandle } from "@/lib/env";

const siteUrl = getSiteUrl();
const socialImage = `${siteUrl}/opengraph-image`;

interface PageMetadataOptions {
    title: string;
    description: string;
    path: string;
    type?: "website" | "article";
    noIndex?: boolean;
}

export function createPageMetadata({
    title,
    description,
    path,
    type = "website",
    noIndex = false,
}: PageMetadataOptions): Metadata {
    const canonicalPath = path === "/" ? "/" : path.replace(/\/$/, "");
    const canonicalUrl = `${siteUrl}${canonicalPath === "/" ? "" : canonicalPath}`;
    const brandedTitle = title.includes("Rechly") ? title : `${title} | Rechly`;

    return {
        title: { absolute: brandedTitle },
        description,
        alternates: {
            canonical: canonicalPath,
            languages: {
                de: canonicalPath,
                "x-default": canonicalPath,
            },
        },
        openGraph: {
            type,
            locale: "de_DE",
            url: canonicalUrl,
            siteName: "Rechly",
            title: brandedTitle,
            description,
            images: [
                {
                    url: socialImage,
                    width: 1200,
                    height: 630,
                    alt: "Rechly – Open-Source Rechnungssoftware für Deutschland",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: brandedTitle,
            description,
            images: [socialImage],
            creator: getTwitterHandle(),
        },
        robots: noIndex
            ? { index: false, follow: false, noarchive: true }
            : {
                  index: true,
                  follow: true,
                  googleBot: {
                      index: true,
                      follow: true,
                      "max-video-preview": -1,
                      "max-image-preview": "large",
                      "max-snippet": -1,
                  },
              },
    };
}
