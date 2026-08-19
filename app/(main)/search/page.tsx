import { searchVideos } from '@/lib/actions/search'
import { VideoGrid } from '@/components/video/video-grid'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const videos = q ? await searchVideos(q) : []

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">
        {q ? `Results for "${q}"` : 'Search for videos'}
      </h1>
      {q && videos.length === 0 && (
        <p className="text-muted-foreground">No videos found for "{q}".</p>
      )}
      <VideoGrid videos={videos} />
    </div>
  )
}