import { getWatchHistory } from '@/lib/actions/history'
import { VideoGrid } from '@/components/video/video-grid'
import { ClearHistoryButton } from '@/components/history/clear-history-button'

export default async function HistoryPage() {
  const history = await getWatchHistory()
  const videos = history.map((h) => h.video)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Watch History</h1>
        {videos.length > 0 && <ClearHistoryButton />}
      </div>
      {videos.length === 0
        ? <p className="text-muted-foreground">No watch history yet.</p>
        : <VideoGrid videos={videos} />}
    </div>
  )
}