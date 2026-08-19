'use server'
import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSubscriptionFeed() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (s) => { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) return []

  const subs = await prisma.subscription.findMany({
    where: { subscriberId: profile.id },
    select: { channelId: true },
  })
  const channelIds = subs.map((s) => s.channelId)
  if (!channelIds.length) return []

  const videos = await prisma.video.findMany({
    where: { channelId: { in: channelIds }, status: 'published', deletedAt: null },
    include: { channel: true, thumbnails: { where: { isSelected: true }, take: 1 } },
    orderBy: { publishedAt: 'desc' },
    take: 48,
  })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return videos.map((v) => ({
    id: v.id,
    title: v.title,
    duration: v.duration,
    viewCount: v.viewCount,
    publishedAt: v.publishedAt?.toISOString() ?? null,
    thumbnail: v.thumbnails[0]?.storagePath
      ? `${url}/storage/v1/object/public/thumbnails/${v.thumbnails[0].storagePath}`
      : null,
    channel: { id: v.channel.id, name: v.channel.name, handle: v.channel.handle, avatarUrl: v.channel.avatarUrl },
  }))
}