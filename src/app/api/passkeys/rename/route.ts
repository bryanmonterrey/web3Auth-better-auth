// app/api/passkeys/rename/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { passkey } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { logWalletAccess } from "@/lib/security/audit-logger";

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
        const { passkeyId, name } = await req.json();

        if (!passkeyId || !name) {
            return NextResponse.json(
                { error: "Passkey ID and name are required" },
                { status: 400 }
            );
        }

        // Update passkey name (ensure it belongs to the user)
        const result = await db
            .update(passkey)
            .set({ name })
            .where(and(eq(passkey.id, passkeyId), eq(passkey.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Passkey not found" },
                { status: 404 }
            );
        }

        // Log the rename action
        await logWalletAccess({
            userId,
            action: "passkey_renamed",
            ipAddress,
            userAgent,
            success: true,
            metadata: { passkeyId, newName: name },
        });

        return NextResponse.json({
            success: true,
            passkey: result[0],
        });
    } catch (error) {
        console.error("Failed to rename passkey:", error);

        const session = await auth.api.getSession({ headers: await headers() });
        if (session?.user) {
            await logWalletAccess({
                userId: session.user.id,
                action: "passkey_renamed",
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
