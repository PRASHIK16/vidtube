import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { LayoutDashboard, Upload, BarChart2 } from 'lucide-react'

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-background">
      {/* Studio Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background z-50 flex items-center px-6 gap-4">
        <Link href="/" className="text-lg font-bold">
          <span className="text-red-500">Vid</span>Tube Studio
        </Link>
      </header>

      <div className="flex pt-14">
        {/* Studio Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-56 border-r bg-background p-4 space-y-1">
          <Link href="/studio" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium">
            <LayoutDashboard className="w-4 h-4" /> My Videos
          </Link>
          <Link href="/studio/upload" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium">
            <Upload className="w-4 h-4" /> Upload
          </Link>
          <Link href="/studio/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium text-muted-foreground">
            <BarChart2 className="w-4 h-4" /> Analytics
          </Link>
        </aside>

        <main className="ml-56 flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}