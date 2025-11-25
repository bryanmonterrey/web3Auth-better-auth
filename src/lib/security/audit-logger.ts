// lib/security/audit-logger.ts
import { db } from "@/db";
import { wallet_access_log } from "@/db/schema";
import { nanoid } from "nanoid";

export type AuditAction =
    | "reveal_phrase"
    | "export_key"
    | "passkey_added"
    | "passkey_removed"
    | "passkey_renamed";

interface LogWalletAccessParams {
    userId: string;
    action: AuditAction;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}

/**
 * Log a wallet-related security event
 */
export async function logWalletAccess({
    userId,
    action,
    ipAddress,
    userAgent,
    success = true,
    errorMessage,
    metadata,
}: LogWalletAccessParams): Promise<void> {
    try {
        await db.insert(wallet_access_log).values({
            id: nanoid(),
            user_id: userId,
            action,
            ip_address: ipAddress,
            user_agent: userAgent,
            success,
            error_message: errorMessage,
            metadata: metadata ? JSON.stringify(metadata) : null,
        });

        console.log(`📝 Audit log: ${action} by user ${userId.slice(0, 8)}... - ${success ? 'success' : 'failed'}`);
    } catch (error) {
        // Don't throw - logging failure shouldn't break the main operation
        console.error("Failed to write audit log:", error);
    }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
    const { eq } = await import("drizzle-orm");

    return await db
        .select()
        .from(wallet_access_log)
        .where(eq(wallet_access_log.user_id, userId))
        .orderBy(wallet_access_log.created_at)
        .limit(limit);
}

// Rate limiting using in-memory cache
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitCache.entries()) {
        if (now > entry.resetAt) {
            rateLimitCache.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number; // Time window in milliseconds
}

const RATE_LIMITS: Record<AuditAction, RateLimitConfig> = {
    reveal_phrase: { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    export_key: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    passkey_added: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    passkey_removed: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    passkey_renamed: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
};

/**
 * Check if user has exceeded rate limit for an action
 * @returns true if rate limit exceeded, false otherwise
 */
export function checkRateLimit(userId: string, action: AuditAction): boolean {
    const config = RATE_LIMITS[action];
    if (!config) return false; // No limit configured

    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = rateLimitCache.get(key);

    if (!entry || now > entry.resetAt) {
        // First attempt or window expired
        rateLimitCache.set(key, {
            count: 1,
            resetAt: now + config.windowMs,
        });
        return false;
    }

    if (entry.count >= config.maxAttempts) {
        console.warn(`⚠️ Rate limit exceeded: ${action} by user ${userId.slice(0, 8)}...`);
        return true; // Rate limit exceeded
    }

    // Increment count
    entry.count++;
    return false;
}

/**
 * Get remaining attempts for a user action
 */
export function getRemainingAttempts(userId: string, action: AuditAction): number {
    const config = RATE_LIMITS[action];
    if (!config) return Infinity;

    const key = `${userId}:${action}`;
    const entry = rateLimitCache.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetAt) {
        return config.maxAttempts;
    }

    return Math.max(0, config.maxAttempts - entry.count);
}

/**
 * Get time until rate limit resets (in seconds)
 */
export function getResetTime(userId: string, action: AuditAction): number {
    const key = `${userId}:${action}`;
    const entry = rateLimitCache.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetAt) {
        return 0;
    }

    return Math.ceil((entry.resetAt - now) / 1000);
}
