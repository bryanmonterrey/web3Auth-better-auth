"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTransitionRouter } from 'next-view-transitions'
import { authClient } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import AvatarUpload from "@/components/file-upload/avatar-upload";
import SeedPhraseDisplay from "@/components/wallet/seed-phrase-display";

type OnboardingStep =
    | "wallet_setup"
    | "generating_wallet"
    | "seed_phrase_display"
    | "username_setup"
    | "avatar_setup"
    | "complete";

export default function OnboardingDialog() {
    const router = useTransitionRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<OnboardingStep>("wallet_setup");
    const [message, setMessage] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Handle avatar file change - deferred to avoid setState during render
    const handleFileChange = useCallback((file: any) => {
        setTimeout(() => {
            if (file?.file instanceof File) {
                setAvatarFile(file.file);
                setError("");
            } else {
                setAvatarFile(null);
            }
        }, 0);
    }, []);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                // Debug mode: force dialog open with ?debug-onboarding=true
                const debugMode = searchParams.get("debug-onboarding") === "true";

                if (debugMode) {
                    setIsOpen(true);
                    // You can change this to test different steps:
                    // "wallet_setup", "username_setup", or "avatar_setup"
                    setStep("avatar_setup");
                    return;
                }

                const { data: session } = await authClient.getSession();

                if (!session) return;

                setUserId(session.user.id);

                const isOAuthUser = session.user.email && !session.user.wallet_address;
                const hasWallet = !!session.user.wallet_address;
                const hasUsername = !!session.user.username;

                // Check if onboarding is complete
                const isOnboardingComplete = hasWallet && hasUsername;

                // Only show dialog if onboarding is not complete
                if (isOnboardingComplete) {
                    setIsOpen(false);
                    return;
                }

                // Only OAuth users need wallet creation
                if (isOAuthUser && !hasWallet) {
                    setIsOpen(true);
                    setStep("wallet_setup");
                } else if (!hasUsername) {
                    setIsOpen(true);
                    setStep("username_setup");
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
            }
        };

        checkOnboardingStatus();
    }, [searchParams]);

    const handleWalletSetup = async () => {
        if (!userId) return;

        try {
            setStep("generating_wallet");
            setMessage("Setting up your account...");

            // Step 1: Try to register passkey (optional)
            try {
                await authClient.passkey.addPasskey();
            } catch (passkeyErr) {
                console.log("Continuing without passkey");
            }

            // Step 2: Generate encrypted wallet
            const response = await fetch("/api/create-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create wallet");
            }

            const data = await response.json();
            console.log("✅ Wallet created:", data.address);

            // Store mnemonic and show seed phrase display
            setMnemonic(data.mnemonic);
            setStep("seed_phrase_display");
            setMessage("");
        } catch (error) {
            console.error("Wallet setup error:", error);
            setMessage(error instanceof Error ? error.message : "Failed to set up wallet");
            setStep("wallet_setup");
        }
    };

    const handleSeedPhraseAcknowledged = async () => {
        try {
            await authClient.getSession(); // Force session refresh
            router.refresh();

            // Check if OAuth user needs username setup next
            const { data: session } = await authClient.getSession();
            const needsProfileSetup = !session?.user.username;

            if (needsProfileSetup) {
                setStep("username_setup");
                setMessage("Choose a username");
            } else {
                setStep("complete");
                setMessage("Wallet created successfully!");
                setTimeout(() => {
                    setIsOpen(false);
                    router.replace("/");
                    router.refresh();
                }, 2000);
            }

        } catch (error) {
            console.error("❌ Setup failed:", error);
            setMessage(error instanceof Error ? error.message : "Setup failed");
            setTimeout(() => {
                setIsOpen(false);
                router.replace("/");
            }, 2000);
        }
    };

    const handleUsernameSubmit = async () => {
        if (!username.trim()) {
            setError("Username is required");
            return;
        }

        if (username.length < 4 || username.length > 15) {
            setError("Username must be between 4 and 15 characters");
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            setError("Username can only contain letters, numbers, underscores, and hyphens");
            return;
        }

        if (loading) return; // Prevent double-clicks

        try {
            setLoading(true);
            setError("");
            setMessage("Saving username...");

            // Save username first
            const response = await fetch("/api/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorMessage = "Failed to save username";
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Refresh session to get updated username
            await authClient.getSession();

            // Move to avatar setup
            setError("");
            setStep("avatar_setup");
            setMessage("Upload an avatar");
        } catch (error) {
            console.error("❌ Username save failed:", error);
            setError(error instanceof Error ? error.message : "Failed to save username");
            setMessage("");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) {
            setError("Avatar is required");
            return;
        }

        if (loading) return; // Prevent double-clicks

        try {
            setLoading(true);
            setError("");
            setMessage("Uploading avatar...");

            // Upload avatar only (username already saved)
            const formData = new FormData();
            formData.append("avatar", avatarFile);

            const response = await fetch("/api/update-profile", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = "Failed to upload avatar";
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Refresh session to get updated avatar
            await authClient.getSession();
            router.refresh();

            setStep("complete");
            setMessage("Profile completed successfully!");

            setTimeout(() => {
                setIsOpen(false);
                router.replace("/");
                router.refresh();
            }, 2000);
        } catch (error) {
            console.error("❌ Avatar upload failed:", error);
            setError(error instanceof Error ? error.message : "Failed to upload avatar");
            setMessage("");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (step === "complete") {
            setIsOpen(false);
            router.replace("/");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-md rounded-4xl"
                showCloseButton={step === "complete"}
            >
                {step === "wallet_setup" && (
                    <>
                        <DialogHeader>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                                <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <DialogTitle className="text-center text-white text-2xl">Complete Your Setup</DialogTitle>
                            <DialogDescription className="text-center">
                                <p className="text-zinc-400 mb-2">Create your encrypted Solana wallet</p>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Button
                                onClick={handleWalletSetup}
                                size="lg"
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-6"
                            >
                                Continue
                            </Button>
                        </div>
                    </>
                )}

                {step === "generating_wallet" && (
                    <>
                        <DialogHeader>
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-neutral-500" />
                                <DialogTitle className="text-center text-white">{message}</DialogTitle>
                                <DialogDescription className="text-center text-zinc-400 mt-2">
                                    Do not close this window...
                                </DialogDescription>
                            </div>
                        </DialogHeader>
                    </>
                )}

                {/* Seed Phrase Display Step */}
                {step === "seed_phrase_display" && mnemonic && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center text-white text-xl">
                                Save Your Recovery Phrase
                            </DialogTitle>
                            <DialogDescription className="text-center text-zinc-400">
                                Write down these 12 words in order. This is the only way to recover your wallet.
                            </DialogDescription>
                        </DialogHeader>
                        <SeedPhraseDisplay
                            mnemonic={mnemonic}
                            onConfirm={handleSeedPhraseAcknowledged}
                            showConfirmation={true}
                        />
                    </>
                )}

                {step === "username_setup" && (
                    <>
                        <DialogHeader>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                                <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <DialogTitle className="text-center text-white text-xl">Choose Username</DialogTitle>
                            <DialogDescription className="text-center text-zinc-400">
                                This will be your unique identifier
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter username"
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:ring-none"
                                />
                                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                                <p className="text-zinc-500 text-xs mt-2">
                                    3-20 characters, letters, numbers, underscores and hyphens only
                                </p>
                            </div>
                            <Button
                                onClick={handleUsernameSubmit}
                                size="lg"
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-6 rounded-full"
                                disabled={!username.trim()}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}

                {step === "avatar_setup" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center text-white text-2xl">Upload Avatar</DialogTitle>
                            <DialogDescription className="text-center text-zinc-400">

                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <AvatarUpload
                                onFileChange={handleFileChange}
                            />
                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                            <Button
                                onClick={handleAvatarUpload}
                                size="lg"
                                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-6 rounded-full"
                                disabled={loading || !avatarFile}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Complete Profile"
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {step === "complete" && (
                    <>
                        <DialogHeader>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <DialogTitle className="text-center text-white">{message}</DialogTitle>
                            </div>
                        </DialogHeader>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
