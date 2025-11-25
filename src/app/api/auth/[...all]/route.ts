import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

// Required for Next.js 16+ to properly handle request bodies
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Manually handle POST to ensure Content-Type header is preserved
export async function POST(request: NextRequest) {
  // Ensure Content-Type header exists
  const headers = new Headers(request.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  // Create a new request with the updated headers
  const modifiedRequest = new Request(request.url, {
    method: request.method,
    headers: headers,
    body: request.body,
    duplex: "half" as RequestDuplex,
  });

  return auth.handler(modifiedRequest);
}

export async function GET(request: NextRequest) {
  return auth.handler(request);
}
