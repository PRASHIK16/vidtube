import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

async function getCategoriesWithCount() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { videos: true } } },
    orderBy: { name: 'asc' },
  })
  return categories
}

const CATEGORY_COLORS = [
  'from-red-500 to-orange-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-pink-500',
  'from-yellow-500 to-amber-500',
  'from-indigo-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-green-500',
]

export default async function ExplorePage() {
  const categories = await getCategoriesWithCount()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Explore</h1>
      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className={`bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} rounded-xl p-6 text-white hover:scale-105 transition-transform`}
            >
              <h2 className="text-lg font-bold">{cat.name}</h2>
              <p className="text-sm opacity-80 mt-1">{cat._count.videos} videos</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}