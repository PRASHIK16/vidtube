import { notFound } from 'next/navigation'
import { getVideoById, getUserVideoInteraction, getComments } from '@/lib/actions/watch'
import { VideoPlayer } from '@/components/watch/video-player'
import { VideoInfo } from '@/components/watch/video-info'
import { ChannelInfo } from '@/components/watch/channel-info'
import { CommentsSection } from '@/components/watch/comments-section'

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [video, rawComments] = await Promise.all([
    getVideoById(id),
    getComments(id),
  ])

  if (!video) notFound()

  const interaction = await getUserVideoInteraction(id)

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const videoUrl = (video as any).asset?.storagePath
    ? `${SUPABASE_URL}/storage/v1/object/public/videos/${(video as any).asset.storagePath}`
    : null

  const comments = rawComments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          <VideoPlayer
            videoId={video.id}
            videoUrl={videoUrl}
            thumbnailUrl={video.thumbnailUrl}
            title={video.title}
          />
          <VideoInfo
            videoId={video.id}
            title={video.title}
            description={video.description ?? undefined}
            viewCount={video.viewCount}
            publishedAt={video.publishedAt?.toISOString() ?? null}
            likeCount={video.likeCount}
            dislikeCount={video.dislikeCount}
            initialLiked={interaction.liked}
            initialDisliked={interaction.disliked}
          />
          <ChannelInfo
            channel={video.channel}
            initialSubscribed={interaction.subscribed}
          />
          <CommentsSection
            videoId={video.id}
            commentCount={video.commentCount}
            initialComments={comments}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <p className="text-sm text-muted-foreground">Related videos coming soon.</p>
        </div>
      </div>
    </div>
  )
}