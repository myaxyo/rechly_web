"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthRedirect() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            router.replace("/dashboard");
        }
    }, [loading, router, user]);

    return null;
}
