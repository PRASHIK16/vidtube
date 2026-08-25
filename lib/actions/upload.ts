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

export async function createOrGetChannel() {
  const user = await getUser()
  if (!user) return { channel: null, error: 'Not authenticated' }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { channel: true },
  })
  if (!profile) return { channel: null, error: 'Profile not found' }
  if (profile.channel) return { channel: profile.channel }

  const channel = await prisma.channel.create({
    data: { ownerId: profile.id, handle: profile.username, name: profile.displayName },
  })
  return { channel }
}

export async function createVideoRecord(data: {
  title: string
  channelId: string
  storagePath: string
  mimeType: string
  sizeBytes: number
  originalName: string
  duration: number
}) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const video = await prisma.video.create({
    data: {
      channelId: data.channelId,
      title: data.title,
      status: 'processing',
      visibility: 'private',
      asset: {
        create: {
          storagePath: data.storagePath,
          fileName: data.originalName,
          fileSize: BigInt(Math.round(data.sizeBytes)),
          mimeType: data.mimeType,
          duration: data.duration,
        },
      },
    },
  })

  return { videoId: video.id }
}

export async function updateVideoMetadata(data: {
  videoId: string
  title: string
  description?: string
  thumbnailStoragePath?: string
}) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  await prisma.video.update({
    where: { id: data.videoId },
    data: {
      title: data.title,
      description: data.description,
      ...(data.thumbnailStoragePath && {
        thumbnailUrl: `${SUPABASE_URL}/storage/v1/object/public/thumbnails/${data.thumbnailStoragePath}`,
      }),
    },
  })

  return { success: true }
}

export async function publishVideo(videoId: string) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  await prisma.video.update({
    where: { id: videoId },
    data: { visibility: 'public', publishedAt: new Date() },
  })

  return { success: true }
}

export async function triggerProcessing(videoId: string, storagePath: string): Promise<void> {
  const workerUrl = process.env.VIDEO_WORKER_URL
  const secret = process.env.VIDEO_WORKER_SECRET
  if (!workerUrl) { console.warn('VIDEO_WORKER_URL not set — skipping'); return }
  try {
    await fetch(`${workerUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ videoId, storagePath }),
    })
  } catch (err) { console.error('Failed to trigger worker:', err) }
}

export async function getStudioVideos() {
  const user = await getUser()
  if (!user) return []

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { channel: true },
  })
  if (!profile?.channel) return []

  const videos = await prisma.video.findMany({
    where: { channelId: profile.channel.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      thumbnails: { where: { isSelected: true }, take: 1 },
      _count: { select: { comments: true, videoLikes: true } },
    },
  })

  return videos.map(v => ({
    id: v.id,
    title: v.title,
    status: v.status,
    visibility: v.visibility,
    viewCount: Number(v.viewCount),
    likeCount: v.likeCount,
    commentCount: v.commentCount,
    createdAt: v.createdAt,
    thumbnailUrl: v.thumbnails[0]
      ? `${SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnails[0].storagePath}`
      : v.thumbnailUrl,
    _count: v._count,
  }))
}