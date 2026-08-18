'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Clock, ThumbsUp, BookMarked, Clapperboard, Flame } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/trending', icon: Flame, label: 'Trending' },
]

const LIBRARY = [
  { href: '/history', icon: Clock, label: 'History' },
  { href: '/liked', icon: ThumbsUp, label: 'Liked videos' },
  { href: '/watch-later', icon: BookMarked, label: 'Watch later' },
  { href: '/studio', icon: Clapperboard, label: 'Studio' },
]

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname()
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent',
        pathname === href
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 border-r bg-background overflow-y-auto py-3 px-2">
      <nav className="space-y-1">
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      <div className="mt-4 pt-4 border-t space-y-1">
        <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Library
        </p>
        {LIBRARY.map(item => <NavItem key={item.href} {...item} />)}
      </div>
    </aside>
  )
}