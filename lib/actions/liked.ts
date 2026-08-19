'use server'
import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getLikedVideos() {
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

  const likes = await prisma.videoLike.findMany({
    where: { profileId: profile.id, type: 'like' },
    include: {
      video: {
        include: { channel: true, thumbnails: { where: { isSelected: true }, take: 1 } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 48,
  })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return likes
    .filter((l) => l.video.status === 'published' && !l.video.deletedAt)
    .map((l) => ({
      id: l.video.id,
      title: l.video.title,
      duration: l.video.duration,
      viewCount: l.video.viewCount,
      publishedAt: l.video.publishedAt?.toISOString() ?? null,
      thumbnail: l.video.thumbnails[0]?.storagePath
        ? `${url}/storage/v1/object/public/thumbnails/${l.video.thumbnails[0].storagePath}`
        : null,
      channel: { id: l.video.channel.id, name: l.video.channel.name, handle: l.video.channel.handle, avatarUrl: l.video.channel.avatarUrl },
    }))
}