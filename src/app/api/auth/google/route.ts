import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthURL } from "@/lib/appwrite-server";

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow using server-side token creation
 * This bypasses ad blockers since the redirect happens server-side
 */
export async function GET(request: NextRequest) {
    try {
        const origin = request.nextUrl.origin;
        const successUrl = `${origin}/api/auth/callback`;
        const failureUrl = `${origin}/login?error=oauth_failed`;

        const redirectUrl = await getGoogleOAuthURL(successUrl, failureUrl);

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("OAuth initiation error:", error);
        return NextResponse.redirect(
            new URL("/login?error=oauth_init_failed", request.url)
        );
    }
}
