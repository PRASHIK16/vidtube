import { Suspense } from 'react'
import { getHomeVideos, getCategories } from '@/lib/actions/videos'
import { VideoGrid } from '@/components/video/video-grid'
import { CategoryBar } from '@/components/home/category-bar'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const [videos, categories] = await Promise.all([
    getHomeVideos(category),
    getCategories(),
  ])

  return (
    <div>
      <Suspense fallback={null}>
        <CategoryBar categories={categories} />
      </Suspense>
      <VideoGrid videos={videos} />
    </div>
  )
}