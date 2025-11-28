"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { DashboardHeader } from "@/components/dashboard-ui/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AppContainer } from "@/components/app-ui/app-container";

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
                <DashboardHeader />
                <div className="transition-all hidden-scrollbar flex h-[calc(100vh-52px)] items-center justify-start p-6">
                    <div className="w-full max-w-sm mx-auto space-y-8 flex flex-col items-center">
                        <div className="space-y-2 text-center">
                            <Skeleton className="h-9 w-48 mx-auto" />
                            <Skeleton className="h-5 w-64 mx-auto" />
                        </div>
                        <Skeleton className="h-10 w-full max-w-md" />
                        <div className="w-full space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-32 w-full rounded-3xl" />
                            <Skeleton className="h-32 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Don't render children until we've validated the username
    if (!session?.user || session.user.username !== usernameFromUrl) {
        return (
            <>
                <DashboardHeader />
                <div className="transition-all hidden-scrollbar overflow-y-auto flex h-[calc(100vh-52px)] items-center justify-start p-6">
                    <div className="w-full max-w-sm mx-auto space-y-8 flex flex-col items-center">
                        <div className="space-y-2 text-center">
                            <Skeleton className="h-9 w-48 mx-auto" />
                            <Skeleton className="h-5 w-64 mx-auto" />
                        </div>
                        <Skeleton className="h-10 w-full max-w-md" />
                        <div className="w-full space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-32 w-full rounded-3xl" />
                            <Skeleton className="h-32 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
        <div className="h-screen">
            <DashboardHeader />
            <AppContainer>
                {children}
            </AppContainer>
            </div>
        </>
    );
}
