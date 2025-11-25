"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { AppHeader } from "@/components/app-ui/app-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const usernameFromUrl = params.username as string;

    // 🔒 CRITICAL SECURITY CHECK: Validate user can only access their own dashboard
    useEffect(() => {
        // Wait for session to load
        if (isPending) return;

        // If no session, redirect to home (middleware should catch this, but double-check)
        if (!session?.user) {
            console.warn("No session found, redirecting to home");
            router.push("/");
            return;
        }

        // SECURITY: Check if the username in URL matches the logged-in user
        if (session.user.username !== usernameFromUrl) {
            console.error(
                `Unauthorized access attempt: User "${session.user.username}" tried to access dashboard for "${usernameFromUrl}"`
            );
            // Redirect to their own dashboard
            router.push(`/dashboard/${session.user.username}/settings`);
        }
    }, [session, isPending, usernameFromUrl, router]);

    // Show loading state while checking auth
    if (isPending) {
        return (
            <>
                <AppHeader />
                <div className="transition-all hidden-scrollbar flex h-[calc(100vh-52px)] items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </>
        );
    }

    // Don't render children until we've validated the username
    if (!session?.user || session.user.username !== usernameFromUrl) {
        return (
            <>
                <AppHeader />
                <div className="transition-all hidden-scrollbar flex h-[calc(100vh-52px)] items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </>
        );
    }
    return (
        <>
            <AppHeader />
            <div className="transition-all hidden-scrollbar flex h-[calc(100vh-52px)]">
                {children}
            </div>
        </>
    );
}
