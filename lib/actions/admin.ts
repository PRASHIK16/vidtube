'use server'

import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAdminUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean)
  if (!adminIds.includes(user.id)) throw new Error('Unauthorized')
  return user
}

export async function getAdminStats() {
  await getAdminUser()
  const [userCount, videoCount, pendingReports, viewsAgg] = await Promise.all([
    prisma.profile.count(),
    prisma.video.count(),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.video.aggregate({ _sum: { viewCount: true } }),
  ])
  return {
    userCount,
    videoCount,
    pendingReports,
    totalViews: Number(viewsAgg._sum.viewCount ?? 0),
  }
}

export async function getAdminUsers(page = 1) {
  await getAdminUser()
  const limit = 20
  const [users, total] = await Promise.all([
    prisma.profile.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: { select: { handle: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.profile.count(),
  ])
  return { users, total, pages: Math.ceil(total / limit) }
}

export async function getAdminVideos(page = 1, status?: string) {
  await getAdminUser()
  const limit = 20
  const where = status ? { status } : {}
  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { channel: { select: { handle: true, name: true } } },
    }),
    prisma.video.count({ where }),
  ])
  return {
    videos: videos.map(v => ({ ...v, viewCount: Number(v.viewCount) })),
    total,
    pages: Math.ceil(total / limit),
  }
}

export async function getAdminReports(page = 1) {
  await getAdminUser()
  const limit = 20
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where: { status: 'pending' },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { username: true, displayName: true } },
      },
    }),
    prisma.report.count({ where: { status: 'pending' } }),
  ])
  return { reports, total, pages: Math.ceil(total / limit) }
}

export async function updateVideoVisibility(videoId: string, visibility: string) {
  await getAdminUser()
  return prisma.video.update({ where: { id: videoId }, data: { visibility } })
}

export async function resolveReport(reportId: string, status: 'approved' | 'rejected') {
  const user = await getAdminUser()
  return prisma.report.update({
    where: { id: reportId },
    data: { status, reviewedBy: user.id, reviewedAt: new Date() },
  })
}