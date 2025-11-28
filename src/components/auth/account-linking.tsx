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
        description: "Connect Google account",
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
        description: "Connect Discord account",
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
        description: "Connect X account",
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
        description: "Connect Twitch account",
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
                                <svg className="w-5 h-5" viewBox="0 0 101 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0H20.0301C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="white" />
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
                                className={`bg-neutral-800/40 rounded-3xl p-4 ${linked ? "" : ""
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div className={`p-3 justify-center my-auto items-center  ${linked ? "" : ""} rounded-2xl`}>
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
