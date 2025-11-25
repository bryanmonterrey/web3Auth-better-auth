"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Shield, Key, Wallet, ChevronRight, Eye, Download, Trash2, Link as LinkIcon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import RevealPhraseModal from "@/components/wallet/reveal-phrase-modal";
import ExportKeyModal from "@/components/wallet/export-key-modal";
import PasskeyManager from "@/components/auth/passkey-manager";
import AccountLinking from "@/components/auth/account-linking";
import SessionManager from "@/components/auth/session-manager";
import SecurityAuditLog from "@/components/auth/security-audit-log";
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
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

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
        <div className="flex flex-col w-full h-full items-center justify-start text-white p-6">
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
                    {/* Wallet Section */}
                    {activeTab.toLowerCase() === "wallet" && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Wallet Management</h2>

                                {/* Recovery Phrase */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-3xl border border-neutral-800/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-900 rounded-lg">
                                                <Eye className="w-5 h-5 text-neutral-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Recovery Phrase</h3>
                                                <p className="text-sm text-neutral-400">View your 12-word recovery phrase</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setShowRevealModal(true)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Reveal
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>

                                    {/* Export Private Key */}
                                    <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-3xl hover:bg-neutral-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-900 rounded-lg">
                                                <Download className="w-5 h-5 text-neutral-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Export Private Key</h3>
                                                <p className="text-sm text-neutral-400">Export your wallet's private key</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setShowExportModal(true)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Export
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
                                <h2 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-white">Delete Wallet</h3>
                                        <p className="text-sm text-neutral-400">Permanently delete your wallet and all associated data</p>
                                    </div>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
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
                </div>
            </div>

            {/* Modals */}
            <RevealPhraseModal
                isOpen={showRevealModal}
                onClose={() => setShowRevealModal(false)}
            />
            <ExportKeyModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />
        </div>
    );
}
