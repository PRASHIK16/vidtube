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

export async function toggleWatchLater(videoId: string) {
  const user = await getUser()
  if (!user) return { added: false }

  const existing = await prisma.watchLater.findUnique({
    where: { userId_videoId: { userId: user.id, videoId } },
  })

  if (existing) {
    await prisma.watchLater.delete({ where: { userId_videoId: { userId: user.id, videoId } } })
    return { added: false }
  } else {
    await prisma.watchLater.create({ data: { userId: user.id, videoId } })
    return { added: true }
  }
}

export async function isInWatchLater(videoId: string) {
  const user = await getUser()
  if (!user) return false
  const item = await prisma.watchLater.findUnique({
    where: { userId_videoId: { userId: user.id, videoId } },
  })
  return !!item
}

export async function getWatchLater() {
  const user = await getUser()
  if (!user) return []

  const items = await prisma.watchLater.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: 'desc' },
    take: 50,
    include: {
      video: {
        include: { channel: { select: { id: true, name: true, handle: true, avatarUrl: true } } },
      },
    },
  })

  return items.map(i => ({
    id: i.video.id,
    title: i.video.title,
    duration: i.video.duration,
    viewCount: Number(i.video.viewCount),
    publishedAt: i.video.publishedAt?.toISOString() ?? null,
    thumbnail: i.video.thumbnailUrl,
    channel: i.video.channel,
  }))
}