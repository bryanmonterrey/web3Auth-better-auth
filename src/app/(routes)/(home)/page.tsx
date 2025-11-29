import { getServerSession } from "@/lib/auth/get-session";
import * as React from "react"

export default async function Home() {
  const me = await getServerSession();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center justify-center h-full px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            Web3 Authentication
          </h1>

          {me?.user ? (
            // Logged in state
            <div className="space-y-3">
              <p className="text-xl md:text-2xl text-neutral-400">
                Logged in as
              </p>
              <div className="inline-block px-6 py-3 bg-matte rounded-full">
                <p className="text-lg md:text-xl font-mono text-white">
                  {me.user.wallet_address ? shortenAddress(me.user.wallet_address) : me.user.email}
                </p>
              </div>
            </div>
          ) : (
            // Logged out state
            <div className="space-y-4">
              <p className="text-xl md:text-2xl text-neutral-400">
                Powered by
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm md:text-base">
                <span className="px-4 py-2 bg-purple-500/10 rounded-full text-purple-400">
                  Better Auth
                </span>
                <span className="px-4 py-2 bg-blue-500/10 rounded-full text-blue-400">
                  Drizzle ORM
                </span>
                <span className="px-4 py-2 bg-green-500/10 rounded-full text-green-400">
                  Supabase
                </span>
                <span className="px-4 py-2 bg-pink-500/10 rounded-full text-pink-400">
                  Solana
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
