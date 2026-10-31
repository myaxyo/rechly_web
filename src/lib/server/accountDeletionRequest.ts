type User = { $id: string; prefs: Record<string, unknown> };
type Dependencies = {
    authenticate: () => Promise<{ user: User; updatePrefs: (prefs: Record<string, unknown>) => Promise<unknown> }>;
    erase: (userId: string) => Promise<void>;
    mode?: string;
    holds?: string;
    desktop?: boolean;
    allowedOrigin?: string;
};

/** HTTP policy isolated for authorization, retention and failure tests. */
export async function handleAccountDeletion(request: Request, dependencies: Dependencies): Promise<Response> {
    const json = (data: unknown, status: number) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
    if (dependencies.desktop) return json({ code: "LOCAL_PROFILE" }, 409);
    const origin = request.headers.get("origin");
    if ((origin && origin !== (dependencies.allowedOrigin || new URL(request.url).origin)) || request.headers.get("sec-fetch-site") === "cross-site") return json({ code: "INVALID_ORIGIN" }, 403);
    if (request.headers.get("x-rechly-confirm-delete") !== "delete-account") return json({ code: "CONFIRMATION_REQUIRED" }, 400);
    let authenticated;
    try { authenticated = await dependencies.authenticate(); }
    catch { return json({ code: "AUTH_REQUIRED" }, 401); }
    const { user, updatePrefs } = authenticated;
    const holds = (dependencies.holds || "").split(",").map(id => id.trim());
    try {
        if (dependencies.mode !== "erase" || holds.includes(user.$id)) {
            const previous = user.prefs.rechlyDeletionRequest as { requestedAt?: string } | undefined;
            await updatePrefs({ ...user.prefs, rechlyDeletionRequest: {
                status: "pending_review", requestedAt: previous?.requestedAt || new Date().toISOString(),
            } });
            return json({ status: "requested" }, 202);
        }
        await dependencies.erase(user.$id);
        return json({ status: "deleted", success: true }, 200);
    } catch (error) {
        const failure = error as { code?: number; type?: string };
        console.error("Account deletion failed", { code: failure.code, type: failure.type });
        return json({ code: "DELETION_FAILED" }, 503);
    }
}
