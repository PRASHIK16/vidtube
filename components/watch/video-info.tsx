'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { toggleVideoLike } from '@/lib/actions/watch'
import { formatViews, timeAgo } from '@/lib/utils/format'
import { toast } from 'sonner'

type Props = {
  videoId: string
  title: string
  description: string | null
  viewCount: number
  publishedAt: string | null
  likeCount: number
  dislikeCount: number
  initialLiked: string | null
}

export function VideoInfo({
  videoId, title, description, viewCount, publishedAt,
  likeCount, dislikeCount, initialLiked,
}: Props) {
  const [liked, setLiked] = useState<string | null>(initialLiked)
  const [likes, setLikes] = useState(likeCount)
  const [dislikes, setDislikes] = useState(dislikeCount)
  const [expanded, setExpanded] = useState(false)

  async function handleLike(type: 'like' | 'dislike') {
    const prev = liked
    const prevLikes = likes
    const prevDislikes = dislikes

    // Optimistic update
    if (liked === type) {
      setLiked(null)
      if (type === 'like') setLikes((l) => l - 1)
      else setDislikes((d) => d - 1)
    } else {
      if (liked === 'like') setLikes((l) => l - 1)
      if (liked === 'dislike') setDislikes((d) => d - 1)
      setLiked(type)
      if (type === 'like') setLikes((l) => l + 1)
      else setDislikes((d) => d + 1)
    }

    const result = await toggleVideoLike(videoId, type)
    if (result.error) {
      setLiked(prev)
      setLikes(prevLikes)
      setDislikes(prevDislikes)
      toast.error(result.error === 'Not authenticated' ? 'Sign in to like videos' : result.error)
    }
  }

  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm text-muted-foreground">
          {formatViews(viewCount)} views
          {publishedAt && ` • ${timeAgo(new Date(publishedAt))}`}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border overflow-hidden">
            <button
              onClick={() => handleLike('like')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors ${liked === 'like' ? 'text-blue-500' : ''}`}
            >
              <ThumbsUp className="w-4 h-4" />
              {formatViews(likes)}
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => handleLike('dislike')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors ${liked === 'dislike' ? 'text-blue-500' : ''}`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {description && (
        <div className="mt-3 bg-muted rounded-xl p-3">
          <p className={`text-sm whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>
            {description}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-semibold mt-1 flex items-center gap-1"
          >
            {expanded ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show more</>}
          </button>
        </div>
      )}
    </div>
  )
}