import { getAdminVideos } from '@/lib/actions/admin'
import { VideoActionButtons } from '@/components/admin/video-action-buttons'
import Link from 'next/link'

const statusStyle: Record<string, string> = {
  ready: 'bg-green-500/10 text-green-600',
  processing: 'bg-yellow-500/10 text-yellow-600',
  uploading: 'bg-blue-500/10 text-blue-600',
  failed: 'bg-red-500/10 text-red-600',
}

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page, status } = await searchParams
  const currentPage = Number(page) || 1
  const { videos, total, pages } = await getAdminVideos(currentPage, status)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Videos ({total.toLocaleString()})</h1>
        <div className="flex gap-2">
          {[undefined, 'ready', 'processing', 'failed'].map((s) => (
            <Link key={s ?? 'all'}
              href={s ? `/admin/videos?status=${s}` : '/admin/videos'}
              className={`px-3 py-1 rounded border text-sm capitalize ${status === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              {s ?? 'All'}
            </Link>
          ))}
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Channel</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Visibility</th>
              <th className="text-left p-3 font-medium">Views</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <Link href={`/watch/${video.id}`} className="font-medium hover:underline line-clamp-1 block max-w-[200px]">
                    {video.title}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{video.channel.name}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[video.status] ?? ''}`}>
                    {video.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground capitalize">{video.visibility}</td>
                <td className="p-3">{video.viewCount.toLocaleString()}</td>
                <td className="p-3">
                  <VideoActionButtons videoId={video.id} visibility={video.visibility} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/videos?page=${p}${status ? `&status=${status}` : ''}`}
              className={`px-3 py-1 rounded border text-sm ${p === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}