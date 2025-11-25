'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Home } from 'lucide-react'
import { ThemeSelect } from '@/components/theme/theme-select'
import { ClusterUiSelect } from '../cluster/cluster-ui'
import WalletButton from '@/components/wallet/wallet-button'
import Image from 'next/image'

export function DashboardHeader() {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="relative z-50 px-4 py-2 dark:text-neutral-400 border-b dark:border-neutral-800">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-baseline gap-4">
          <Link className="" href="/">
            <Image src="/logo.svg" alt="Logo" width={35} height={35} />
          </Link>
          <div className="hidden md:flex items-center">
            <span className="text-sm text-neutral-500">Dashboard</span>
          </div>
        </div>

        <Button variant="outline" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
          <WalletButton />
          <ClusterUiSelect />
          <ThemeSelect />
        </div>

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-[52px] bottom-0 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-sm">
            <div className="flex flex-col p-4 gap-4 border-t dark:border-neutral-800">
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/" onClick={() => setShowMenu(false)}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
              <div className="flex flex-col gap-4">
                <WalletButton />
                <ClusterUiSelect />
                <ThemeSelect />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
