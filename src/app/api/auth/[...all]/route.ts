import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

// REQUIRED for Next.js 16 - DO NOT REMOVE
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Next.js 16 + Turbopack compatibility fix
export async function POST(request: NextRequest) {
  const headers = new Headers(request.headers);

  // Add Content-Type if missing (Next.js 16 strips it)
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  // Handle empty bodies properly to avoid JSON parse errors
  const body = request.headers.get("content-length") === "0" ? null : await request.text();

  const modifiedRequest = new Request(request.url, {
    method: "POST",
    headers,
    body,
    duplex: body ? "half" : undefined,
  } as RequestInit);

  return auth.handler(modifiedRequest);
}

export async function GET(request: NextRequest) {
  return auth.handler(request);
}
