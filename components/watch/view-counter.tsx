'use client'

import { useEffect, useRef } from 'react'
import { incrementViewCount } from '@/lib/actions/watch'

export function ViewCounter({ videoId }: { videoId: string }) {
  const counted = useRef(false)
  useEffect(() => {
    if (counted.current) return
    counted.current = true
    incrementViewCount(videoId)
  }, [videoId])
  return null
}