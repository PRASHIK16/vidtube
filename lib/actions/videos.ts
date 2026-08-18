'use server'

import { prisma } from '@/lib/db/prisma'

export type VideoCardData = {
  id: string
  title: string
  duration: number | null
  viewCount: number
  publishedAt: Date | null
  thumbnail: string | null
  channel: {
    id: string
    name: string
    handle: string
    avatarUrl: string | null
  }
}

export async function getHomeVideos(categorySlug?: string): Promise<VideoCardData[]> {
  try {
    const videos = await prisma.video.findMany({
      where: {
        status: 'published',
        ...(categorySlug && categorySlug !== 'all'
          ? {
              categories: {
                some: {
                  category: { slug: categorySlug },
                },
              },
            }
          : {}),
      },
      include: {
        channel: true,
        thumbnails: {
          where: { isSelected: true },
          take: 1,
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 48,
    })

    return videos.map((v) => ({
      id: v.id,
      title: v.title,
      duration: v.duration,
      viewCount: v.viewCount,
      publishedAt: v.publishedAt,
      thumbnail: v.thumbnails[0]?.storagePath
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnails[0].storagePath}`
        : null,
      channel: {
        id: v.channel.id,
        name: v.channel.name,
        handle: v.channel.handle,
        avatarUrl: v.channel.avatarUrl,
      },
    }))
  } catch (error) {
    console.error('getHomeVideos error:', error)
    return []
  }
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}