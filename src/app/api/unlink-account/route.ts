import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { logWalletAccess } from "@/lib/security/audit-logger";

export async function POST(req: NextRequest) {
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

        const { accountId, provider } = await req.json();

        if (!accountId || !provider) {
            return NextResponse.json(
                { error: "Account ID and provider are required" },
                { status: 400 }
            );
        }

        // Check if this is the last authentication method
        const userAccounts = await db
            .select()
            .from(account)
            .where(eq(account.userId, session.user.id));

        const hasWallet = !!session.user.wallet_address;
        const authMethodsCount = userAccounts.length + (hasWallet ? 1 : 0);

        if (authMethodsCount <= 1) {
            return NextResponse.json(
                { error: "Cannot unlink your only authentication method" },
                { status: 400 }
            );
        }

        // Delete the account link
        await db
            .delete(account)
            .where(
                and(
                    eq(account.id, accountId),
                    eq(account.userId, session.user.id)
                )
            );

        // Log the action
        const headersList = await headers();
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        await logWalletAccess({
            userId: session.user.id,
            action: "account_unlinked" as any,
            ipAddress,
            userAgent,
            success: true,
            metadata: { provider },
        });

        return NextResponse.json({
            success: true,
            message: "Account unlinked successfully",
        });
    } catch (error) {
        console.error("Failed to unlink account:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
