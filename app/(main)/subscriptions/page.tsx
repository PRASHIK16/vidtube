import { getSubscriptionFeed } from '@/lib/actions/subscriptions'
import { VideoGrid } from '@/components/video/video-grid'

export default async function SubscriptionsPage() {
  const videos = await getSubscriptionFeed()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      {videos.length === 0
        ? <p className="text-muted-foreground">Subscribe to channels to see their latest videos here.</p>
        : <VideoGrid videos={videos} />}
    </div>
  )
}