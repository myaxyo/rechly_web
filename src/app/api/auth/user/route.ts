import { NextResponse } from "next/server";
import { getLoggedInUser } from "@/lib/appwrite-server";

/**
 * GET /api/auth/user
 * Returns the current logged-in user from SSR session cookie
 */
export async function GET() {
    try {
        const user = await getLoggedInUser();

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error getting user:", error);
        return NextResponse.json(
            { error: "Failed to get user" },
            { status: 500 }
        );
    }
}
