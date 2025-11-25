// app/api/passkeys/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { passkey } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { logWalletAccess, checkRateLimit, getResetTime } from "@/lib/security/audit-logger";

export async function POST(req: NextRequest) {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
        // Verify user session
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

        // Check rate limit
        if (checkRateLimit(userId, "passkey_removed")) {
            const resetTime = getResetTime(userId, "passkey_removed");
            return NextResponse.json(
                {
                    error: `Rate limit exceeded. Please try again in ${Math.ceil(resetTime / 60)} minutes.`,
                    resetTime
                },
                { status: 429 }
            );
        }

        const { passkeyId } = await req.json();

        if (!passkeyId) {
            return NextResponse.json(
                { error: "Passkey ID is required" },
                { status: 400 }
            );
        }

        // Check if this is the user's last passkey
        const userPasskeys = await db
            .select()
            .from(passkey)
            .where(eq(passkey.userId, userId));

        if (userPasskeys.length <= 1) {
            await logWalletAccess({
                userId,
                action: "passkey_removed",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: "Cannot delete last passkey",
            });

            return NextResponse.json(
                { error: "Cannot delete your last passkey" },
                { status: 400 }
            );
        }

        // Delete the passkey (ensure it belongs to the user)
        const result = await db
            .delete(passkey)
            .where(and(eq(passkey.id, passkeyId), eq(passkey.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Passkey not found" },
                { status: 404 }
            );
        }

        // Log the deletion
        await logWalletAccess({
            userId,
            action: "passkey_removed",
            ipAddress,
            userAgent,
            success: true,
            metadata: { passkeyId },
        });

        return NextResponse.json({
            success: true,
            message: "Passkey deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete passkey:", error);

        const session = await auth.api.getSession({ headers: await headers() });
        if (session?.user) {
            await logWalletAccess({
                userId: session.user.id,
                action: "passkey_removed",
                ipAddress,
                userAgent,
                success: false,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
