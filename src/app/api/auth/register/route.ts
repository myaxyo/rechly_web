import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, SESSION_COOKIE_NAME } from "@/lib/appwrite-server";
import { ID } from "node-appwrite";

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Email, password, and name are required" },
                { status: 400 }
            );
        }

        const { account } = await createAdminClient();

        // Create user account
        await account.create(ID.unique(), email, password, name);

        // Create session for the new user
        const session = await account.createEmailPasswordSession(email, password);

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
        console.error("Registration error:", error);
        const errorMessage = error instanceof Error ? error.message : "Registration failed";
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        );
    }
}
