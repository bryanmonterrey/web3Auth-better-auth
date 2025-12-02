import { router, protectedProcedure } from "@/server/trpc";
import { createClient } from "@supabase/supabase-js";
import {
    logWalletAccess,
    checkRateLimit,
    getResetTime,
} from "@/lib/security/audit-logger";
import { headers } from "next/headers";
import { TRPCError } from "@trpc/server";

const subtle = globalThis.crypto?.subtle;

export const walletRouter = router({
    /**
     * Export private key for the user's wallet
     * Rate limited to 3 times per hour
     */
    exportKey: protectedProcedure.mutation(async ({ ctx }) => {
        const headersList = await headers();
        const ipAddress =
            headersList.get("x-forwarded-for") ||
            headersList.get("x-real-ip") ||
            "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        // Check rate limit (stricter for private key export)
        if (checkRateLimit(ctx.user.id, "export_key")) {
            const resetTime = getResetTime(ctx.user.id, "export_key");
            await logWalletAccess({
                userId: ctx.user.id,
                action: "export_key",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: "Rate limit exceeded",
            });

            throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: `Rate limit exceeded. You can only export your private key 3 times per hour. Please try again in ${Math.ceil(resetTime / 60)} minutes.`,
            });
        }

        // Check if user has a wallet
        if (!ctx.user.wallet_address) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "No wallet found",
            });
        }

        try {
            console.log(`🔓 Exporting private key for user: ${ctx.user.id.slice(0, 8)}...`);

            // Retrieve encrypted wallet from Supabase
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: walletData, error: fetchError } = await supabase
                .from("encrypted_wallets")
                .select("*")
                .eq("user_id", ctx.user.id)
                .single();

            if (fetchError || !walletData) {
                console.error("Failed to fetch wallet:", fetchError);
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Wallet not found",
                });
            }

            // Decrypt private key
            if (!subtle) {
                throw new Error("Web Crypto API not available");
            }

            const encryptionKeySource =
                walletData.passkey_credential_id || `social-${ctx.user.id}`;
            const keyBuffer = Buffer.from(encryptionKeySource, "utf-8");

            const baseKey = await subtle.importKey(
                "raw",
                keyBuffer as any,
                "PBKDF2",
                false,
                ["deriveKey"]
            );

            const salt = Buffer.from(walletData.salt, "base64");
            const encryptionKey = await subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt as any,
                    iterations: 100000,
                    hash: "SHA-256",
                },
                baseKey,
                {
                    name: "AES-GCM",
                    length: 256,
                },
                false,
                ["decrypt"]
            );

            const iv = Buffer.from(walletData.iv, "base64");
            const encryptedPrivKey = Buffer.from(
                walletData.encrypted_privkey,
                "base64"
            );

            const decrypted = await subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv as any,
                },
                encryptionKey,
                encryptedPrivKey as any
            );

            const privateKeyBytes = new Uint8Array(decrypted);

            // Convert to base58 for display
            const bs58 = await import("bs58");
            const privateKeyBase58 = bs58.default.encode(privateKeyBytes);

            console.log(`✅ Private key exported for user: ${ctx.user.id.slice(0, 8)}...`);

            // Log successful export
            await logWalletAccess({
                userId: ctx.user.id,
                action: "export_key",
                ipAddress,
                userAgent,
                success: true,
            });

            return {
                success: true,
                privateKey: privateKeyBase58,
                address: walletData.address,
            };
        } catch (error) {
            console.error("❌ Failed to export private key:", error);

            // Log failed attempt
            await logWalletAccess({
                userId: ctx.user.id,
                action: "export_key",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });

            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "Internal server error",
            });
        }
    }),

    /**
     * Reveal recovery phrase for the user's wallet
     * Rate limited
     */
    revealPhrase: protectedProcedure.mutation(async ({ ctx }) => {
        const headersList = await headers();
        const ipAddress =
            headersList.get("x-forwarded-for") ||
            headersList.get("x-real-ip") ||
            "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        // Check rate limit
        if (checkRateLimit(ctx.user.id, "reveal_phrase")) {
            const resetTime = getResetTime(ctx.user.id, "reveal_phrase");
            await logWalletAccess({
                userId: ctx.user.id,
                action: "reveal_phrase",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: "Rate limit exceeded",
            });

            throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: `Rate limit exceeded. Please try again in ${Math.ceil(resetTime / 60)} minutes.`,
            });
        }

        // Check if user has a wallet
        if (!ctx.user.wallet_address) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "No wallet found",
            });
        }

        try {
            console.log(
                `🔓 Revealing recovery phrase for user: ${ctx.user.id.slice(0, 8)}...`
            );

            // Retrieve encrypted wallet from Supabase
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: walletData, error: fetchError } = await supabase
                .from("encrypted_wallets")
                .select("*")
                .eq("user_id", ctx.user.id)
                .single();

            if (fetchError || !walletData) {
                console.error("Failed to fetch wallet:", fetchError);
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Wallet not found",
                });
            }

            // Check if wallet has encrypted mnemonic (new wallets only)
            if (!walletData.encrypted_mnemonic || !walletData.mnemonic_iv) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Recovery phrase not available. This wallet was created before recovery phrase storage was implemented.",
                });
            }

            // Decrypt mnemonic
            if (!subtle) {
                throw new Error("Web Crypto API not available");
            }

            const encryptionKeySource =
                walletData.passkey_credential_id || `social-${ctx.user.id}`;
            const keyBuffer = Buffer.from(encryptionKeySource, "utf-8");

            const baseKey = await subtle.importKey(
                "raw",
                keyBuffer as any,
                "PBKDF2",
                false,
                ["deriveKey"]
            );

            const salt = Buffer.from(walletData.salt, "base64");
            const encryptionKey = await subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt as any,
                    iterations: 100000,
                    hash: "SHA-256",
                },
                baseKey,
                {
                    name: "AES-GCM",
                    length: 256,
                },
                false,
                ["decrypt"]
            );

            const mnemonicIv = Buffer.from(walletData.mnemonic_iv, "base64");
            const encryptedMnemonic = Buffer.from(
                walletData.encrypted_mnemonic,
                "base64"
            );

            const decrypted = await subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: mnemonicIv as any,
                },
                encryptionKey,
                encryptedMnemonic as any
            );

            const mnemonic = Buffer.from(decrypted).toString("utf-8");

            console.log(
                `✅ Recovery phrase revealed for user: ${ctx.user.id.slice(0, 8)}...`
            );

            // Log successful access
            await logWalletAccess({
                userId: ctx.user.id,
                action: "reveal_phrase",
                ipAddress,
                userAgent,
                success: true,
            });

            return {
                success: true,
                mnemonic,
            };
        } catch (error) {
            console.error("❌ Failed to reveal recovery phrase:", error);

            // Log failed attempt
            await logWalletAccess({
                userId: ctx.user.id,
                action: "reveal_phrase",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });

            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "Internal server error",
            });
        }
    }),
});
