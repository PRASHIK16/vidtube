'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toggleSubscription } from '@/lib/actions/watch'
import { formatViews } from '@/lib/utils/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

type Props = {
  channel: {
    id: string
    name: string
    handle: string
    avatarUrl: string | null
    subscriberCount: number
  }
  initialSubscribed: boolean
}

export function ChannelInfo({ channel, initialSubscribed }: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [subCount, setSubCount] = useState(channel.subscriberCount)
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const prev = subscribed
    setSubscribed(!subscribed)
    setSubCount((c) => subscribed ? c - 1 : c + 1)

    const result = await toggleSubscription(channel.id)
    if (result.error) {
      setSubscribed(prev)
      setSubCount(channel.subscriberCount)
      toast.error(result.error === 'Not authenticated' ? 'Sign in to subscribe' : result.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between py-4 border-t border-b mb-4">
      <Link href={`/@${channel.handle}`} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
          {channel.avatarUrl ? (
            <Image src={channel.avatarUrl} alt={channel.name} width={40} height={40} />
          ) : (
            channel.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">{channel.name}</p>
          <p className="text-xs text-muted-foreground">{formatViews(subCount)} subscribers</p>
        </div>
      </Link>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
          subscribed
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : 'bg-foreground text-background hover:bg-foreground/90'
        )}
      >
        {subscribed ? 'Subscribed' : 'Subscribe'}
      </button>
    </div>
  )
}