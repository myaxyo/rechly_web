type User = { $id: string; prefs: Record<string, unknown> };
type Dependencies = {
    authenticate: () => Promise<{ user: User; updatePrefs?: (prefs: Record<string, unknown>) => Promise<unknown> }>;
    erase: (userId: string) => Promise<void>;
    desktop?: boolean;
    allowedOrigin?: string;
};

/** HTTP policy for self-service account and data deletion. */
export async function handleAccountDeletion(request: Request, dependencies: Dependencies): Promise<Response> {
    const json = (data: unknown, status: number) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
    if (dependencies.desktop) return json({ code: "LOCAL_PROFILE" }, 409);

    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    const allowedOrigins = new Set([requestOrigin]);
    if (dependencies.allowedOrigin) {
        allowedOrigins.add(dependencies.allowedOrigin);
        try {
            const parsed = new URL(dependencies.allowedOrigin);
            const port = parsed.port ? `:${parsed.port}` : "";
            if (parsed.hostname.startsWith("www.")) {
                allowedOrigins.add(`${parsed.protocol}//${parsed.hostname.slice(4)}${port}`);
            } else {
                allowedOrigins.add(`${parsed.protocol}//www.${parsed.hostname}${port}`);
            }
        } catch {
            // Ignore malformed allowedOrigin
        }
    }

    if ((origin && !allowedOrigins.has(origin)) || request.headers.get("sec-fetch-site") === "cross-site") {
        return json({ code: "INVALID_ORIGIN" }, 403);
    }
    if (request.headers.get("x-rechly-confirm-delete") !== "delete-account") {
        return json({ code: "CONFIRMATION_REQUIRED" }, 400);
    }

    let authenticated;
    try {
        authenticated = await dependencies.authenticate();
    } catch {
        return json({ code: "AUTH_REQUIRED" }, 401);
    }

    try {
        await dependencies.erase(authenticated.user.$id);
        return json({ status: "deleted", success: true }, 200);
    } catch (error) {
        const failure = error as { code?: number; type?: string };
        console.error("Account deletion failed", { code: failure.code, type: failure.type });
        return json({ code: "DELETION_FAILED" }, 503);
    }
}
