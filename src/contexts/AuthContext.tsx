"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Models } from "appwrite";
import {
    logout as appwriteLogout,
    loginWithGoogle,
    deleteAccount as appwriteDeleteAccount,
} from "@/lib/appwrite";
import { clearAllCaches } from "@/store";
import { isDesktopRuntime } from "@/lib/runtime";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    isAnonymous: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<"deleted">;
    loginAnonymously: () => Promise<void>;
    googleLogin: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    // Guest lifetime is the browser session: /api/auth/anonymous sets
    // a session cookie (no maxAge), so closing the browser ends guest
    // access. There is deliberately no storage-flag bookkeeping here —
    // the previous "guestSession" flag was set by loginAnonymously
    // itself and an effect keyed on isAnonymous then logged the guest
    // out immediately, bouncing every guest back to /login.

    const checkAuth = async () => {
        try {
            // Use SSR session check via API route (avoids client-side Appwrite 401)
            const response = await fetch("/api/auth/user");
            if (response.ok) {
                const currentUser = await response.json();
                if (currentUser) {
                    setUser(currentUser);
                    setIsAnonymous(!currentUser.email);
                } else {
                    setUser(null);
                    setIsAnonymous(false);
                }
            } else {
                setUser(null);
                setIsAnonymous(false);
            }
        } catch {
            setUser(null);
            setIsAnonymous(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            // Clear cached data from previous session
            clearAllCaches();

            // Use SSR login API to set HTTP-only session cookie
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Login failed");
            }

            // Fetch user from SSR session
            const userResponse = await fetch("/api/auth/user");
            if (userResponse.ok) {
                const currentUser = await userResponse.json();
                setUser(currentUser);
            }
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string) => {
        setLoading(true);
        try {
            // Use SSR register API to set HTTP-only session cookie
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Registration failed");
            }

            // Fetch user from SSR session
            const userResponse = await fetch("/api/auth/user");
            if (userResponse.ok) {
                const currentUser = await userResponse.json();
                setUser(currentUser);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            // Logout from client-side Appwrite
            if (!isDesktopRuntime) {
                await appwriteLogout();
            }

            // Also clear SSR session cookie
            try {
                await fetch("/api/auth/logout", { method: "POST" });
            } catch {
                // Ignore SSR logout errors
            }

            setUser(null);
            setIsAnonymous(false);
            // Clear all cached data
            clearAllCaches();
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        if (isDesktopRuntime) {
            throw new Error(
                "Local profile deletion is not available in this desktop preview",
            );
        }
        const result = await appwriteDeleteAccount();
        setUser(null);
        setIsAnonymous(false);
        clearAllCaches();
        return result;
    };

    const loginAnonymously = async () => {
        setLoading(true);
        try {
            // Clear cached data from previous session
            clearAllCaches();

            if (!isDesktopRuntime) {
                // SSR anonymous login: sets the httpOnly session cookie
                // that /api/auth/user and all API routes authenticate
                // with. A client-SDK-only anonymous session leaves
                // every server route at 401.
                const response = await fetch("/api/auth/anonymous", {
                    method: "POST",
                });
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error || "Guest login failed");
                }
            }

            const userResponse = await fetch("/api/auth/user");
            if (!userResponse.ok) {
                throw new Error(
                    isDesktopRuntime
                        ? "Local profile is unavailable"
                        : "Guest login failed",
                );
            }
            const currentUser = await userResponse.json();
            setUser(currentUser);
            setIsAnonymous(true);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        await checkAuth();
    };

    const googleLogin = () => {
        if (isDesktopRuntime) return;
        loginWithGoogle();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAnonymous,
                login,
                register,
                logout,
                deleteAccount,
                loginAnonymously,
                googleLogin,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
