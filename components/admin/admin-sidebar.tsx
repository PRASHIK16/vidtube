'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Video, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 border-r min-h-screen sticky top-0 p-4 flex flex-col gap-1">
      <div className="font-bold text-base px-3 py-2 mb-2 text-red-500">⚙ Admin</div>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-red-500/10 text-red-500'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </aside>
  )
}