'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, Upload, Bell } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { signOutAction } from '@/lib/actions/auth'

export function Header({ user }: { user: User | null }) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b flex items-center px-4 gap-4">
      <Link href="/" className="font-bold text-xl min-w-[180px] flex items-center gap-0.5">
        <span className="text-red-500">Vid</span>Tube
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl flex">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search"
          className="flex-1 rounded-l-full border border-r-0 border-input bg-background px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className="px-5 rounded-r-full border border-input bg-muted hover:bg-accent transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <>
            <Link
              href="/studio/upload"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-input hover:bg-accent text-sm transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Link>
            <Link href="/notifications" className="p-2 rounded-full hover:bg-accent transition-colors">
              <Bell className="h-5 w-5" />
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="px-4 py-1.5 rounded-full border border-blue-500 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}