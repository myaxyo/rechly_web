import { NextRequest, NextResponse } from "next/server";
import { type Users } from "node-appwrite";
import { createAdminClient, createSessionClient, SESSION_COOKIE_NAME } from "@/lib/appwrite-server";
import { eraseAccountData } from "@/lib/server/accountDeletion";
import { handleAccountDeletion } from "@/lib/server/accountDeletionRequest";
import { getSiteUrl } from "@/lib/env";

export async function DELETE(request: NextRequest) {
    let sessionClient: Awaited<ReturnType<typeof createSessionClient>> | undefined;
    const result = await handleAccountDeletion(request, {
        desktop: process.env.RECHLY_DESKTOP === "1",
        allowedOrigin: process.env.NODE_ENV === "production" ? new URL(getSiteUrl()).origin : request.nextUrl.origin,
        authenticate: async () => {
            sessionClient = await createSessionClient();
            const user = await sessionClient.account.get();
            return { user, updatePrefs: (prefs) => sessionClient!.account.updatePrefs(prefs) };
        },
        erase: async userId => {
            const fallback = sessionClient || (await createSessionClient());
            let admin: Awaited<ReturnType<typeof createAdminClient>>;
            try {
                admin = await createAdminClient();
            } catch {
                const scopeError = () => Promise.reject(Object.assign(new Error("Missing admin key"), { type: "general_unauthorized_scope" }));
                admin = {
                    account: fallback.account,
                    databases: fallback.databases,
                    storage: fallback.storage,
                    users: { get: scopeError, delete: scopeError } as unknown as Users,
                };
            }
            await eraseAccountData(
                {
                    databases: admin.databases,
                    storage: admin.storage,
                    users: admin.users,
                    sessionFallback: fallback,
                },
                userId,
            );
        },
    });
    const response = new NextResponse(result.body, { status: result.status, headers: result.headers });
    if (result.status === 200) {
        response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0 });
    }
    return response;
}
