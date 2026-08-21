'use client'

import { resolveReport } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function ResolveReportButtons({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition()

  const handle = (action: 'approved' | 'rejected') => {
    startTransition(async () => {
      try {
        await resolveReport(reportId, action)
        toast.success(action === 'approved' ? 'Content removed' : 'Report dismissed')
      } catch {
        toast.error('Failed')
      }
    })
  }

  return (
    <div className="flex gap-1 shrink-0">
      <Button size="sm" variant="destructive" onClick={() => handle('approved')} disabled={pending}>Remove</Button>
      <Button size="sm" variant="outline" onClick={() => handle('rejected')} disabled={pending}>Dismiss</Button>
    </div>
  )
}