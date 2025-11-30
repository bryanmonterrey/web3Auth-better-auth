"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Skeleton } from "@/components/ui/skeleton";
import PasskeyManager from "@/components/auth/passkey-manager";
import AccountLinking from "@/components/auth/account-linking";
import SessionManager from "@/components/auth/session-manager";
import SecurityAuditLog from "@/components/auth/security-audit-log";
import WalletManagement from "@/components/auth/wallet-management";
import { AnimatedTabs } from "@/components/ui/animated-tabs";

export default function SettingsPage() {
    const { data: session } = authClient.useSession();
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    // Determine if user is wallet-only (has wallet but no social accounts)
    const isWalletOnlyUser = session?.user?.wallet_address && linkedAccounts.length === 0 && !loadingAccounts;

    // Wallet-only users see only Sessions tab, others see all tabs
    const tabs = isWalletOnlyUser ? ["Sessions"] : ["Wallet", "Security", "Passkeys", "Accounts", "Sessions"];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    // Load linked accounts to determine user type
    useEffect(() => {
        const loadLinkedAccounts = async () => {
            try {
                const response = await fetch("/api/accounts");
                if (response.ok) {
                    const data = await response.json();
                    setLinkedAccounts(data.accounts || []);
                }
            } catch (error) {
                console.error("Failed to load accounts:", error);
            } finally {
                setLoadingAccounts(false);
            }
        };

        loadLinkedAccounts();
    }, []);

    // Update active tab when user type changes
    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [isWalletOnlyUser, loadingAccounts]);

    return (
        <div className="flex flex-col w-full items-center justify-start text-white/90 p-6">
            <div className="w-full max-w-sm mx-auto space-y-8 flex flex-col items-center justify-start">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-neutral-400">Manage your wallet, security, and account settings</p>
                </div>

                {/* Animated Tabs */}
            
                    <div className="flex justify-center">
                        <AnimatedTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                

                {/* Content Container - Fixed Width */}
                <div className="w-full">
                        <>
                            {/* Wallet Section */}
                            {activeTab.toLowerCase() === "wallet" && (
                                <WalletManagement />
                            )}

                            {/* Security Section */}
                            {activeTab.toLowerCase() === "security" && (
                                <SecurityAuditLog />
                            )}

                            {/* Passkeys Section */}
                            {activeTab.toLowerCase() === "passkeys" && (
                                <PasskeyManager />
                            )}

                            {/* Accounts Section */}
                            {activeTab.toLowerCase() === "accounts" && (
                                <AccountLinking />
                            )}

                            {/* Sessions Section */}
                            {activeTab.toLowerCase() === "sessions" && (
                                <SessionManager />
                            )}
                        </>     
                </div>
            </div>
        </div>
    );
}
