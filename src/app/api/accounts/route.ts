import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { account } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export async function GET() {
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

        // Fetch user's linked accounts
        const userAccounts = await db
            .select({
                id: account.id,
                provider: account.providerId,
                providerId: account.accountId,
                createdAt: account.createdAt,
            })
            .from(account)
            .where(eq(account.userId, session.user.id));

        return NextResponse.json({
            success: true,
            accounts: userAccounts,
        });
    } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
