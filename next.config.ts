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
};

export default nextConfig;
