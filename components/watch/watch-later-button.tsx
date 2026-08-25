'use client'
import { useState } from 'react'
import { Clock } from 'lucide-react'
import { toggleWatchLater } from '@/lib/actions/watchlater'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export function WatchLaterButton({ videoId, initialSaved }: { videoId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      const result = await toggleWatchLater(videoId)
      setSaved(result.added)
      toast.success(result.added ? 'Saved to Watch Later' : 'Removed from Watch Later')
    } catch {
      toast.error('Sign in to save videos')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border hover:bg-muted transition-colors',
        saved && 'bg-muted'
      )}
    >
      <Clock className="w-4 h-4" />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}