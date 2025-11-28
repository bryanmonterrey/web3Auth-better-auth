"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Wallet, Fingerprint } from "lucide-react";
import Image from "next/image";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { useTransitionRouter } from 'next-view-transitions'

interface WalletConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
    const router = useTransitionRouter();
    const { wallets, select, connected, publicKey, signMessage } = useWallet();
    const [isLoading, startTransition] = useTransition();
    const [loadingAction, setLoadingAction] = useState<string>("");

    // Separate WalletConnect from other wallets
    const walletConnectAdapter = wallets.find(
        (wallet) => wallet.adapter.name === "WalletConnect"
    );

    // Get detected/installed wallets (excluding WalletConnect)
    const detectedWallets = wallets.filter(
        (wallet) =>
            wallet.adapter.name !== "WalletConnect" &&
            (wallet.readyState === WalletReadyState.Installed ||
                wallet.readyState === WalletReadyState.Loadable)
    );

    const handleWalletSelect = async (walletName: string) => {
        try {
            select(walletName as any);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to select wallet:", error);
            toast.error("Failed to connect wallet");
        }
    };

    const handlePasskeySignIn = () => {
        setLoadingAction("passkey");
        startTransition(async () => {
            try {
                const { data: signInData, error: signInError } = await authClient.signIn.passkey();

                console.log("[Passkey Debug] signInData:", signInData);
                console.log("[Passkey Debug] signInError:", signInError);
                console.log("[Passkey Debug] Full Error:", JSON.stringify(signInError, null, 2));

                if (signInError) {
                    // Show the actual error instead of generic message
                    const errorMessage = signInError.message || signInError.statusText || JSON.stringify(signInError);
                    console.error("[Passkey Error]", errorMessage, signInError);
                    toast.error(`Passkey error: ${errorMessage}`);
                    return;
                }

                if (signInData) {
                    onOpenChange(false);
                    router.refresh();
                    toast.success("Signed in with passkey!");
                } else {
                    toast.error("Passkey authentication failed. Please try again.");
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("[Passkey Exception]", error);

                if (message.includes("cancelled") || message.includes("abort")) {
                    toast.error("Passkey sign-in cancelled");
                } else if (message.includes("NotAllowedError")) {
                    toast.error("Passkey access denied. Please check your device settings.");
                } else {
                    toast.error(`Passkey sign-in failed: ${message}`);
                }
            } finally {
                setLoadingAction("");
            }
        });
    };

    const handleSocialLogin = (provider: "google" | "twitter" | "discord" | "twitch") => {
        setLoadingAction(provider);
        startTransition(async () => {
            try {
                await authClient.signIn.social({
                    provider,
                    callbackURL: `${window.location.origin}/`,
                });
                onOpenChange(false);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                toast.error(`${provider} sign-in failed: ${message}`);
                setLoadingAction("");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">Connect Wallet</DialogTitle>
                    <DialogDescription className="text-center font-medium">
                        Choose how you'd like to connect to this app
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-3 mt-1">
                    {/* Passkey Sign In */}
                    <div className="grid grid-cols-2 w-full gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full justify-start gap-3 h-12"
                        onClick={handlePasskeySignIn}
                        disabled={isLoading}
                    >
                        <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                            <Fingerprint className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-sm">
                                {loadingAction === "passkey" ? "Signing in..." : "Passkey Sign In"}
                            </span>
                        </div>
                    </Button>

                    {walletConnectAdapter && (
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => handleWalletSelect(walletConnectAdapter.adapter.name)}
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                                <QrCode className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">Scan to Connect</span>
                            </div>
                        </Button>
                    )}
                    </div>

                    {detectedWallets.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-px" />
                                <span className="text-sm text-muted-foreground">
                                    Solana Wallets
                                </span>
                                <div className="flex-1 h-px" />
                            </div>
                            <div className="grid grid-cols-2 w-full gap-2">
                            {detectedWallets.map((wallet) => (
                                <Button
                                    key={wallet.adapter.name}
                                    variant="outline"
                                    size="lg"
                                    className="w-full justify-start gap-3 h-12"
                                    onClick={() => handleWalletSelect(wallet.adapter.name)}
                                    disabled={isLoading}
                                >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                                        {wallet.adapter.icon ? (
                                            <Image
                                                src={wallet.adapter.icon}
                                                alt={wallet.adapter.name}
                                                width={24}
                                                height={24}
                                                className="rounded"
                                            />
                                        ) : (
                                            <Wallet className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold text-sm">
                                            {wallet.adapter.name}
                                        </span>
                                    </div>
                                </Button>
                            ))}
                            </div>
                        </>
                    )}

                    {/* No wallets detected message */}
                    {detectedWallets.length === 0 && !walletConnectAdapter && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No wallets detected</p>
                            <p className="text-xs mt-1">Please install a Solana wallet extension</p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px" />
                        <span className="text-sm text-muted-foreground">
                            Or continue with
                        </span>
                        <div className="flex-1 h-px" />
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 col-span-2 w-full items-center justify-center gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => handleSocialLogin("google")}
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">
                                    {loadingAction === "google" ? "Signing in..." : "Google"}
                                </span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => handleSocialLogin("twitter")}
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">
                                    {loadingAction === "twitter" ? "Signing in..." : "Twitter"}
                                </span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => handleSocialLogin("discord")}
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">
                                    {loadingAction === "discord" ? "Signing in..." : "Discord"}
                                </span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => handleSocialLogin("twitch")}
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                                </svg>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">
                                    {loadingAction === "twitch" ? "Signing in..." : "Twitch"}
                                </span>
                            </div>
                        </Button>
                    </div>        

                    {/* Detected Wallets */}
                    
                </div>
            </DialogContent>
        </Dialog>
    );
}
