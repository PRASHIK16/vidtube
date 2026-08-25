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

export async function addToHistory(videoId: string) {
  const user = await getUser()
  if (!user) return

  await prisma.watchHistory.upsert({
    where: { userId_videoId: { userId: user.id, videoId } },
    update: { watchedAt: new Date() },
    create: { userId: user.id, videoId },
  })
}

export async function getWatchHistory() {
  const user = await getUser()
  if (!user) return []

  const history = await prisma.watchHistory.findMany({
    where: { userId: user.id },
    orderBy: { watchedAt: 'desc' },
    take: 50,
    include: {
      video: {
        include: { channel: { select: { id: true, name: true, handle: true, avatarUrl: true } } },
      },
    },
  })

  return history.map(h => ({
    id: h.id,
    watchedAt: h.watchedAt,
    video: {
      id: h.video.id,
      title: h.video.title,
      duration: h.video.duration,
      viewCount: Number(h.video.viewCount),
      publishedAt: h.video.publishedAt?.toISOString() ?? null,
      thumbnail: h.video.thumbnailUrl,
      channel: h.video.channel,
    },
  }))
}

export async function clearHistory() {
  const user = await getUser()
  if (!user) return
  await prisma.watchHistory.deleteMany({ where: { userId: user.id } })
}