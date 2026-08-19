'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Search, Upload, Bell, LogOut } from 'lucide-react'
import { signOutAction } from '@/lib/actions/auth'
import { ThemeToggle } from './theme-toggle'

export function Header({ user }: { user: User | null }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b z-50 flex items-center gap-4 px-4">
      <Link href="/" className="text-xl font-bold flex-shrink-0">
        <span className="text-red-500">Vid</span>Tube
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto flex">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="flex-1 border rounded-l-full px-4 py-1.5 text-sm bg-background focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="border border-l-0 rounded-r-full px-4 py-1.5 bg-muted hover:bg-muted/80">
          <Search className="w-4 h-4" />
        </button>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        {user ? (
          <>
            <Link href="/studio/upload" className="p-2 rounded-full hover:bg-muted">
              <Upload className="w-5 h-5" />
            </Link>
            <Link href="/notifications" className="p-2 rounded-full hover:bg-muted">
              <Bell className="w-5 h-5" />
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="w-8 h-8 rounded-full bg-red-500 text-white font-semibold text-sm flex items-center justify-center">
                {user.email?.charAt(0).toUpperCase()}
              </button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="border px-4 py-1.5 rounded-full text-sm font-medium hover:bg-muted">
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}