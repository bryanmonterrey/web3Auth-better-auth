import { router } from "@/server/trpc";
import { accountRouter } from "./account";
import { auditLogRouter } from "./auditLog";
import { passkeyRouter } from "./passkey";
import { walletRouter } from "./wallet";

/**
 * Root application router
 * Merges all sub-routers together
 */
export const appRouter = router({
    account: accountRouter,
    auditLog: auditLogRouter,
    passkey: passkeyRouter,
    wallet: walletRouter,
});

/**
 * Export type definition for the router
 * This is used on the client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
