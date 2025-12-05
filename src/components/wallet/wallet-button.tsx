"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTransitionRouter } from 'next-view-transitions'
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletConnectModal } from "./wallet-connect-modal";
import { authClient } from "@/lib/auth/client";
import { useAuthSession } from "@/hooks/use-auth-session";
import { signInWithSolana } from "@/lib/solana/sign-in";
import { toast } from "sonner";
import { Loader2, Copy, Wallet, LogOut } from "lucide-react";
import "@/lib/types";

function shortenWalletAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function WalletButton() {
    const router = useTransitionRouter();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isSigningOut = useRef(false);
    const isAutoSignInTriggered = useRef(false);

    const { publicKey, connected, connecting, disconnecting, disconnect, signMessage } = useWallet();
    const { data: session, isLoading: loading } = useAuthSession();
    const [isSigningIn, startSigningIn] = useTransition();

    const isSignedIn = !!session?.user;
    const walletAddress = session?.user?.wallet_address;

    const handleConnect = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleSignIn = useCallback(async () => {
        if (!connected || !publicKey) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!signMessage) {
            toast.error("Wallet does not support message signing");
            return;
        }

        startSigningIn(async () => {
            try {
                const result = await signInWithSolana({
                    publicKey,
                    signMessage
                });

                // Invalidate session cache to update all components
                queryClient.invalidateQueries({ queryKey: ["session"] });
                router.refresh();
                toast.success("Successfully signed in!");
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);

                if (message.includes("rejected") || message.includes("denied")) {
                    toast.error("Sign-in cancelled");
                } else if (message.includes("nonce")) {
                    toast.error("Session expired. Please try again.");
                } else {
                    toast.error(`Sign-in failed: ${message}`);
                }
            }
        });
    }, [connected, publicKey, queryClient, router, signMessage]);

    const handleSignOut = useCallback(async () => {
        if (isSigningOut.current) return;

        try {
            isSigningOut.current = true;
            await authClient.signOut();

            // Invalidate session cache to immediately update UI
            queryClient.invalidateQueries({ queryKey: ["session"] });

            if (disconnect) {
                await disconnect();
            }

            router.refresh();
            toast.success("Signed out successfully");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Sign-out failed: ${message}`);
        } finally {
            isSigningOut.current = false;
        }
    }, [disconnect, queryClient, router]);

    const handleCopyAddress = useCallback(() => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            toast.success("Address copied to clipboard");
        }
    }, [walletAddress]);

    const handleChangeWallet = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    // Auto sign-in when wallet connects
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (
            connected &&
            !isSignedIn &&
            !loading &&
            !isSigningIn &&
            !isAutoSignInTriggered.current
        ) {
            isAutoSignInTriggered.current = true;

            timer = setTimeout(() => {
                handleSignIn();
            }, 500);
        }

        if (!connected || isSignedIn) {
            isAutoSignInTriggered.current = false;
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [connected, isSignedIn, loading, isSigningIn, handleSignIn]);

    const getButtonText = () => {
        if (connecting) return "Connecting...";
        if (isSigningIn) return "Signing In...";
        if (isSigningOut.current || disconnecting) return "Signing Out...";
        if (isSignedIn && walletAddress) return shortenWalletAddress(walletAddress);
        if (isSignedIn) return session?.user?.username || "Account";
        if (connected) return "Sign In";
        return "Connect Wallet";
    };

    const handleButtonClick = () => {
        if (connected && !isSignedIn) {
            handleSignIn();
        } else if (!connected) {
            handleConnect();
        }
    };

    // Only show loading spinner on initial load (no data yet), not on background refetches
    if (loading && session === undefined) {
        return (
            <Button disabled variant="outline">
                <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
        );
    }

    const isProcessing = connecting || disconnecting || isSigningIn || isSigningOut.current;
    const buttonText = getButtonText();

    // Signed-in state: show dropdown menu
    if (isSignedIn) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="font-mono"
                            disabled={isProcessing}
                        >
                            {isProcessing && (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            )}
                            {buttonText}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleCopyAddress}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleChangeWallet}>
                            <Wallet className="w-4 h-4 mr-2" />
                            Change Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut} data-variant="destructive">
                            <LogOut className="w-4 h-4 mr-2" />
                            Disconnect
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <WalletConnectModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                />
            </>
        );
    }

    // Not signed in: show regular button
    return (
        <>
            <Button
                onClick={handleButtonClick}
                disabled={isProcessing}
                variant="default"
                className="font-mono border border-zinc-600/20"
            >
                {isProcessing && (connecting || isSigningIn) && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {buttonText}
            </Button>

            <WalletConnectModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    );
}
