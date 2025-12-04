"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Models } from "appwrite";
import {
    getCurrentUser,
    loginWithEmail,
    registerWithEmail,
    logout as appwriteLogout,
    loginWithGoogle,
    createAnonymousSession,
    deleteAccount as appwriteDeleteAccount,
} from "@/lib/appwrite";
import { useClientStore, useProductStore, useInvoiceStore } from "@/store";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    isAnonymous: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    loginAnonymously: () => Promise<void>;
    googleLogin: () => void;
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

    // Auto-logout anonymous users when tab closes
    useEffect(() => {
        if (!isAnonymous || !user) return;

        const handleBeforeUnload = async () => {
            // Mark session for cleanup
            sessionStorage.setItem("guestSession", "true");
        };

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "hidden" && isAnonymous) {
                // Store timestamp when tab becomes hidden
                sessionStorage.setItem("guestHiddenAt", Date.now().toString());
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [isAnonymous, user]);

    // Check if returning from a closed tab (guest session should be cleared)
    useEffect(() => {
        const wasGuest = sessionStorage.getItem("guestSession");
        if (wasGuest && isAnonymous) {
            // Clear guest session on page load if it was a guest
            sessionStorage.removeItem("guestSession");
            sessionStorage.removeItem("guestHiddenAt");
            logout();
        }
    }, []);

    const checkAuth = async () => {
        try {
            // First try to get user from client-side Appwrite SDK
            let currentUser = await getCurrentUser();

            // If no client-side session, check for SSR session
            if (!currentUser) {
                try {
                    const response = await fetch("/api/auth/user");
                    if (response.ok) {
                        currentUser = await response.json();
                        console.log("Found SSR session:", currentUser?.$id);
                    }
                } catch (ssrError) {
                    console.log("No SSR session found");
                }
            }

            setUser(currentUser);
            // Check if user is anonymous (no email means anonymous)
            setIsAnonymous(!currentUser?.email);
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
            useClientStore.getState().clearCache();
            useProductStore.getState().clearCache();
            useInvoiceStore.getState().clearCache();

            await loginWithEmail(email, password);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string) => {
        setLoading(true);
        try {
            await registerWithEmail(email, password, name);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            // Logout from client-side Appwrite
            await appwriteLogout();

            // Also clear SSR session cookie
            try {
                await fetch("/api/auth/logout", { method: "POST" });
            } catch {
                // Ignore SSR logout errors
            }

            setUser(null);
            setIsAnonymous(false);
            sessionStorage.removeItem("guestSession");
            sessionStorage.removeItem("guestHiddenAt");
            // Clear all cached data
            useClientStore.getState().clearCache();
            useProductStore.getState().clearCache();
            useInvoiceStore.getState().clearCache();
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        setLoading(true);
        try {
            await appwriteDeleteAccount();
            setUser(null);
            setIsAnonymous(false);
            sessionStorage.removeItem("guestSession");
            sessionStorage.removeItem("guestHiddenAt");
            // Clear all cached data
            useClientStore.getState().clearCache();
            useProductStore.getState().clearCache();
            useInvoiceStore.getState().clearCache();
        } finally {
            setLoading(false);
        }
    };

    const loginAnonymously = async () => {
        setLoading(true);
        try {
            // Clear cached data from previous session
            useClientStore.getState().clearCache();
            useProductStore.getState().clearCache();
            useInvoiceStore.getState().clearCache();

            await createAnonymousSession();
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsAnonymous(true);
            sessionStorage.setItem("guestSession", "true");
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = () => {
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
