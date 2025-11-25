// lib/walletEncryption.ts
// 🔐 Encrypted Solana Wallet Generation & Management
// AES-256-GCM encryption with passkey-derived keys

import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";

// Use browser's Web Crypto API (works in client-side components)
const subtle = globalThis.crypto?.subtle;

export interface EncryptedWallet {
  address: string;
  encrypted_privkey: string;
  iv: string;
  salt: string;
}

/**
 * Generate a new Solana keypair and encrypt it
 * @param userId - User ID for salt derivation
 * @param passkeyCredentialId - Passkey credential ID for key derivation
 * @returns Encrypted wallet data
 */
export async function generateEncryptedWallet(
  userId: string,
  passkeyCredentialId: string
): Promise<EncryptedWallet> {
  if (!subtle) {
    throw new Error("Web Crypto API not available. Please use HTTPS or localhost.");
  }

  // 1. Generate Solana Ed25519 keypair
  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();
  const privateKeyBytes = keypair.secretKey;

  console.log(`🔑 Generated wallet: ${address.slice(0, 8)}...`);

  // 2. Derive encryption key from passkey credential
  const salt = new TextEncoder().encode(userId + passkeyCredentialId);
  const encryptionKey = await deriveEncryptionKey(passkeyCredentialId, salt);

  // 3. Encrypt private key
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM needs 12 bytes
  const encrypted = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    encryptionKey,
    privateKeyBytes as any
  );

  console.log(`🔒 Wallet encrypted for user: ${userId.slice(0, 8)}...`);

  return {
    address,
    encrypted_privkey: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    salt: Buffer.from(salt).toString("base64"),
  };
}

/**
 * Decrypt an encrypted wallet
 * @param encryptedWallet - Encrypted wallet data
 * @param passkeyCredentialId - Passkey credential ID for key derivation
 * @returns Solana Keypair
 */
export async function decryptWallet(
  encryptedWallet: EncryptedWallet,
  passkeyCredentialId: string
): Promise<Keypair> {
  if (!subtle) {
    throw new Error("Web Crypto API not available. Please use HTTPS or localhost.");
  }

  try {
    console.log(`🔓 Decrypting wallet: ${encryptedWallet.address.slice(0, 8)}...`);

    // 1. Derive decryption key (same as encryption)
    const salt = Buffer.from(encryptedWallet.salt, "base64");
    const decryptionKey = await deriveEncryptionKey(passkeyCredentialId, salt);

    // 2. Decrypt private key
    const encrypted = Buffer.from(encryptedWallet.encrypted_privkey, "base64");
    const iv = Buffer.from(encryptedWallet.iv, "base64");

    const decrypted = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      decryptionKey,
      encrypted as any
    );

    // 3. Restore keypair
    const keypair = Keypair.fromSecretKey(new Uint8Array(decrypted));

    console.log(`✅ Wallet decrypted: ${keypair.publicKey.toBase58().slice(0, 8)}...`);

    return keypair;
  } catch (error) {
    console.error("❌ Failed to decrypt wallet:", error);
    throw new Error("Failed to decrypt wallet - invalid credentials");
  }
}

/**
 * Derive AES-256 encryption key from passkey credential
 * Uses PBKDF2 with SHA-256
 */
async function deriveEncryptionKey(
  passkeyCredentialId: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  if (!subtle) {
    throw new Error("Web Crypto API not available. Please use HTTPS or localhost.");
  }

  // Import the passkey credential as base key
  const baseKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(passkeyCredentialId) as any,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive AES-256-GCM key
  const derivedKey = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000, // OWASP recommended minimum
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

  return derivedKey;
}

/**
 * Sign a message with decrypted wallet (for SIWS)
 */
export async function signMessageWithEncryptedWallet(
  encryptedWallet: EncryptedWallet,
  message: Uint8Array,
  passkeyCredentialId: string
): Promise<Uint8Array> {
  const keypair = await decryptWallet(encryptedWallet, passkeyCredentialId);

  // Sign the message using nacl
  const signature = nacl.sign.detached(message, keypair.secretKey);

  console.log(`✍️ Message signed with wallet: ${encryptedWallet.address.slice(0, 8)}...`);

  return signature;
}
