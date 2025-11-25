// 💎 PRODUCTION-READY | Solana SIWS | Drizzle/Supabase PG | Next.js
// 🔒 Single-Session | Upsert Wallet | Role Security | Cookie Cache
// 📱 Reactive Client | RSC Server Sessions | Custom Response (canAdmin)

// @ts-ignore - betterAuth is exported but TypeScript isn't resolving it properly
import { betterAuth } from "better-auth";
import { siwsPlugin } from "better-auth-siws";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { customSession, multiSession } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import { user, session, account, verification, passkey as passkeyTable } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { APIError } from "better-call";
import { restrictedUsernames } from "./usernames";

// 🛠️ CONFIG (Type-Safe | Infer for customSession)
const config = {
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3001/api/auth",
  basePath: "/api/auth",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001",
    "http://localhost:3000",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,          // 7d
    updateAge: 60 * 60 * 24,              // Refresh daily
    cookieCache: { enabled: true, maxAge: 30 * 60 },  // 30min 🚀
    freshAge: 60 * 60 * 24,               // 1d fresh
  },
  user: {
    additionalFields: {
      avatar_url: { type: "string" as const, required: false },
      wallet_address: { type: "string" as const, required: false },
      bio: { type: "string" as const, required: false },
      role: { type: "string" as const, defaultValue: "user", input: false },
      username: { type: "string" as const, required: false },
      gender: { type: "boolean" as const, required: false },
      last_signed_in: { type: "date" as const, input: false },
    },
  },
} satisfies any;


// 💎 CORE AUTH INSTANCE
export const auth = betterAuth({
  ...config,

  // 🗄️ Supabase PG (Drizzle)
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, passkey: passkeyTable },
  }),

  // 🔒 Advanced Configuration (Next.js 16 compatibility)
  advanced: {
    disableCSRFCheck: false,
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // 🔐 Social Providers (Google, Twitter, Discord)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    },
  },

  // 🚀 PLUGINS (Order: Username → SIWS → Passkey → Custom → Cookies LAST)
  plugins: [
    // 🏷️ Username with validation
    username({
      minUsernameLength: 4,
      maxUsernameLength: 15,
      usernameValidator: (value) => !restrictedUsernames.includes(value),
      usernameNormalization: (value) => value.toLowerCase(),
    }),

    // 🔑 Solana SIWS (Nonce + Verify)
    siwsPlugin({
      domain: "localhost:3001",
      statement: "Sign in with Solana to the app.",
      nonceTtlSeconds: 300,  // 5min
    }),

    // 🔐 Passkeys (Face ID / Touch ID)
    passkey({
      rpID: process.env.NEXT_PUBLIC_AUTH_DOMAIN ?? "localhost",
      rpName: process.env.NEXT_PUBLIC_APP_NAME ?? "App",
      origin: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001",
    }),

    // 📱 Custom Session (Infer: user.canAdmin + fresh data from DB)
    customSession(
      async ({ user: sessionUser, session }) => {
        // Fetch fresh user data from database to get all updated fields
        const [freshUserData] = await db
          .select()
          .from(user)
          .where(eq(user.id, sessionUser.id))
          .limit(1);

        const userData = freshUserData || sessionUser;

        return {
          user: {
            ...sessionUser,
            wallet_address: userData.wallet_address,
            username: userData.username,
            avatar_url: userData.avatar_url,
            role: userData.role,
            canAdmin: userData.role === "admin",
          },
        };
      },
      config
    ),

    // 🔄 Multi-Session (Allow up to 5 sessions per user)
    multiSession({
      maximumSessions: 5,
    }),

    // **LAST** (Auto RSC/Server Actions Cookies)
    nextCookies(),
  ],

  // 🔥 DATABASE HOOKS (Upsert + Single-Session + Security)
  databaseHooks: {
    user: {
      create: {
        before: async (userData: any, ctx: any) => {
          const walletAddress = ctx.body?.address;
          const now = new Date();

          const isPasskeyAuth = !walletAddress && userData.email;

          if (isPasskeyAuth) {
            return {
              data: {
                ...userData,
                id: crypto.randomUUID(),
                wallet_address: null,
                role: "user",
                gender: false,
                createdAt: now,
                updatedAt: now,
                last_signed_in: now,
              },
            };
          }

          if (!walletAddress) {
            throw new APIError("BAD_REQUEST", { message: "No wallet address" });
          }



          // 🔍 EXISTING? → UPSERT (Wallet = Single User)
          const [existingUser] = await db
            .select()
            .from(user)
            .where(eq(user.wallet_address, walletAddress))
            .limit(1);

          if (existingUser) {
            return {
              data: {
                ...userData,
                id: existingUser.id,
                wallet_address: walletAddress,
                role: existingUser.role ?? "user",
                gender: existingUser.gender ?? false,
                updatedAt: now,
                last_signed_in: now,
              },
            };
          }


          return {
            data: {
              ...userData,
              id: crypto.randomUUID(),
              wallet_address: walletAddress,
              role: "user",
              gender: false,
              createdAt: now,
              updatedAt: now,
              last_signed_in: now,
            },
          };
        },
        after: async (user: any) => { },
      },
    },

    session: {
      create: {
        before: async (sessionData: any, ctx: any) => {

          if (sessionData.userId) {
            // 📅 LAST SIGN-IN (Multi-session: don't delete old sessions)
            await db
              .update(user)
              .set({ last_signed_in: new Date(), updatedAt: new Date() })
              .where(eq(user.id, sessionData.userId));

            const address = ctx.context?.address ?? ctx.body?.address;

            if (!address) {
              return { data: sessionData };
            }

            const [dbUser] = await db
              .select({ role: user.role, wallet_address: user.wallet_address })
              .from(user)
              .where(eq(user.id, sessionData.userId));

            if (!dbUser || !["admin", "user"].includes(dbUser.role ?? "")) {
              throw new APIError("UNAUTHORIZED", { message: "Invalid user" });
            }

            if (dbUser.wallet_address && dbUser.wallet_address !== address) {
              throw new APIError("UNAUTHORIZED", { message: "Wallet mismatch" });
            }

          }

          return { data: sessionData };
        },
      },
    },
  },
});
