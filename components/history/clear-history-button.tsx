'use client'
import { clearHistory } from '@/lib/actions/history'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function ClearHistoryButton() {
  const router = useRouter()
  async function handle() {
    await clearHistory()
    toast.success('History cleared')
    router.refresh()
  }
  return (
    <button onClick={handle} className="text-sm text-red-500 hover:text-red-600 font-medium">
      Clear all history
    </button>
  )
}