import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=No+code+provided`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=Auth+failed`)
  }

  const existing = await prisma.profile.findUnique({ where: { id: data.user.id } })

  if (!existing) {
    const email = data.user.email ?? ''
    let username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
    let counter = 1
    while (await prisma.profile.findUnique({ where: { username } })) {
      username = `${username.replace(/\d+$/, '')}${counter++}`
    }
    const displayName = data.user.user_metadata?.full_name ?? username

    await prisma.profile.create({
      data: {
        id: data.user.id,
        username,
        displayName,
        avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        channel: {
          create: { handle: username, name: displayName },
        },
      },
    })
  }

  return NextResponse.redirect(`${origin}${next}`)
}
