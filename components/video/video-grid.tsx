import { VideoCard } from './video-card'
import { VideoCardData } from '@/lib/actions/videos'

export function VideoGrid({ videos }: { videos: VideoCardData[] }) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
        <p className="text-muted-foreground">Be the first to upload!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}