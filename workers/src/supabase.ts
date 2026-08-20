import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function downloadVideo(storagePath: string, localPath: string): Promise<void> {
  const { data, error } = await supabase.storage.from('videos').download(storagePath)
  if (error) throw new Error(`Download failed: ${error.message}`)
  const buffer = Buffer.from(await data.arrayBuffer())
  const fs = await import('fs')
  fs.writeFileSync(localPath, buffer)
}

export async function uploadFile(localPath: string, bucket: string, storagePath: string, contentType: string): Promise<void> {
  const fs = await import('fs')
  const buffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Upload failed: ${error.message}`)
}