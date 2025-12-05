import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@walletconnect/universal-provider",
    "@walletconnect/solana-adapter",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-wallets",
  ],
  serverExternalPackages: ["pino", "thread-stream"],
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
