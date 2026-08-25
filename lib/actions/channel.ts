'use server'

import { prisma } from '@/lib/db/prisma'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function getChannelByHandle(handle: string) {
  const channel = await prisma.channel.findUnique({
    where: { handle },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      videos: {
        where: { visibility: 'public', status: 'ready' },
        orderBy: { publishedAt: 'desc' },
        take: 30,
        include: {
          channel: { select: { id: true, name: true, handle: true, avatarUrl: true } },
        },
      },
      _count: { select: { subscriptions: true, videos: true } },
    },
  })

  if (!channel) return null

  return {
    ...channel,
    totalViews: Number(channel.totalViews),
    videos: channel.videos.map(v => ({
      id: v.id,
      title: v.title,
      duration: v.duration,
      viewCount: Number(v.viewCount),
      publishedAt: v.publishedAt?.toISOString() ?? null,
      thumbnail: v.thumbnailUrl,
      channel: v.channel,
    })),
  }
}