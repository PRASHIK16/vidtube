'use client'

import { useEffect, useRef } from 'react'
import { incrementViewCount } from '@/lib/actions/watch'
import { addToHistory } from '@/lib/actions/history'

type Props = {
  videoId: string
  videoUrl: string | null
  thumbnailUrl: string | null
  title: string
}

export function VideoPlayer({ videoId, videoUrl, thumbnailUrl, title }: Props) {
  const counted = useRef(false)

  useEffect(() => {
    if (!counted.current) {
      counted.current = true
      incrementViewCount(videoId)
      addToHistory(videoId)
    }
  }, [videoId])

  if (!videoUrl) {
    return (
      <div className="aspect-video w-full bg-zinc-900 rounded-xl flex items-center justify-center mb-4">
        <p className="text-zinc-400 text-sm">Video not available</p>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden mb-4">
      <video
        className="w-full h-full"
        controls
        poster={thumbnailUrl ?? undefined}
        preload="metadata"
        title={title}
      >
        <source src={videoUrl} />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}