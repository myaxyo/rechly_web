"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { getCompanyInfo } from "@/lib/companyService";

/**
 * OAuth Callback Handler
 * Checks if new user needs onboarding (company info setup)
 * Redirects to onboarding for new users, dashboard for existing users
 */
export default function AuthCallbackPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        const checkOnboarding = async () => {
            if (loading) return;

            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const companyInfo = await getCompanyInfo();
                if (companyInfo?.name) {
                    // Existing user with company info - go to dashboard
                    router.push("/dashboard");
                } else {
                    // New user or no company info - go to onboarding
                    router.push("/onboarding");
                }
            } catch (error) {
                console.error("Error checking company info:", error);
                // Default to onboarding on error
                router.push("/onboarding");
            }
        };

        checkOnboarding();
    }, [user, loading, router]);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)",
            }}
        >
            <Spin size="large" />
        </div>
    );
}
