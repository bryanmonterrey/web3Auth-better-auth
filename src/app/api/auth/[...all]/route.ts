import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const headers = new Headers(request.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

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
