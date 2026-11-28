import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Standalone output for containerized / self-hosted deployments (Docker, bare Node)
    output: "standalone",

    // Keep pdfkit (ZUGFeRD) out of the bundle: it loads its standard fonts
    // (*.afm) from node_modules/pdfkit/js/data at runtime, which are missing
    // once bundled.
    serverExternalPackages: ["pdfkit"],
    outputFileTracingIncludes: {
        "/api/workspace": ["./node_modules/pdfkit/js/data/**", "./public/fonts/liberation/**"],
        "/api/invoices/[id]/zugferd": ["./node_modules/pdfkit/js/data/**", "./public/fonts/liberation/**"],
    },

    // Disable type checking during build (we run it separately)
    typescript: {
        ignoreBuildErrors: false,
    },

    // Use Turbopack (Next.js 16 default)
    turbopack: {
        // Resolve aliases for react-pdf compatibility
        resolveAlias: {
            canvas: { browser: "./empty-module.js" },
        },
    },

    async headers() {
        return [
            {
                // Baseline hardening for every route. CSP is intentionally
                // limited to frame-ancestors until a full script/style policy
                // with nonce plumbing is wired up.
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
                ],
            },
            {
                source: "/buchen/verwalten/:path*",
                headers: [{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow, noarchive"},{key:"Cache-Control",value:"private, no-store"}],
            },
            {
                source: "/dashboard/:path*",
                headers: [
                    {
                        key: "X-Robots-Tag",
                        value: "noindex, nofollow, noarchive",
                    },
                ],
            },
            {
                source: "/:privateRoute(login|register|onboarding|auth)/:path*",
                headers: [
                    {
                        key: "X-Robots-Tag",
                        value: "noindex, nofollow, noarchive",
                    },
                ],
            },
        ];
    },

    // Optimizations
    experimental: {
        optimizePackageImports: [
            "dayjs",
            "lucide-react",
            "radix-ui",
        ],
    },

    async redirects() {
        return [
            // www -> apex (first; query string is preserved by Next.js redirects).
            // Only this exact host matches, so <slug>.rechly.de booking
            // subdomains in src/middleware.ts are unaffected.
            {
                source: "/:path*",
                has: [{ type: "host", value: "www.rechly.de" }],
                destination: "https://rechly.de/:path*",
                statusCode: 301,
            },
            // SEO quick fixes 2026-11: merged Mahnung hub (see docs/SEO.md)
            { source: "/zahlungserinnerung-schreiben", destination: "/tools/mahnung-generator", statusCode: 301 },
            // Short alias URLs (previously rewrites returning 200 copies)
            { source: "/werkzeuge", destination: "/tools", statusCode: 301 },
            { source: "/verzugszinsen-rechner", destination: "/tools/verzugszinsen-rechner", statusCode: 301 },
            { source: "/girocode-generator", destination: "/tools/girocode-generator", statusCode: 301 },
            { source: "/e-rechnung-viewer", destination: "/tools/e-rechnung-viewer", statusCode: 301 },
            { source: "/stundensatz-rechner", destination: "/tools/stundensatz-rechner", statusCode: 301 },
            { source: "/skontorechner", destination: "/tools/skontorechner", statusCode: 301 },
            { source: "/arbeitstage-rechner", destination: "/tools/arbeitstage-rechner", statusCode: 301 },
            { source: "/ust-idnr-pruefen", destination: "/tools/ust-idnr-pruefen", statusCode: 301 },
            { source: "/kleinunternehmer-rechner", destination: "/tools/kleinunternehmer-rechner", statusCode: 301 },
            { source: "/leitweg-id-pruefen", destination: "/tools/leitweg-id-pruefen", statusCode: 301 },
            { source: "/gewerbesteuer-rechner", destination: "/tools/gewerbesteuer-rechner", statusCode: 301 },
            { source: "/bewirtungsbeleg-rechner", destination: "/tools/bewirtungsbeleg-rechner", statusCode: 301 },
            { source: "/impressum-generator", destination: "/tools/impressum-generator", statusCode: 301 },
            { source: "/verpflegungsmehraufwand-rechner", destination: "/tools/verpflegungsmehraufwand-rechner", statusCode: 301 },
            { source: "/kassenbuch-vorlage", destination: "/tools/kassenbuch-vorlage", statusCode: 301 },
            { source: "/bautagebuch-vorlage", destination: "/tools/bautagebuch-vorlage", statusCode: 301 },
            { source: "/steuerkalender-2026", destination: "/tools/steuerkalender-2026", statusCode: 301 },
            { source: "/steuerkalender-2027", destination: "/tools/steuerkalender-2027", statusCode: 301 },
            { source: "/mahnung-generator", destination: "/tools/mahnung-generator", statusCode: 301 },
            { source: "/euer-rechner", destination: "/tools/euer-rechner", statusCode: 301 },
            { source: "/reverse-charge-rechner", destination: "/tools/reverse-charge-rechner", statusCode: 301 },
            { source: "/afa-rechner", destination: "/tools/afa-rechner", statusCode: 301 },
            { source: "/sepa-xml-generator", destination: "/tools/sepa-xml-generator", statusCode: 301 },
            { source: "/rechnungsgenerator", destination: "/tools/rechnungsgenerator", statusCode: 301 },
            { source: "/angebotsgenerator", destination: "/tools/angebotsgenerator", statusCode: 301 },
            { source: "/mehrwertsteuer-rechner", destination: "/tools/mehrwertsteuer-rechner", statusCode: 301 },
            { source: "/quittung-erstellen", destination: "/tools/quittung-erstellen", statusCode: 301 },
            { source: "/lieferschein-generator", destination: "/tools/lieferschein-generator", statusCode: 301 },
            { source: "/stornorechnung-generator", destination: "/tools/stornorechnung-generator", statusCode: 301 },
            { source: "/fahrtkosten-rechner", destination: "/tools/fahrtkosten-rechner", statusCode: 301 },
            { source: "/stundenzettel-generator", destination: "/tools/stundenzettel-generator", statusCode: 301 },
            { source: "/marge-rechner", destination: "/tools/marge-rechner", statusCode: 301 },
        ];
    },
};

export default nextConfig;
