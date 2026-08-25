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

export async function getLikedVideos() {
  const user = await getUser()
  if (!user) return []

  const liked = await prisma.videoLike.findMany({
    where: { userId: user.id, value: 1 },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      video: {
        include: { channel: { select: { id: true, name: true, handle: true, avatarUrl: true } } },
      },
    },
  })

  return liked.map(l => ({
    id: l.video.id,
    title: l.video.title,
    duration: l.video.duration,
    viewCount: Number(l.video.viewCount),
    publishedAt: l.video.publishedAt?.toISOString() ?? null,
    thumbnail: l.video.thumbnailUrl,
    channel: l.video.channel,
  }))
}