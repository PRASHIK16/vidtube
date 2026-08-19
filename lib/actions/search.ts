'use server'
import { prisma } from '@/lib/db/prisma'

export async function searchVideos(query: string) {
  if (!query.trim()) return []
  const videos = await prisma.video.findMany({
    where: {
      status: 'published',
      deletedAt: null,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      channel: true,
      thumbnails: { where: { isSelected: true }, take: 1 },
    },
    orderBy: { viewCount: 'desc' },
    take: 40,
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