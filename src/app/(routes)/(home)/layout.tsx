"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from 'next-view-transitions'
import { authClient } from "@/lib/auth/client";
import { AppHeader } from "@/components/app-ui/app-header";
import { AppContainer } from "@/components/app-ui/app-container";


export default function BrowseLayoutClient({ children }: { children: React.ReactNode }) {
    const { data: sessionData, isPending: isLoading } = authClient.useSession();
    const router = useTransitionRouter();
    const pathname = usePathname();
    const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

    // Track whether we're on the home page (/) or not
    const isHomePage = pathname === "/";

    // 🛡️ PROTECTED: Smart redirect handling with loading states
    useEffect(() => {
        // Clear any existing timers when effect runs
        if (redirectTimer) {
            clearTimeout(redirectTimer);
            setRedirectTimer(null);
        }

        // Don't redirect during loading - wait for final state
        if (isLoading) {
            return;
        }

        // If no user and we're not on home page, start redirect timer
        if (!sessionData?.user && !isHomePage) {
            console.log("No authenticated user, redirecting to home in 2s...");
            const timer = setTimeout(() => {
                console.log("Executing redirect to home...");
                router.push("/");
            }, 2000);

            setRedirectTimer(timer);
            return () => clearTimeout(timer);
        }

        // If we have a user and we're on the home page, we're good!
        if (sessionData?.user && isHomePage) {
            console.log("User authenticated on home page, ready to proceed");
        }
    }, [sessionData?.user, isLoading, router, isHomePage]);

    return (
        <>
            <AppHeader />
            <div className="transition-all ease-linear duration-300 hidden-scrollbar overflow-y-auto">
                <AppContainer>
                    {/* Only render children when not in a loading state */}
                    {children}
                </AppContainer>
            </div>
        </>
    );
}
