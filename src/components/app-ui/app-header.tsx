'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, LayoutDashboard } from 'lucide-react'
import { ThemeSelect } from '@/components/theme/theme-select'
import { ClusterUiSelect } from '../cluster/cluster-ui'
import WalletButton from '@/components/wallet/wallet-button'
import Image from 'next/image'
import { authClient } from '@/lib/auth/client'
import { useAuthSession } from '@/hooks/use-auth-session'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export function AppHeader({ links = [] }: { links?: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const { data: session } = useAuthSession()

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="absolute top-0 fixed w-full z-50 px-4 py-2 dark:text-neutral-400">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-baseline gap-4">
          <Link className="" href="/">
            <Image src="/logo.svg" alt="Logo" width={35} height={35} />
          </Link>
          <div className="hidden md:flex items-center">
            <ul className="flex gap-4 flex-nowrap items-center">
              {links.map(({ label, path }) => (
                <li key={path}>
                  <Link
                    className={`hover:text-neutral-500 dark:hover:text-white ${isActive(path) ? 'text-neutral-500 dark:text-white' : ''}`}
                    href={path}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>


        <div className="flex items-center gap-2">
          {session?.user?.username && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/${session.user.username}`}>
                Dashboard
              </Link>
            </Button>
          )}
          <WalletButton />
          <div className="hidden">
            <ClusterUiSelect />
            <ThemeSelect />
          </div>
        </div>
      </div>
    </header>
  )
}
