import {
    Client,
    Account,
    Databases,
    ID,
    OAuthProvider,
    Permission,
    Role,
} from "appwrite";
import { getAppwriteEndpoint, getAppwriteProjectId } from "@/lib/env";

/**
 * Appwrite Cloud Configuration
 * Uses environment variables from .env.local
 * Same backend as mobile app for seamless sync
 */
const APPWRITE_ENDPOINT = getAppwriteEndpoint();
const APPWRITE_PROJECT_ID = getAppwriteProjectId();

/**
 * Initialize Appwrite Client for Browser
 */
const client = new Client();

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

/**
 * Service Instances
 */
export const account = new Account(client);
export const databases = new Databases(client);

/**
 * Get current user ID - returns null if not authenticated
 */
export const getCurrentUserId = async (): Promise<string | null> => {
    try {
        const user = await account.get();
        return user.$id;
    } catch {
        return null;
    }
};

/**
 * Get document permissions for current user
 * Restricts read/write to the creating user
 */
export const getUserPermissions = (userId: string): string[] => {
    return [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
    ];
};

/**
 * Database and Collection IDs - Must match mobile app
 */
export const DATABASE_ID = "rechly-db";

export const COLLECTIONS = {
    USER_COMPANY: "user_company",
    CLIENTS: "clients",
    PRODUCTS: "products",
    INVOICES: "invoices",
    INVOICE_ITEMS: "invoice_items",
} as const;

/**
 * Helper: Generate unique document ID
 */
export const generateId = () => ID.unique();

/**
 * Helper: Check if Appwrite is configured
 */
export const isAppwriteConfigured = (): boolean => {
    return !!(APPWRITE_PROJECT_ID && APPWRITE_ENDPOINT);
};

/**
 * Authentication: Get current user session
 * Returns null if not authenticated
 */
export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch {
        console.log("No active session");
        return null;
    }
};

/**
 * Authentication: Register with email/password
 */
export const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
) => {
    try {
        const user = await account.create(ID.unique(), email, password, name);
        console.log("✓ User registered:", user.$id);
        // Auto-login after registration
        await loginWithEmail(email, password);
        return user;
    } catch (error) {
        console.error("Registration failed:", error);
        throw error;
    }
};

/**
 * Authentication: Login with email/password
 */
export const loginWithEmail = async (email: string, password: string) => {
    try {
        const session = await account.createEmailPasswordSession(
            email,
            password,
        );
        console.log("✓ Logged in:", session.userId);
        return session;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

/**
 * Authentication: Create anonymous session
 */
export const createAnonymousSession = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            console.log("Already authenticated:", currentUser.$id);
            return currentUser;
        }

        console.log("Creating anonymous session...");
        const session = await account.createAnonymousSession();
        console.log("✓ Anonymous session created:", session.userId);
        return session;
    } catch (error) {
        console.error("Failed to create anonymous session:", error);
        throw error;
    }
};

/**
 * Authentication: Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const user = await account.get();
        return !!user;
    } catch {
        return false;
    }
};

/**
 * Authentication: Logout
 */
export const logout = async () => {
    try {
        await account.deleteSession("current");
        console.log("✓ Logged out");
    } catch (error) {
        console.error("Logout error:", error);
    }
};

/**
 * Authentication: Delete user account
 * Requires user to provide password for verification (email users)
 * Note: This deletes the user's identity but user data must be deleted separately
 */
export const deleteAccount = async () => {
    try {
        // Delete all sessions first
        await account.deleteSessions();
        // Delete the user identity (requires updateStatus permission in Appwrite)
        await account.updateStatus();
        console.log("✓ Account deleted");
    } catch (error) {
        console.error("Delete account error:", error);
        throw error;
    }
};

/**
 * Authentication: Login with Google OAuth
 * Redirects to /auth/callback which checks if onboarding is needed
 */
export const loginWithGoogle = () => {
    const successUrl = `${window.location.origin}/auth/callback`;
    const failureUrl = `${window.location.origin}/login`;

    account.createOAuth2Session(
        "google" as OAuthProvider,
        successUrl,
        failureUrl,
    );
};
