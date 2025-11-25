// @ts-ignore - betterAuth is exported but TypeScript isn't resolving it properly
import { createAuthClient } from "better-auth/react";
import { usernameClient, customSessionClient, multiSessionClient } from "better-auth/client/plugins";
import { siwsClientPlugin } from "better-auth-siws/client";
import { passkeyClient } from "@better-auth/passkey/client";

// Custom fetch that ensures Content-Type header is always set
const customFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);

  // Always ensure Content-Type is set for POST requests
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
};

// Create auth client instance
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3001/api/auth",
  fetchOptions: {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  },
  fetch: customFetch,
  plugins: [
    usernameClient(),
    siwsClientPlugin(),
    passkeyClient(),
    customSessionClient(),
    multiSessionClient(),
  ],
});


