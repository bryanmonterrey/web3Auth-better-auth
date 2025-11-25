// @ts-ignore - betterAuth is exported but TypeScript isn't resolving it properly
import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { siwsClientPlugin } from "better-auth-siws/client";
import { passkeyClient } from "@better-auth/passkey/client";

// Create auth client instance
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3001/api/auth",
  plugins: [
    siwsClientPlugin(),
    passkeyClient(),
    customSessionClient(),
  ],
});


