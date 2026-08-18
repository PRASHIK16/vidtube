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
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.profile.findUnique({ where: { userId: user.id } })
}

export async function getVideoById(id: string) {
  const video = await prisma.video.findUnique({
    where: { id, status: 'published', deletedAt: null },
    include: {
      channel: true,
      thumbnails: { where: { isSelected: true }, take: 1 },
      assets: { orderBy: { createdAt: 'desc' }, take: 1 },
      variants: { orderBy: { bitrate: 'desc' }, take: 1 },
    },
  })
  if (!video) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const videoUrl = video.variants[0]?.storagePath
    ? `${supabaseUrl}/storage/v1/object/public/video-variants/${video.variants[0].storagePath}`
    : video.assets[0]?.storagePath
      ? `${supabaseUrl}/storage/v1/object/public/videos/${video.assets[0].storagePath}`
      : null

  const thumbnailUrl = video.thumbnails[0]?.storagePath
    ? `${supabaseUrl}/storage/v1/object/public/thumbnails/${video.thumbnails[0].storagePath}`
    : null

  const [likeCount, dislikeCount, commentCount] = await Promise.all([
    prisma.videoLike.count({ where: { videoId: id, type: 'like' } }),
    prisma.videoLike.count({ where: { videoId: id, type: 'dislike' } }),
    prisma.comment.count({ where: { videoId: id, deletedAt: null } }),
  ])

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    duration: video.duration,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt?.toISOString() ?? null,
    videoUrl,
    thumbnailUrl,
    likeCount,
    dislikeCount,
    commentCount,
    channel: {
      id: video.channel.id,
      name: video.channel.name,
      handle: video.channel.handle,
      avatarUrl: video.channel.avatarUrl,
      subscriberCount: video.channel.subscriberCount,
    },
  }
}

export async function getUserVideoInteraction(videoId: string, channelId: string) {
  const profile = await getProfile()
  if (!profile) return { liked: null, subscribed: false }

  const [like, subscription] = await Promise.all([
    prisma.videoLike.findUnique({
      where: { profileId_videoId: { profileId: profile.id, videoId } },
    }),
    prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: profile.id, channelId } },
    }),
  ])

  return {
    liked: like?.type ?? null,
    subscribed: !!subscription,
  }
}

export async function incrementViewCount(videoId: string) {
  await prisma.video.update({ where: { id: videoId }, data: { viewCount: { increment: 1 } } })
}

export async function toggleVideoLike(videoId: string, type: 'like' | 'dislike') {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }

  const existing = await prisma.videoLike.findUnique({
    where: { profileId_videoId: { profileId: profile.id, videoId } },
  })

  if (existing) {
    if (existing.type === type) {
      await prisma.videoLike.delete({ where: { id: existing.id } })
    } else {
      await prisma.videoLike.update({ where: { id: existing.id }, data: { type } })
    }
  } else {
    await prisma.videoLike.create({ data: { profileId: profile.id, videoId, type } })
  }

  revalidatePath(`/watch/${videoId}`)
  return { success: true }
}

export async function toggleSubscription(channelId: string) {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }

  const existing = await prisma.subscription.findUnique({
    where: { subscriberId_channelId: { subscriberId: profile.id, channelId } },
  })

  if (existing) {
    await prisma.subscription.delete({ where: { id: existing.id } })
    await prisma.channel.update({ where: { id: channelId }, data: { subscriberCount: { decrement: 1 } } })
  } else {
    await prisma.subscription.create({ data: { subscriberId: profile.id, channelId } })
    await prisma.channel.update({ where: { id: channelId }, data: { subscriberCount: { increment: 1 } } })
  }

  revalidatePath('/watch')
  return { success: true }
}

export async function getComments(videoId: string) {
  const comments = await prisma.comment.findMany({
    where: { videoId, parentId: null, deletedAt: null },
    include: {
      profile: {
        include: { channel: { select: { name: true, avatarUrl: true, handle: true } } },
      },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    replyCount: c._count.replies,
    author: {
      username: c.profile.username,
      displayName: c.profile.channel?.name ?? c.profile.displayName,
      avatarUrl: c.profile.channel?.avatarUrl ?? null,
      handle: c.profile.channel?.handle ?? c.profile.username,
    },
  }))
}

export async function addComment(videoId: string, content: string) {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }

  await prisma.comment.create({
    data: { videoId, profileId: profile.id, content },
  })

  revalidatePath(`/watch/${videoId}`)
  return { success: true }
}