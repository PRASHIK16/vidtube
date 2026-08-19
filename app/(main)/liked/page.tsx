import { getLikedVideos } from '@/lib/actions/liked'
import { VideoGrid } from '@/components/video/video-grid'

export default async function LikedPage() {
  const videos = await getLikedVideos()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Liked Videos</h1>
      {videos.length === 0
        ? <p className="text-muted-foreground">No liked videos yet.</p>
        : <VideoGrid videos={videos} />}
    </div>
  )
}