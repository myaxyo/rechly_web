import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, SESSION_COOKIE_NAME } from "@/lib/appwrite-server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const { account } = await createAdminClient();

        // Create email session
        const session = await account.createEmailPasswordSession(
            email,
            password
        );

        // Set session cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set(SESSION_COOKIE_NAME, session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Login failed";
        return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
}
