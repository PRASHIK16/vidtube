'use client'

import { useState } from 'react'
import { addComment } from '@/lib/actions/watch'
import { timeAgo } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

type Comment = {
  id: string
  body: string
  likeCount: number
  isPinned: boolean
  createdAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

type Props = {
  videoId: string
  commentCount: number
  initialComments: Comment[]
}

export function CommentsSection({ videoId, commentCount, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [count, setCount] = useState(commentCount)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)

    try {
      const result = await addComment(videoId, text.trim())
      if (!result) {
        toast.error('Sign in to comment')
      } else {
        setComments((prev) => [{ ...result, createdAt: result.createdAt.toISOString() }, ...prev])
        setCount((c) => c + 1)
        setText('')
        toast.success('Comment posted!')
      }
    } catch {
      toast.error('Failed to post comment')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <h2 className="font-semibold mb-4">{count} Comments</h2>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-zinc-700 flex-shrink-0" />
        <div className="flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-border pb-1 text-sm outline-none focus:border-foreground transition-colors"
          />
          {text && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setText('')}
                className="text-sm px-3 py-1.5 rounded-full mr-2 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Comment
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Comment list */}
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold">
              {c.author.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-semibold">@{c.author.username}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(new Date(c.createdAt))}</span>
              </div>
              <p className="text-sm">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}