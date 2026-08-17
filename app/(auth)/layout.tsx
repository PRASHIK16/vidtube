import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">VidTube</h1>
          <p className="text-sm text-muted-foreground mt-1">Share what matters</p>
        </div>
        {children}
      </div>
    </div>
  )
}