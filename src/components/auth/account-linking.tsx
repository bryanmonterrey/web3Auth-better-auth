"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Link as LinkIcon, Unlink, Shield, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface LinkedAccount {
    id: string;
    provider: string;
    providerId: string;
    email?: string;
    createdAt: Date;
}

const providers = [
    {
        id: "google",
        name: "Google",
        icon: "🔵",
        color: "bg-blue-500",
        description: "Sign in with your Google account",
    },
    {
        id: "discord",
        name: "Discord",
        icon: "💬",
        color: "bg-indigo-500",
        description: "Connect your Discord account",
    },
    {
        id: "twitter",
        name: "X (Twitter)",
        icon: "🐦",
        color: "bg-sky-500",
        description: "Link your X account",
    },
    {
        id: "twitch",
        name: "Twitch",
        icon: "🎮",
        color: "bg-purple-500",
        description: "Connect your Twitch account",
    },
];

export default function AccountLinking() {
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState<string | null>(null);
    const [unlinking, setUnlinking] = useState<string | null>(null);
    const [showUnlinkDialog, setShowUnlinkDialog] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = authClient.useSession();

    const loadLinkedAccounts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch user's linked accounts from Better Auth
            // Note: Better Auth stores linked accounts in the 'account' table
            const response = await fetch("/api/accounts");
            if (!response.ok) {
                throw new Error("Failed to load linked accounts");
            }

            const data = await response.json();
            setLinkedAccounts(data.accounts || []);
        } catch (err) {
            console.error("Failed to load linked accounts:", err);
            setError(err instanceof Error ? err.message : "Failed to load linked accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLinkedAccounts();
    }, []);

    const linkAccount = async (provider: string) => {
        try {
            setLinking(provider);
            setError(null);

            // Use Better Auth's linkSocial method to link account to existing user
            await authClient.linkSocial({
                provider: provider as any,
                callbackURL: window.location.href,
            });

            // The OAuth flow will redirect, so we don't need to do anything else here
            // After redirect, the account will be linked
        } catch (err) {
            console.error(`Failed to link ${provider}:`, err);
            setError(err instanceof Error ? err.message : `Failed to link ${provider}`);
            setLinking(null);
        }
    };

    const unlinkAccount = async (accountId: string, provider: string) => {
        try {
            setUnlinking(accountId);
            setError(null);

            // Check if this is the last authentication method
            const authMethodsCount = linkedAccounts.length + (session?.user?.wallet_address ? 1 : 0);
            if (authMethodsCount <= 1) {
                throw new Error("Cannot unlink your only authentication method. Please add another method first.");
            }

            const response = await fetch(`/api/auth/unlink-account`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId, provider }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to unlink account");
            }

            setShowUnlinkDialog(null);
            await loadLinkedAccounts();
        } catch (err) {
            console.error("Failed to unlink account:", err);
            setError(err instanceof Error ? err.message : "Failed to unlink account");
        } finally {
            setUnlinking(null);
        }
    };

    const isLinked = (providerId: string) => {
        return linkedAccounts.some(account => account.provider === providerId);
    };

    const getLinkedAccount = (providerId: string) => {
        return linkedAccounts.find(account => account.provider === providerId);
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold">Linked Accounts</h2>
                
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Wallet Address */}
            {session?.user?.wallet_address && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                            <div className="p-3 bg-purple-500/20 rounded-2xl">
                                <span className="text-2xl">🔐</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-white">Solana Wallet</h3>
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Connected
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-400 font-mono">
                                    {session.user.wallet_address.slice(0, 8)}...{session.user.wallet_address.slice(-8)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accounts List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <Skeleton className="w-20 h-9 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {providers.map((provider) => {
                        const linked = isLinked(provider.id);
                        const account = getLinkedAccount(provider.id);

                        return (
                            <div
                                key={provider.id}
                                className={`bg-neutral-900 border rounded-3xl p-4 ${linked ? "border-green-500/30 bg-green-500/5" : "border-neutral-800"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div className={`p-3 ${linked ? "bg-green-500/20" : "bg-neutral-800"} rounded-2xl`}>
                                            <span className="text-2xl">{provider.icon}</span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-white">{provider.name}</h3>
                                                {linked && (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                                        <Check className="w-3 h-3" />
                                                        Linked
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-400">
                                                {linked && account?.email ? account.email : provider.description}
                                            </p>
                                        </div>
                                    </div>

                                    {linked ? (
                                        <Button
                                            onClick={() => setShowUnlinkDialog(account?.id || null)}
                                            variant="outline"
                                            size="sm"
                                            disabled={unlinking === account?.id}
                                            className="ml-4"
                                        >
                                            {unlinking === account?.id ? (
                                                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Unlink className="w-4 h-4 mr-2" />
                                                    Unlink
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => linkAccount(provider.id)}
                                            variant="outline"
                                            size="sm"
                                            disabled={linking === provider.id}
                                            className="ml-4"
                                        >
                                            {linking === provider.id ? (
                                                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                    Link
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Security Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-4">
                <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div className="space-y-1 text-sm">
                        <p className="text-yellow-400 font-medium">Security Notice</p>
                        <p className="text-neutral-300">
                            You must have at least one authentication method (wallet or linked account) to access your account.
                            We recommend keeping multiple methods linked for account recovery.
                        </p>
                    </div>
                </div>
            </div>

            {/* Unlink Confirmation Dialog */}
            <Dialog open={!!showUnlinkDialog} onOpenChange={() => setShowUnlinkDialog(null)}>
                <DialogContent className="bg-neutral-950 border-neutral-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Unlink Account?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unlink this account? You can always link it again later.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={() => setShowUnlinkDialog(null)}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const account = linkedAccounts.find(a => a.id === showUnlinkDialog);
                                if (account) {
                                    unlinkAccount(account.id, account.provider);
                                }
                            }}
                            variant="destructive"
                            className="flex-1"
                            disabled={!!unlinking}
                        >
                            {unlinking ? "Unlinking..." : "Unlink"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
