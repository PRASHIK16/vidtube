import { getWatchLater } from '@/lib/actions/watchlater'
import { VideoGrid } from '@/components/video/video-grid'

export default async function WatchLaterPage() {
  const videos = await getWatchLater()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Watch Later</h1>
      {videos.length === 0
        ? <p className="text-muted-foreground">No videos saved for later.</p>
        : <VideoGrid videos={videos} />}
    </div>
  )
}