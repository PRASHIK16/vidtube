'use server'
import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (s) => { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.profile.findUnique({ where: { userId: user.id } })
}

export async function getNotifications() {
  const profile = await getProfile()
  if (!profile) return []
  return prisma.notification.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function markAllRead() {
  const profile = await getProfile()
  if (!profile) return
  await prisma.notification.updateMany({
    where: { profileId: profile.id, isRead: false },
    data: { isRead: true },
  })
  revalidatePath('/notifications')
}