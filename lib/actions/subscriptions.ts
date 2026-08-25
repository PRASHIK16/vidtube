'use server'

import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSubscriptionFeed() {
  const user = await getUser()
  if (!user) return []

  const subs = await prisma.subscription.findMany({
    where: { subscriberId: user.id },
    select: { channelId: true },
  })

  const channelIds = subs.map(s => s.channelId)
  if (channelIds.length === 0) return []

  const videos = await prisma.video.findMany({
    where: { channelId: { in: channelIds }, visibility: 'public', status: 'ready' },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: {
      channel: { select: { id: true, name: true, handle: true, avatarUrl: true } },
    },
  })

  return videos.map(v => ({
    id: v.id,
    title: v.title,
    duration: v.duration,
    viewCount: Number(v.viewCount),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    thumbnail: v.thumbnailUrl,
    channel: v.channel,
  }))
}