import { NextResponse } from "next/server";
import { signOut } from "@/lib/appwrite-server";

/**
 * POST /api/auth/logout
 * Clears the SSR session cookie
 */
export async function POST() {
    try {
        await signOut();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        // Still return success - we want to clear the cookie even if session deletion fails
        return NextResponse.json({ success: true });
    }
}
