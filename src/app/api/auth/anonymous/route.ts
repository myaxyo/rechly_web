import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, SESSION_COOKIE_NAME } from "@/lib/appwrite-server";
import { AUTH_LIMITS, clientIp, rateLimit } from "@/lib/server/security";

/**
 * POST /api/auth/anonymous
 * Guest login: creates an Appwrite anonymous session server-side and
 * stores its secret in the same httpOnly cookie as email login, so
 * /api/auth/user and every SSR API route authenticate the guest.
 * (A client-SDK-only anonymous session never sets that cookie and
 * every server route answers 401.)
 */
export async function POST(request: NextRequest) {
    try {
        const ip = clientIp(request);
        const limit = rateLimit(
            `auth:anonymous:${ip}`,
            AUTH_LIMITS.anonymous.max,
            AUTH_LIMITS.anonymous.windowMs,
        );
        if (!limit.ok) {
            return NextResponse.json(
                { error: "Too many attempts. Please wait a minute and try again." },
                { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 60) } },
            );
        }

        const { account } = await createAdminClient();
        const session = await account.createAnonymousSession();

        const response = NextResponse.json({ success: true });
        // No maxAge/expires on purpose: a browser-session cookie. Guest
        // access ends when the browser closes, matching the "temporary
        // guest data" promise; the Appwrite session itself expires
        // server-side per project settings.
        response.cookies.set(SESSION_COOKIE_NAME, session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        return response;
    } catch (error) {
        console.error("Anonymous login error:", error);
        return NextResponse.json(
            { error: "Guest login failed" },
            { status: 500 },
        );
    }
}
