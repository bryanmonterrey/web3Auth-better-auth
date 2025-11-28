'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, Home } from 'lucide-react'
import { ThemeSelect } from '@/components/theme/theme-select'
import { ClusterUiSelect } from '../cluster/cluster-ui'
import WalletButton from '@/components/wallet/wallet-button'
import Image from 'next/image'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export function DashboardHeader() {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="w-full absolute bg-transparent top-0 fixed z-50 px-4 py-2 dark:text-neutral-400">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link className="" href="/">
            <Image src="/logo.svg" alt="Logo" width={35} height={35} />
          </Link>
        </div>


        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              Exit dashboard
            </Link>
          </Button>
          <WalletButton />
          <div className="hidden">
            <ClusterUiSelect />
            <ThemeSelect />
          </div>
        </div>

        <Drawer open={showMenu} onOpenChange={setShowMenu} direction="bottom">
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
            <Menu className="h-6 w-6" />
          </Button>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle></DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col p-4 gap-4">
              <Button variant="outline" className="justify-center" asChild>
                <Link href="/" onClick={() => setShowMenu(false)}>
                  Exit dashboard
                </Link>
              </Button>
              <div className="flex flex-col gap-4">
                <WalletButton />
                <ClusterUiSelect />
                <ThemeSelect />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  )
}
