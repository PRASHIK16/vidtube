'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

type Category = { id: string; name: string; slug: string }

export function CategoryBar({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  const all = [{ id: 'all', name: 'All', slug: 'all' }, ...categories]

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'all') params.delete('category')
    else params.set('category', slug)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
      {all.map((cat) => (
        <button
          key={cat.id}
          onClick={() => select(cat.slug)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            current === cat.slug
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}