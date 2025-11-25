// app/api/passkeys/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { passkey } from "@/db/schema/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
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

        // Fetch user's passkeys
        const userPasskeys = await db
            .select({
                id: passkey.id,
                name: passkey.name,
                deviceType: passkey.deviceType,
                createdAt: passkey.createdAt,
                backedUp: passkey.backedUp,
            })
            .from(passkey)
            .where(eq(passkey.userId, userId))
            .orderBy(desc(passkey.createdAt));

        return NextResponse.json({
            success: true,
            passkeys: userPasskeys,
        });
    } catch (error) {
        console.error("Failed to list passkeys:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
