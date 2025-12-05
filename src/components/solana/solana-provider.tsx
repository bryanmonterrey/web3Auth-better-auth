'use client'

import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import {
  WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import dynamic from 'next/dynamic'
import { ReactNode, useCallback, useMemo } from 'react'
import { ClusterNetwork, useCluster } from '../cluster/cluster-data-access'
import '@solana/wallet-adapter-react-ui/styles.css'
import { AnchorProvider } from '@coral-xyz/anchor'

export { default as WalletButton } from '../wallet/wallet-button';

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => {
    if (cluster.endpoint.startsWith('/')) {
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${cluster.endpoint}`
      }
      return `http://localhost:3000${cluster.endpoint}`
    }
    return cluster.endpoint
  }, [cluster])
  const network = useMemo(() => {
    switch (cluster.network) {
      case ClusterNetwork.Mainnet:
        return WalletAdapterNetwork.Mainnet;
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, [cluster.network])
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  const wallets = useMemo(() => [
    new WalletConnectWalletAdapter({
      network,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '8d7de790d4225d0bfd02ad68ad524d1f',
        metadata: {
          name: process.env.NEXT_PUBLIC_APP_NAME || 'nextJS-web3Auth',
          description: 'Connect wallet',
          url: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || 'https://watchparty.xyz'),
          icons: ['https://watchparty.xyz/favicon.ico']
        }
      },
    }),
  ], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}
