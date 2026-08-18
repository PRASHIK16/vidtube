import Link from 'next/link'
import Image from 'next/image'
import { getStudioVideos } from '@/lib/actions/upload'
import { formatViews, timeAgo } from '@/lib/utils/format'
import { Upload } from 'lucide-react'

export default async function StudioPage() {
  const videos = await getStudioVideos()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Channel Videos</h1>
        <Link
          href="/studio/upload"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🎬</div>
          <p className="font-medium">No videos yet</p>
          <p className="text-sm mt-1">Upload your first video to get started</p>
          <Link href="/studio/upload" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Upload now
          </Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">Video</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Views</th>
                <th className="text-left p-4 font-medium">Likes</th>
                <th className="text-left p-4 font-medium">Comments</th>
                <th className="text-left p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="border-t hover:bg-muted/40">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 aspect-video bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                        {v.thumbnail && (
                          <Image src={v.thumbnail} alt={v.title} width={96} height={54} className="object-cover w-full h-full" />
                        )}
                      </div>
                      <Link href={`/watch/${v.id}`} className="font-medium hover:text-blue-500 line-clamp-2">
                        {v.title}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      v.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      v.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{formatViews(v.viewCount)}</td>
                  <td className="p-4 text-muted-foreground">{formatViews(v.likeCount)}</td>
                  <td className="p-4 text-muted-foreground">{v.commentCount}</td>
                  <td className="p-4 text-muted-foreground">{timeAgo(new Date(v.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}