'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VideoDropzone } from './video-dropzone'
import { createOrGetChannel, createVideoRecord, updateVideoMetadata, publishVideo, triggerProcessing } from '@/lib/actions/upload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Step = 'upload' | 'metadata' | 'done'

type UploadedFile = {
  storagePath: string
  mimeType: string
  sizeBytes: number
  originalName: string
  duration: number
}

export function UploadForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [channelId, setChannelId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    createOrGetChannel().then((res) => {
      if (res.channel) setChannelId(res.channel.id)
      else toast.error('Failed to load channel')
    })
  }, [])

  async function handleUploadComplete(file: UploadedFile) {
  if (!channelId) { toast.error('Channel not ready'); return }
  setUploaded(file)

  const name = file.originalName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  setTitle(name)

  const result = await createVideoRecord({
    title: name,
    channelId,
    ...file,
  })

  if (result.error) { toast.error(result.error); return }
  setVideoId(result.videoId!)

  // Trigger worker
  await triggerProcessing(result.videoId!, file.storagePath)

  setStep('metadata')
}

  async function handleSaveMetadata(publish: boolean) {
    if (!videoId) return
    if (!title.trim()) { toast.error('Title is required'); return }

    if (publish) setPublishing(true)
    else setSaving(true)

    let thumbnailStoragePath: string | undefined
    if (thumbnailFile && channelId) {
      const supabase = createClient()
      const ext = thumbnailFile.name.split('.').pop()
      const path = `${channelId}/${videoId}.${ext}`
      const { error } = await supabase.storage.from('thumbnails').upload(path, thumbnailFile, { upsert: true })
      if (!error) thumbnailStoragePath = path
    }

    await updateVideoMetadata(videoId, { title, description, thumbnailStoragePath })

    if (publish) {
      const res = await publishVideo(videoId)
      if (res.error) { toast.error(res.error); setPublishing(false); return }
      toast.success('Video published!')
      router.push('/')
    } else {
      toast.success('Saved as draft')
      setStep('done')
      setSaving(false)
    }
  }

  if (step === 'upload') {
    return (
      <div>
        {!channelId && (
          <p className="text-sm text-muted-foreground mb-4">Setting up your channel...</p>
        )}
        {channelId && (
          <VideoDropzone channelId={channelId} onUploadComplete={handleUploadComplete} />
        )}
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Note:</strong> Make sure you have created a <code>videos</code> and <code>thumbnails</code> bucket in Supabase Storage (set to public).
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">Saved as draft</h2>
        <p className="text-muted-foreground mb-6">Your video is saved. Publish it from the studio when ready.</p>
        <button onClick={() => router.push('/studio')} className="bg-foreground text-background px-6 py-2 rounded-lg font-medium hover:bg-foreground/90">
          Go to Studio
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Title <span className="text-red-500">*</span></label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter video title"
        />
        <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Tell viewers about your video..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Thumbnail (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-muted file:text-sm file:font-medium cursor-pointer"
        />
        {thumbnailFile && (
          <p className="text-xs text-green-600 mt-1">✓ {thumbnailFile.name}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => handleSaveMetadata(false)}
          disabled={saving || publishing}
          className="flex-1 border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          onClick={() => handleSaveMetadata(true)}
          disabled={saving || publishing}
          className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {publishing ? 'Publishing...' : 'Publish Now'}
        </button>
      </div>
    </div>
  )
}