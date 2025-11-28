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
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
        ),
        color: "bg-blue-500",
        description: "Sign in with your Google account",
    },
    {
        id: "discord",
        name: "Discord",
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
        ),
        color: "bg-indigo-500",
        description: "Connect your Discord account",
    },
    {
        id: "twitter",
        name: "X (Twitter)",
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        color: "bg-sky-500",
        description: "Link your X account",
    },
    {
        id: "twitch",
        name: "Twitch",
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
        ),
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
        <div className="space-y-4 w-full">
            {/* Header */}
            <div>
                {loading ? (
                    <Skeleton className="h-7 w-48 rounded-full" />
                ) : (
                    <h2 className="text-xl font-semibold">Linked Accounts</h2>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Wallet Address */}
            {loading ? (
                <div className="bg-neutral-800/40 rounded-3xl p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                            <Skeleton className="w-12 h-12 rounded-2xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : session?.user?.wallet_address && (
                <div className="bg-neutral-800/40 rounded-3xl p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                            <div className="p-3 bg-neutral-900/50 rounded-2xl">
                                <svg className="w-6 h-6" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M64.6 237L0.5 301.6C-1.2 303.3 -0.100002 306.1 2.2 306.1H299.8C301.9 306.1 303.9 305.2 305.3 303.7L369.4 239.1C371.1 237.4 370 234.6 367.7 234.6H70.1C68 234.6 66 235.5 64.6 237ZM332.4 74L396.5 9.39999C398.2 7.69999 397.1 4.89999 394.8 4.89999H97.2001C95.1001 4.89999 93.1001 5.79999 91.7001 7.29999L27.6001 71.9C25.9001 73.6 27.0001 76.4 29.3001 76.4H326.9C329 76.4 331 75.5 332.4 74ZM326.9 155.5H29.3001C27.2001 155.5 25.2001 156.4 23.8001 157.9L64.6 198.7C66 200.2 68 201.1 70.1 201.1H367.7C369.8 201.1 371.8 200.2 373.2 198.7L332.4 157.9C331 156.4 329 155.5 326.9 155.5Z" fill="white" />
                                </svg>
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
                        <div key={i} className="bg-neutral-800/40 rounded-3xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                </div>
                                <Skeleton className="w-20 h-9 rounded-full" />
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
                                className={`bg-neutral-800/40 rounded-3xl p-4 ${linked ? "border-green-500/30 bg-green-500/5" : "border-neutral-800"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div className={`p-3 justify-center my-auto items-center  ${linked ? "bg-green-500/20" : "bg-neutral-900/50"} rounded-2xl`}>
                                            {provider.icon}
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
                                            className="ml-4 bg-white/5 hover:bg-white/10 border-none"
                                        >
                                            {linking === provider.id ? (
                                                <div className="w-4 h-4 bg-white/5 hover:bg-white/10 rounded-full animate-spin" />
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
