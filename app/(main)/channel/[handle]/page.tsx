import { notFound } from 'next/navigation'
import { getChannelByHandle } from '@/lib/actions/channel'
import { VideoGrid } from '@/components/video/video-grid'
import { formatViews } from '@/lib/utils/format'

export default async function ChannelPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const channel = await getChannelByHandle(handle)
  if (!channel) notFound()

  return (
    <div>
      {channel.bannerUrl && (
        <div className="w-full h-32 rounded-xl overflow-hidden mb-4 bg-muted">
          <img src={channel.bannerUrl} alt="banner" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {channel.avatarUrl
            ? <img src={channel.avatarUrl} alt={channel.name} className="w-full h-full rounded-full object-cover" />
            : channel.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{channel.name}</h1>
          <p className="text-muted-foreground text-sm">@{channel.handle} · {formatViews(channel.subscriberCount)} subscribers · {channel.videos.length} videos</p>
          {channel.description && <p className="text-sm mt-1 line-clamp-2">{channel.description}</p>}
        </div>
      </div>
      <h2 className="font-semibold mb-4">Videos</h2>
      <VideoGrid videos={channel.videos} />
    </div>
  )
}