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

export async function toggleWatchLater(videoId: string) {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }

  const existing = await prisma.watchLater.findUnique({
    where: { profileId_videoId: { profileId: profile.id, videoId } },
  })

  if (existing) {
    await prisma.watchLater.delete({ where: { id: existing.id } })
    revalidatePath('/watch-later')
    return { saved: false }
  } else {
    await prisma.watchLater.create({ data: { profileId: profile.id, videoId } })
    revalidatePath('/watch-later')
    return { saved: true }
  }
}

export async function isInWatchLater(videoId: string): Promise<boolean> {
  const profile = await getProfile()
  if (!profile) return false
  const item = await prisma.watchLater.findUnique({
    where: { profileId_videoId: { profileId: profile.id, videoId } },
  })
  return !!item
}

export async function getWatchLater() {
  const profile = await getProfile()
  if (!profile) return []
  const items = await prisma.watchLater.findMany({
    where: { profileId: profile.id },
    include: {
      video: {
        include: { channel: true, thumbnails: { where: { isSelected: true }, take: 1 } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return items
    .filter((i) => i.video.status === 'published' && !i.video.deletedAt)
    .map((i) => ({
      id: i.video.id,
      title: i.video.title,
      duration: i.video.duration,
      viewCount: i.video.viewCount,
      publishedAt: i.video.publishedAt?.toISOString() ?? null,
      thumbnail: i.video.thumbnails[0]?.storagePath
        ? `${url}/storage/v1/object/public/thumbnails/${i.video.thumbnails[0].storagePath}`
        : null,
      channel: { id: i.video.channel.id, name: i.video.channel.name, handle: i.video.channel.handle, avatarUrl: i.video.channel.avatarUrl },
    }))
}