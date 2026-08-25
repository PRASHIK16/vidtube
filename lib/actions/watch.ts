'use server'

import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getVideoById(id: string) {
  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      channel: true,
      asset: true,
      variants: true,
      thumbnails: { where: { isSelected: true }, take: 1 },
    },
  })
  if (!video) return null

  return {
    ...video,
    viewCount: Number(video.viewCount),
    thumbnailUrl: video.thumbnails[0]
      ? `${SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnails[0].storagePath}`
      : video.thumbnailUrl,
    channel: { ...video.channel, totalViews: Number(video.channel.totalViews) },
  }
}

export async function getUserVideoInteraction(videoId: string) {
  const user = await getUser()
  if (!user) return { liked: false, disliked: false, subscribed: false, inWatchLater: false }

  const video = await prisma.video.findUnique({ where: { id: videoId }, select: { channelId: true } })

  const [like, subscription, watchLater] = await Promise.all([
    prisma.videoLike.findUnique({ where: { videoId_userId: { videoId, userId: user.id } } }),
    video ? prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: user.id, channelId: video.channelId } }
    }) : null,
    prisma.watchLater.findUnique({ where: { userId_videoId: { userId: user.id, videoId } } }),
  ])

  return {
    liked: like?.value === 1,
    disliked: like?.value === -1,
    subscribed: !!subscription,
    inWatchLater: !!watchLater,
  }
}

export async function incrementViewCount(videoId: string) {
  await prisma.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  })
}

export async function toggleVideoLike(videoId: string, value: 1 | -1) {
  const user = await getUser()
  if (!user) return

  const existing = await prisma.videoLike.findUnique({
    where: { videoId_userId: { videoId, userId: user.id } },
  })

  if (existing) {
    if (existing.value === value) {
      await prisma.videoLike.delete({ where: { videoId_userId: { videoId, userId: user.id } } })
      await prisma.video.update({
        where: { id: videoId },
        data: value === 1 ? { likeCount: { decrement: 1 } } : { dislikeCount: { decrement: 1 } },
      })
    } else {
      await prisma.videoLike.update({
        where: { videoId_userId: { videoId, userId: user.id } },
        data: { value },
      })
      await prisma.video.update({
        where: { id: videoId },
        data: value === 1
          ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
          : { dislikeCount: { increment: 1 }, likeCount: { decrement: 1 } },
      })
    }
  } else {
    await prisma.videoLike.create({ data: { videoId, userId: user.id, value } })
    await prisma.video.update({
      where: { id: videoId },
      data: value === 1 ? { likeCount: { increment: 1 } } : { dislikeCount: { increment: 1 } },
    })
  }
}

export async function toggleSubscription(channelId: string) {
  const user = await getUser()
  if (!user) return { subscribed: false }

  const existing = await prisma.subscription.findUnique({
    where: { subscriberId_channelId: { subscriberId: user.id, channelId } },
  })

  if (existing) {
    await prisma.subscription.delete({
      where: { subscriberId_channelId: { subscriberId: user.id, channelId } },
    })
    await prisma.channel.update({ where: { id: channelId }, data: { subscriberCount: { decrement: 1 } } })
    return { subscribed: false }
  } else {
    await prisma.subscription.create({ data: { subscriberId: user.id, channelId } })
    await prisma.channel.update({ where: { id: channelId }, data: { subscriberCount: { increment: 1 } } })
    return { subscribed: true }
  }
}

export async function getComments(videoId: string) {
  const comments = await prisma.comment.findMany({
    where: { videoId, parentId: null, isHidden: false, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })

  return comments.map(c => ({
    id: c.id,
    body: c.body,
    likeCount: c.likeCount,
    isPinned: c.isPinned,
    createdAt: c.createdAt,
    author: c.author,
  }))
}

export async function addComment(videoId: string, body: string) {
  const user = await getUser()
  if (!user) return null

  const comment = await prisma.comment.create({
    data: { videoId, authorId: user.id, body },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  })

  await prisma.video.update({ where: { id: videoId }, data: { commentCount: { increment: 1 } } })

  return {
    id: comment.id,
    body: comment.body,
    likeCount: comment.likeCount,
    isPinned: comment.isPinned,
    createdAt: comment.createdAt,
    author: comment.author,
  }
}