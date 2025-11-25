// app/api/wallet/export-key/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { logWalletAccess, checkRateLimit, getResetTime } from "@/lib/security/audit-logger";

const subtle = globalThis.crypto?.subtle;

export async function POST(req: NextRequest) {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
        // 1. Verify user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. Check rate limit (stricter for private key export)
        if (checkRateLimit(userId, "export_key")) {
            const resetTime = getResetTime(userId, "export_key");
            await logWalletAccess({
                userId,
                action: "export_key",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: "Rate limit exceeded",
            });

            return NextResponse.json(
                {
                    error: `Rate limit exceeded. You can only export your private key 3 times per hour. Please try again in ${Math.ceil(resetTime / 60)} minutes.`,
                    resetTime
                },
                { status: 429 }
            );
        }

        // 3. Check if user has a wallet
        if (!session.user.wallet_address) {
            return NextResponse.json(
                { error: "No wallet found" },
                { status: 404 }
            );
        }

        console.log(`🔓 Exporting private key for user: ${userId.slice(0, 8)}...`);

        // 4. Retrieve encrypted wallet from Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: walletData, error: fetchError } = await supabase
            .from('encrypted_wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !walletData) {
            console.error('Failed to fetch wallet:', fetchError);
            return NextResponse.json(
                { error: "Wallet not found" },
                { status: 404 }
            );
        }

        // 5. Decrypt private key
        if (!subtle) {
            throw new Error("Web Crypto API not available");
        }

        const encryptionKeySource = walletData.passkey_credential_id || `social-${userId}`;
        const keyBuffer = Buffer.from(encryptionKeySource, 'utf-8');

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
        const encryptedPrivKey = Buffer.from(walletData.encrypted_privkey, "base64");

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

        console.log(`✅ Private key exported for user: ${userId.slice(0, 8)}...`);

        // Log successful export
        await logWalletAccess({
            userId,
            action: "export_key",
            ipAddress,
            userAgent,
            success: true,
        });

        return NextResponse.json({
            success: true,
            privateKey: privateKeyBase58,
            address: walletData.address,
        });

    } catch (error) {
        console.error("❌ Failed to export private key:", error);

        // Log failed attempt
        const session = await auth.api.getSession({ headers: await headers() });
        if (session?.user) {
            await logWalletAccess({
                userId: session.user.id,
                action: "export_key",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
