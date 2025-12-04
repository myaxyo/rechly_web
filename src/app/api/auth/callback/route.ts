import { NextRequest, NextResponse } from "next/server";
import {
    createSessionFromOAuth,
    createSessionClient,
} from "@/lib/appwrite-server";

/**
 * GET /api/auth/callback
 * Handles OAuth callback - receives userId and secret from Appwrite
 * Creates session cookie and redirects to appropriate page
 */
export async function GET(request: NextRequest) {
    try {
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
                new URL(
                    `/login?error=${encodeURIComponent(error)}`,
                    request.url
                )
            );
        }

        // Validate required params
        if (!userId || !secret) {
            console.error("Missing userId or secret in callback");
            return NextResponse.redirect(
                new URL("/login?error=missing_params", request.url)
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
            return NextResponse.redirect(
                new URL("/auth/callback?from=ssr", request.url)
            );
        } catch (sessionError) {
            console.error("Session verification error:", sessionError);
            return NextResponse.redirect(
                new URL("/auth/callback?from=ssr", request.url)
            );
        }
    } catch (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
            new URL("/login?error=session_creation_failed", request.url)
        );
    }
}
