'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UploadResult = {
  storagePath: string
  mimeType: string
  sizeBytes: number
  originalName: string
  duration: number
}

type Props = {
  channelId: string
  onUploadComplete: (result: UploadResult) => void
}

export function VideoDropzone({ channelId, onUploadComplete }: Props) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file.')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setProgress(0)

    const duration = await new Promise<number>((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration))
        URL.revokeObjectURL(video.src)
      }
      video.onerror = () => resolve(0)
      video.src = URL.createObjectURL(file)
    })

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const storagePath = `${channelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('videos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (p: { loaded: number; total: number }) => {
          setProgress(Math.round((p.loaded / p.total) * 100))
        },
      } as any)

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
      return
    }

    setStatus('done')
    onUploadComplete({
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
      originalName: file.name,
      duration,
    })
  }, [channelId, onUploadComplete])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  if (status === 'uploading') {
    return (
      <div className="border-2 border-dashed rounded-xl p-12 text-center">
        <Film className="w-10 h-10 mx-auto mb-4 text-muted-foreground animate-pulse" />
        <p className="font-medium mb-3">Uploading video...</p>
        <div className="w-full bg-muted rounded-full h-2 mb-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">{progress}%</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="border-2 border-green-500 rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-medium text-green-600">Video uploaded successfully!</p>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details below.</p>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
        dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-border hover:border-muted-foreground'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
      />
      <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
      <p className="font-medium mb-1">Drag & drop your video here</p>
      <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
      <p className="text-xs text-muted-foreground">MP4, MOV, AVI, MKV — max 2GB</p>
      {status === 'error' && <p className="text-sm text-red-500 mt-3">{errorMsg}</p>}
    </div>
  )
}