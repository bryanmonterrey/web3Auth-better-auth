import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    resolveAlias: {
      pino: "pino/browser",
      "pino/lib/transport": "pino/browser",
      "thread-stream": "./lib/empty.js",
    },
  },
};

export default nextConfig;
