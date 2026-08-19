'use server'
import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function addToHistory(videoId: string) {
  const profile = await getProfile()
  if (!profile) return
  await prisma.watchHistory.upsert({
    where: { profileId_videoId: { profileId: profile.id, videoId } },
    update: { watchedAt: new Date() },
    create: { profileId: profile.id, videoId, watchedAt: new Date() },
  })
}

export async function getWatchHistory() {
  const profile = await getProfile()
  if (!profile) return []
  const history = await prisma.watchHistory.findMany({
    where: { profileId: profile.id },
    include: {
      video: {
        include: { channel: true, thumbnails: { where: { isSelected: true }, take: 1 } },
      },
    },
    orderBy: { watchedAt: 'desc' },
    take: 48,
  })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return history
    .filter((h) => h.video.status === 'published' && !h.video.deletedAt)
    .map((h) => ({
      id: h.video.id,
      title: h.video.title,
      duration: h.video.duration,
      viewCount: h.video.viewCount,
      publishedAt: h.video.publishedAt?.toISOString() ?? null,
      watchedAt: h.watchedAt.toISOString(),
      thumbnail: h.video.thumbnails[0]?.storagePath
        ? `${url}/storage/v1/object/public/thumbnails/${h.video.thumbnails[0].storagePath}`
        : null,
      channel: { id: h.video.channel.id, name: h.video.channel.name, handle: h.video.channel.handle, avatarUrl: h.video.channel.avatarUrl },
    }))
}

export async function clearHistory() {
  const profile = await getProfile()
  if (!profile) return
  await prisma.watchHistory.deleteMany({ where: { profileId: profile.id } })
}