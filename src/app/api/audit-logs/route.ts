import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { wallet_access_log } from "@/db/schema/auth";
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

        // Fetch user's audit logs (last 50 entries)
        const logs = await db
            .select({
                id: wallet_access_log.id,
                action: wallet_access_log.action,
                ipAddress: wallet_access_log.ip_address,
                userAgent: wallet_access_log.user_agent,
                success: wallet_access_log.success,
                errorMessage: wallet_access_log.error_message,
                metadata: wallet_access_log.metadata,
                createdAt: wallet_access_log.created_at,
            })
            .from(wallet_access_log)
            .where(eq(wallet_access_log.user_id, userId))
            .orderBy(desc(wallet_access_log.created_at))
            .limit(50);

        return NextResponse.json({
            success: true,
            logs,
        });
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
