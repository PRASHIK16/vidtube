'use client'

import Image from 'next/image'
import Link from 'next/link'
import { VideoCardData } from '@/lib/actions/videos'
import { formatDuration, formatViews, timeAgo } from '@/lib/utils/format'

export function VideoCard({ video }: { video: VideoCardData }) {
  return (
    <div className="group cursor-pointer">
      <Link href={`/watch/${video.id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted mb-3">
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              <svg className="w-12 h-12 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex gap-3">
        {/* Channel Avatar */}
        <Link href={`/@${video.channel.handle}`} className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
            {video.channel.avatarUrl ? (
              <Image src={video.channel.avatarUrl} alt={video.channel.name} width={36} height={36} />
            ) : (
              video.channel.name.charAt(0).toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-1 group-hover:text-red-500 transition-colors">
              {video.title}
            </h3>
          </Link>
          <Link href={`/@${video.channel.handle}`}>
            <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {video.channel.name}
            </p>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatViews(video.viewCount)} views
            {video.publishedAt && ` • ${timeAgo(video.publishedAt)}`}
          </p>
        </div>
      </div>
    </div>
  )
}