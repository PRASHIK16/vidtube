'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // called from Server Component — safe to ignore
          }
        },
      },
    }
  )
}

export async function signUpAction(data: {
  email: string
  password: string
  username: string
  displayName: string
}): Promise<{ error?: string; emailConfirmationRequired?: boolean }> {
  const { email, password, username, displayName } = data

  const existing = await prisma.profile.findUnique({ where: { username } })
  if (existing) return { error: 'Username is already taken' }

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }
  if (!authData.user) return { error: 'Sign up failed. Please try again.' }

  await prisma.profile.create({
    data: {
      id: authData.user.id,
      username,
      displayName,
      channel: {
        create: {
          handle: username,
          name: displayName,
        },
      },
    },
  })

  if (!authData.session) {
    return { emailConfirmationRequired: true }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInAction(data: {
  email: string
  password: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/sign-in')
}

export async function signInWithGoogleAction(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
  return {}
}