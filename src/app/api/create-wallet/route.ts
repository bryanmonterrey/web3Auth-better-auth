// app/api/create-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../lib/auth/server";
import { headers } from "next/headers";
import { db } from "../../../db";
import { user } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { Keypair } from "@solana/web3.js";
import { nanoid } from "nanoid";
import { createClient } from "@supabase/supabase-js";
import * as bip39 from "bip39";

// Use browser's Web Crypto API (works in Node.js 16+)
const subtle = globalThis.crypto?.subtle;

interface EncryptedWallet {
  address: string;
  encrypted_privkey: string;
  encrypted_mnemonic: string; // Store encrypted mnemonic separately
  iv: string;
  mnemonic_iv: string; // Separate IV for mnemonic
  salt: string;
  mnemonic: string; // Return mnemonic to show user once
}

async function generateEncryptedWallet(
  userId: string,
  encryptionKeySource: string
): Promise<EncryptedWallet> {
  if (!subtle) {
    throw new Error("Web Crypto API not available");
  }

  // 1. Generate BIP39 mnemonic (12 words)
  const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words

  // 2. Derive seed from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // 3. Generate Solana keypair from seed (using first 32 bytes)
  const keypair = Keypair.fromSeed(seed.slice(0, 32));
  const address = keypair.publicKey.toBase58();
  const privateKeyBytes = keypair.secretKey;

  console.log(`🔑 Generated wallet from mnemonic: ${address.slice(0, 8)}...`);

  // 4. Derive encryption key
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Use Node's Buffer for better type compatibility
  const keyBuffer = Buffer.from(encryptionKeySource, 'utf-8');

  const baseKey = await subtle.importKey(
    "raw",
    keyBuffer as any,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const encryptionKey = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: Buffer.from(salt) as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  // 5. Encrypt private key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: Buffer.from(iv) as any,
    },
    encryptionKey,
    Buffer.from(privateKeyBytes) as any
  );

  // 6. Encrypt mnemonic (for future recovery)
  const mnemonicIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedMnemonic = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: Buffer.from(mnemonicIv) as any,
    },
    encryptionKey,
    Buffer.from(mnemonic, 'utf-8') as any
  );

  console.log(`🔒 Wallet and mnemonic encrypted for user: ${userId.slice(0, 8)}...`);

  return {
    address,
    encrypted_privkey: Buffer.from(encrypted).toString("base64"),
    encrypted_mnemonic: Buffer.from(encryptedMnemonic).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    mnemonic_iv: Buffer.from(mnemonicIv).toString("base64"),
    salt: Buffer.from(salt).toString("base64"),
    mnemonic, // Return mnemonic to show user ONCE
  };
}

export async function POST(req: NextRequest) {
  try {
    // Get session from Better Auth
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

    // Check if user already has a wallet
    if (session.user.wallet_address) {
      return NextResponse.json(
        { error: "User already has a wallet" },
        { status: 400 }
      );
    }

    console.log(`🔐 Creating wallet for user: ${userId.slice(0, 8)}...`);

    // Generate encryption key source from social login
    const encryptionKeySource = `social - ${userId} `;

    // Generate encrypted wallet
    const encryptedWallet = await generateEncryptedWallet(userId, encryptionKeySource);

    // Store in Supabase using service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: dbError } = await supabase.from('encrypted_wallets').insert({
      id: nanoid(),
      user_id: userId,
      address: encryptedWallet.address,
      encrypted_privkey: encryptedWallet.encrypted_privkey,
      encrypted_mnemonic: encryptedWallet.encrypted_mnemonic,
      iv: encryptedWallet.iv,
      mnemonic_iv: encryptedWallet.mnemonic_iv,
      salt: encryptedWallet.salt,
      passkey_credential_id: encryptionKeySource,
    });

    if (dbError) {
      console.error('❌ Supabase error:', dbError);
      throw new Error(`Failed to store wallet: ${dbError.message} `);
    }

    // Update user record with wallet address
    await db
      .update(user)
      .set({
        wallet_address: encryptedWallet.address,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));

    console.log(`✅ Wallet created for user ${userId.slice(0, 8)}: ${encryptedWallet.address.slice(0, 8)}...`);

    return NextResponse.json({
      success: true,
      address: encryptedWallet.address,
      mnemonic: encryptedWallet.mnemonic // IMPORTANT: Only shown once during creation
    });
  } catch (error) {
    console.error("❌ Failed to create wallet:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
