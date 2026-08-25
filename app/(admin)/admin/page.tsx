import { getAdminStats } from '@/lib/actions/admin'

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Videos" value={stats.totalVideos} />
        <StatCard label="Total Views" value={stats.totalViews} />
        <StatCard label="Open Reports" value={stats.openReports} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}