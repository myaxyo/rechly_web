import { Client, Account, Databases, OAuthProvider } from "node-appwrite";
import { cookies } from "next/headers";
import {
    getAppwriteEndpoint,
    getAppwriteProjectId,
    getOptionalEnv,
} from "@/lib/env";

/**
 * Appwrite SSR Server Configuration
 * Uses server-side SDK with API key for admin operations
 * Session is stored in httpOnly cookies for security
 */

const APPWRITE_ENDPOINT = getAppwriteEndpoint();
const APPWRITE_PROJECT_ID = getAppwriteProjectId();
const APPWRITE_API_KEY = getOptionalEnv("APPWRITE_API_KEY") || "";

// Database configuration - Must match client-side appwrite.ts
export const DATABASE_ID = "rechly-db";

export const COLLECTIONS = {
    CLIENTS: "clients",
    PRODUCTS: "products",
    INVOICES: "invoices",
    INVOICE_ITEMS: "invoice_items",
    COMPANY_INFO: "user_company",
} as const;

// Cookie name for session storage
export const SESSION_COOKIE_NAME = "appwrite-session";

/**
 * Create Admin Client (with API key)
 * Used for creating sessions and admin operations
 * IMPORTANT: Never share this client between requests
 */
export async function createAdminClient() {
    if (!APPWRITE_API_KEY) {
        throw new Error("APPWRITE_API_KEY is not configured");
    }

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
    };
}

/**
 * Create Session Client (with user session)
 * Used for authenticated requests on behalf of the user
 * IMPORTANT: Never share this client between requests
 */
export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);

    if (!session || !session.value) {
        throw new Error("No session");
    }

    client.setSession(session.value);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
    };
}

/**
 * Get logged in user from session cookie
 * Returns null if not authenticated
 */
export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        return await account.get();
    } catch {
        return null;
    }
}

/**
 * Set session cookie after successful authentication
 */
export async function setSessionCookie(secret: string, expire: string) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(expire),
        path: "/",
    });
}

/**
 * Delete session cookie on logout
 */
export async function deleteSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Sign out - delete session and cookie
 */
export async function signOut() {
    try {
        const { account } = await createSessionClient();
        await account.deleteSession("current");
    } catch (error) {
        console.error("Error deleting session:", error);
    }
    await deleteSessionCookie();
}

/**
 * Login with email/password
 */
export async function loginWithEmailSSR(email: string, password: string) {
    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession(email, password);

    await setSessionCookie(session.secret, session.expire);

    return { success: true, userId: session.userId };
}

/**
 * Register with email/password
 */
export async function registerWithEmailSSR(
    email: string,
    password: string,
    name: string,
) {
    const { account } = await createAdminClient();

    // Create the user
    await account.create("unique()", email, password, name);

    // Create session
    const session = await account.createEmailPasswordSession(email, password);

    await setSessionCookie(session.secret, session.expire);

    return { success: true, userId: session.userId };
}

/**
 * Create anonymous session
 */
export async function createAnonymousSessionSSR() {
    const { account } = await createAdminClient();

    const session = await account.createAnonymousSession();

    await setSessionCookie(session.secret, session.expire);

    return { success: true, userId: session.userId };
}

/**
 * Get OAuth2 redirect URL for Google login
 * Uses server-side token creation to bypass ad blockers
 */
export async function getGoogleOAuthURL(
    successUrl: string,
    failureUrl: string,
) {
    const { account } = await createAdminClient();

    const redirectUrl = await account.createOAuth2Token(
        OAuthProvider.Google,
        successUrl,
        failureUrl,
    );

    return redirectUrl;
}

/**
 * Create session from OAuth2 token
 * Called after OAuth provider redirects back with userId and secret
 */
export async function createSessionFromOAuth(userId: string, secret: string) {
    const { account } = await createAdminClient();

    const session = await account.createSession(userId, secret);

    await setSessionCookie(session.secret, session.expire);

    return { success: true, userId: session.userId };
}

/**
 * Delete account
 */
export async function deleteAccountSSR() {
    try {
        const { account } = await createSessionClient();
        await account.deleteSessions();
        await account.updateStatus();
    } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
    }
    await deleteSessionCookie();
}
