import { prisma } from '@/lib/db/prisma'
import { VideoGrid } from '@/components/video/video-grid'

async function getTrendingVideos() {
  const videos = await prisma.video.findMany({
    where: { status: 'ready', visibility: 'public', deletedAt: null },
    include: { channel: true, thumbnails: { where: { isSelected: true }, take: 1 } },
    orderBy: { viewCount: 'desc' },
    take: 48,
  })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return videos.map((v) => ({
    id: v.id,
    title: v.title,
    duration: v.duration,
    viewCount: Number(v.viewCount),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    thumbnail: v.thumbnails[0]?.storagePath
      ? `${url}/storage/v1/object/public/thumbnails/${v.thumbnails[0].storagePath}`
      : null,
    channel: { id: v.channel.id, name: v.channel.name, handle: v.channel.handle, avatarUrl: v.channel.avatarUrl },
  }))
}

export default async function TrendingPage() {
  const videos = await getTrendingVideos()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🔥 Trending</h1>
      <VideoGrid videos={videos} />
    </div>
  )
}