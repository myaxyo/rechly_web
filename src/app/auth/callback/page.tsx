"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { account } from "@/lib/appwrite";
import { getCompanyInfo } from "@/lib/companyService";
import { useClientStore, useProductStore, useInvoiceStore } from "@/store";

/**
 * OAuth Callback Handler
 * Checks if new user needs onboarding (company info setup)
 * Redirects to onboarding for new users, dashboard for existing users
 */
export default function AuthCallbackPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                // Give Appwrite a moment to process the OAuth callback
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Check if we have a valid session directly with Appwrite
                const user = await account.get();

                if (!user) {
                    console.log("No user found after OAuth, redirecting to login");
                    router.push("/login");
                    return;
                }

                console.log("OAuth user found:", user.$id);

                // Clear cached data from previous session (important for OAuth)
                useClientStore.getState().clearCache();
                useProductStore.getState().clearCache();
                useInvoiceStore.getState().clearCache();

                // Check if user has company info set up
                try {
                    const companyInfo = await getCompanyInfo();
                    if (companyInfo?.name) {
                        // Existing user with company info - go to dashboard
                        console.log("Company info found, going to dashboard");
                        router.push("/dashboard");
                    } else {
                        // New user or no company info - go to onboarding
                        console.log("No company info, going to onboarding");
                        router.push("/onboarding");
                    }
                } catch (error) {
                    console.error("Error checking company info:", error);
                    // Default to onboarding on error
                    router.push("/onboarding");
                }
            } catch (error) {
                console.error("OAuth callback error:", error);
                router.push("/login");
            } finally {
                setChecking(false);
            }
        };

        handleOAuthCallback();
    }, [router]);

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
