import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

// Required for Next.js 16+ to properly handle request bodies
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Manually handle POST to ensure Content-Type header is preserved
export async function POST(request: NextRequest) {
  try {
    const headers = new Headers(request.headers);

    // Read the body once and store it
    const contentLength = headers.get("content-length");
    const hasBody = contentLength && parseInt(contentLength) > 0;

    let bodyContent: string | null = null;
    if (hasBody) {
      bodyContent = await request.text();
    }

    // Ensure Content-Type header exists
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    console.log("[Auth Route] POST to:", request.url);
    console.log("[Auth Route] Has body:", hasBody);
    console.log("[Auth Route] Body:", bodyContent);

    // Create a new request with the body as a string (or null if empty)
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: headers,
      body: bodyContent,
      duplex: hasBody ? ("half" as RequestDuplex) : undefined,
    });

    const response = await auth.handler(modifiedRequest);
    console.log("[Auth Route] Response status:", response.status);

    return response;
  } catch (error) {
    console.error("[Auth Route] Error:", error);
    console.error("[Auth Route] Error stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  }
}

export async function GET(request: NextRequest) {
  return auth.handler(request);
}
