import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Standalone output for containerized deployments (Heroku, Docker, etc.)
    output: "standalone",

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
};

export default nextConfig;
