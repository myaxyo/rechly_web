import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createSessionClient, SESSION_COOKIE_NAME } from "@/lib/appwrite-server";
import { eraseAccountData } from "@/lib/server/accountDeletion";
import { handleAccountDeletion } from "@/lib/server/accountDeletionRequest";
import { getSiteUrl } from "@/lib/env";

export async function DELETE(request: NextRequest) {
    const result = await handleAccountDeletion(request, {
        desktop: process.env.RECHLY_DESKTOP === "1",
        allowedOrigin: process.env.NODE_ENV === "production" ? new URL(getSiteUrl()).origin : request.nextUrl.origin,
        mode: process.env.ACCOUNT_DELETION_MODE,
        holds: process.env.ACCOUNT_DELETION_HOLD_USER_IDS,
        authenticate: async () => {
            const { account } = await createSessionClient();
            const user = await account.get();
            return { user, updatePrefs: (prefs) => account.updatePrefs(prefs) };
        },
        erase: async userId => eraseAccountData(await createAdminClient(), userId),
    });
    const response = new NextResponse(result.body, { status: result.status, headers: result.headers });
    if (result.status === 200) {
        response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0 });
    }
    return response;
}
