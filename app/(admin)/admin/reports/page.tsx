import { getAdminReports } from '@/lib/actions/admin'
import { ResolveReportButtons } from '@/components/admin/resolve-report-buttons'
import Link from 'next/link'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const { reports, total, pages } = await getAdminReports(currentPage)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Reports ({total})</h1>
      {reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-2">✓</div>
          No pending reports. All clear!
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{report.resourceType}</span>
                    <span className="text-xs text-muted-foreground truncate">{report.resourceId}</span>
                  </div>
                  <div className="font-medium">{report.reason}</div>
                  {report.detail && (
                    <p className="text-sm text-muted-foreground mt-1">{report.detail}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Reported by <span className="font-medium">@{report.reporter.username}</span>
                    {' · '}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <ResolveReportButtons reportId={report.id} />
              </div>
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/reports?page=${p}`}
              className={`px-3 py-1 rounded border text-sm ${p === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}