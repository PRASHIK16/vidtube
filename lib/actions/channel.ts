'use server'
import { prisma } from '@/lib/db/prisma'

export async function getChannelByHandle(handle: string) {
  const channel = await prisma.channel.findUnique({
    where: { handle },
    include: {
      profile: true,
      videos: {
        where: { status: 'published', deletedAt: null },
        include: { thumbnails: { where: { isSelected: true }, take: 1 } },
        orderBy: { publishedAt: 'desc' },
        take: 24,
      },
    },
  })
  if (!channel) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return {
    id: channel.id,
    name: channel.name,
    handle: channel.handle,
    description: channel.description,
    avatarUrl: channel.avatarUrl,
    bannerUrl: channel.bannerUrl,
    subscriberCount: channel.subscriberCount,
    videos: channel.videos.map((v) => ({
      id: v.id,
      title: v.title,
      duration: v.duration,
      viewCount: v.viewCount,
      publishedAt: v.publishedAt?.toISOString() ?? null,
      thumbnail: v.thumbnails[0]?.storagePath
        ? `${url}/storage/v1/object/public/thumbnails/${v.thumbnails[0].storagePath}`
        : null,
      channel: { id: channel.id, name: channel.name, handle: channel.handle, avatarUrl: channel.avatarUrl },
    })),
  }
}