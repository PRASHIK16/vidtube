import { APP_NAME } from '@/lib/utils/constants'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground">
        Phase 1 complete. Application shell coming in Phase 4.
      </p>
    </main>
  )
}