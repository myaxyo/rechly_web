import { NextRequest, NextResponse } from "next/server";
import {
    createSessionFromOAuth,
    createSessionClient,
} from "@/lib/appwrite-server";

/**
 * Get the actual origin (handles proxies/load balancers)
 */
function getOrigin(request: NextRequest): string {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host");

    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    } else if (host && !host.includes("localhost")) {
        return `https://${host}`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    return request.nextUrl.origin;
}

/**
 * GET /api/auth/callback
 * Handles OAuth callback - receives userId and secret from Appwrite
 * Creates session cookie and redirects to appropriate page
 */
export async function GET(request: NextRequest) {
    try {
        const origin = getOrigin(request);
        console.log("OAuth callback origin:", origin);

        const { searchParams } = request.nextUrl;
        const userId = searchParams.get("userId");
        const secret = searchParams.get("secret");
        const error = searchParams.get("error");

        console.log("OAuth callback received:", {
            userId: !!userId,
            secret: !!secret,
            error,
        });

        // Handle OAuth error
        if (error) {
            console.error("OAuth error from provider:", error);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(error)}`
            );
        }

        // Validate required params
        if (!userId || !secret) {
            console.error("Missing userId or secret in callback");
            return NextResponse.redirect(
                `${origin}/login?error=missing_params`
            );
        }

        // Create session from OAuth token
        await createSessionFromOAuth(userId, secret);
        console.log("Session created for user:", userId);

        // Check if user has company info (to determine onboarding)
        try {
            const { account } = await createSessionClient();
            const user = await account.get();

            // Get user preferences or check company info
            // For now, redirect to callback page which handles this check
            console.log("User authenticated:", user.$id);

            // Redirect to the client-side callback to check onboarding status
            return NextResponse.redirect(`${origin}/auth/callback?from=ssr`);
        } catch (sessionError) {
            console.error("Session verification error:", sessionError);
            return NextResponse.redirect(`${origin}/auth/callback?from=ssr`);
        }
    } catch (error) {
        console.error("OAuth callback error:", error);
        const origin = getOrigin(request);
        return NextResponse.redirect(
            `${origin}/login?error=session_creation_failed`
        );
    }
}
