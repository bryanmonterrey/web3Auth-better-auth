import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

// Required for Next.js 16+ to properly handle request bodies
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const { POST, GET } = toNextJsHandler(auth.handler);
