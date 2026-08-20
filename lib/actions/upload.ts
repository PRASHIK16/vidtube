'use server'

import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getAuthProfile() {
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
  return prisma.profile.findUnique({
    where: { userId: user.id },
    include: { channel: true },
  })
}

export async function createOrGetChannel() {
  const profile = await getAuthProfile()
  if (!profile) return { error: 'Not authenticated' }
  if (profile.channel) return { channel: profile.channel }

  const channel = await prisma.channel.create({
    data: {
      profileId: profile.id,
      name: profile.displayName,
      handle: profile.username,
    },
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
  duration?: number
}) {
  const profile = await getAuthProfile()
  if (!profile) return { error: 'Not authenticated' }

  const video = await prisma.video.create({
    data: {
      channelId: data.channelId,
      title: data.title,
      status: 'draft',
      duration: data.duration ?? null,
      assets: {
        create: {
          storagePath: data.storagePath,
          mimeType: data.mimeType,
          sizeBytes: BigInt(Math.round(data.sizeBytes)),
          originalName: data.originalName,
          status: 'uploaded',
        },
      },
    },
  })

  return { videoId: video.id }
}

export async function updateVideoMetadata(videoId: string, data: {
  title: string
  description?: string
  thumbnailStoragePath?: string
}) {
  const profile = await getAuthProfile()
  if (!profile) return { error: 'Not authenticated' }

  await prisma.video.update({
    where: { id: videoId },
    data: {
      title: data.title,
      description: data.description ?? null,
      ...(data.thumbnailStoragePath
        ? {
            thumbnails: {
              create: {
                storagePath: data.thumbnailStoragePath,
                isSelected: true,
                isAuto: false,
              },
            },
          }
        : {}),
    },
  })

  return { success: true }
}

export async function publishVideo(videoId: string) {
  const profile = await getAuthProfile()
  if (!profile) return { error: 'Not authenticated' }

  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'published', publishedAt: new Date() },
  })

  revalidatePath('/')
  return { success: true }
}

export async function getStudioVideos() {
  const profile = await getAuthProfile()
  if (!profile?.channel) return []

  const videos = await prisma.video.findMany({
    where: { channelId: profile.channel.id, deletedAt: null },
    include: {
      thumbnails: { where: { isSelected: true }, take: 1 },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return videos.map((v) => ({
    id: v.id,
    title: v.title,
    status: v.status,
    viewCount: v.viewCount,
    likeCount: v._count.likes,
    commentCount: v._count.comments,
    createdAt: v.createdAt.toISOString(),
    thumbnail: v.thumbnails[0]?.storagePath
      ? `${supabaseUrl}/storage/v1/object/public/thumbnails/${v.thumbnails[0].storagePath}`
      : null,
  }))
}

export async function softDeleteVideo(videoId: string) {
  const profile = await getAuthProfile()
  if (!profile) return { error: 'Not authenticated' }

  await prisma.video.update({
    where: { id: videoId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/studio')
  return { success: true }
}

export async function triggerProcessing(videoId: string, storagePath: string): Promise<void> {
  const workerUrl = process.env.VIDEO_WORKER_URL
  const secret = process.env.VIDEO_WORKER_SECRET

  if (!workerUrl) {
    console.warn('VIDEO_WORKER_URL not set — skipping processing trigger')
    return
  }

  try {
    await fetch(`${workerUrl}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ videoId, storagePath }),
    })
    console.log(`Processing triggered for video ${videoId}`)
  } catch (err) {
    console.error('Failed to trigger worker:', err)
  }
}