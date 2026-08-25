'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { toggleVideoLike } from '@/lib/actions/watch'
import { formatViews, timeAgo } from '@/lib/utils/format'
import { toast } from 'sonner'

type Props = {
  videoId: string
  title: string
  description?: string
  viewCount: number
  publishedAt: string | null
  likeCount: number
  dislikeCount: number
  initialLiked: boolean
  initialDisliked: boolean
}

export function VideoInfo({
  videoId, title, description, viewCount, publishedAt,
  likeCount, dislikeCount, initialLiked, initialDisliked,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [disliked, setDisliked] = useState(initialDisliked)
  const [likes, setLikes] = useState(likeCount)
  const [dislikes, setDislikes] = useState(dislikeCount)
  const [expanded, setExpanded] = useState(false)

  async function handleLike(value: 1 | -1) {
    const prevLiked = liked
    const prevDisliked = disliked
    const prevLikes = likes
    const prevDislikes = dislikes

    // Optimistic update
    if (value === 1) {
      if (liked) {
        setLiked(false); setLikes((l) => l - 1)
      } else {
        if (disliked) { setDisliked(false); setDislikes((d) => d - 1) }
        setLiked(true); setLikes((l) => l + 1)
      }
    } else {
      if (disliked) {
        setDisliked(false); setDislikes((d) => d - 1)
      } else {
        if (liked) { setLiked(false); setLikes((l) => l - 1) }
        setDisliked(true); setDislikes((d) => d + 1)
      }
    }

    try {
      await toggleVideoLike(videoId, value)
    } catch {
      setLiked(prevLiked)
      setDisliked(prevDisliked)
      setLikes(prevLikes)
      setDislikes(prevDislikes)
      toast.error('Sign in to like videos')
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
              onClick={() => handleLike(1)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors ${liked ? 'text-blue-500' : ''}`}
            >
              <ThumbsUp className="w-4 h-4" />
              {formatViews(likes)}
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => handleLike(-1)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors ${disliked ? 'text-blue-500' : ''}`}
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