'use client'

import { updateVideoVisibility } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function VideoActionButtons({ videoId, visibility }: { videoId: string; visibility: string }) {
  const [pending, startTransition] = useTransition()

  const update = (v: string) => {
    startTransition(async () => {
      try {
        await updateVideoVisibility(videoId, v)
        toast.success('Updated')
      } catch {
        toast.error('Failed')
      }
    })
  }

  return (
    <div className="flex gap-1">
      {visibility !== 'public' && (
        <Button size="sm" variant="outline" onClick={() => update('public')} disabled={pending}>Public</Button>
      )}
      {visibility !== 'private' && (
        <Button size="sm" variant="destructive" onClick={() => update('private')} disabled={pending}>Private</Button>
      )}
    </div>
  )
}