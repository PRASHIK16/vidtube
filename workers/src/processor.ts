import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { PrismaClient } from '@prisma/client'
import { downloadVideo, uploadFile } from './supabase'

ffmpeg.setFfmpegPath(ffmpegPath as string)
ffmpeg.setFfprobePath(ffprobePath.path)

const prisma = new PrismaClient()

type VideoMeta = { duration: number; width: number; height: number }

function getMetadata(inputPath: string): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) return reject(err)
      const stream = data.streams.find((s) => s.codec_type === 'video')
      resolve({
        duration: Math.round(data.format.duration ?? 0),
        width: stream?.width ?? 1280,
        height: stream?.height ?? 720,
      })
    })
  })
}

function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve())
      .on('error', reject)
  })
}

function transcode(inputPath: string, outputPath: string, width: number, height: number, bitrate: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${width}x${height}`)
      .videoBitrate(bitrate)
      .outputOptions(['-crf 23', '-preset fast', '-movflags +faststart'])
      .output(outputPath)
      .on('progress', (p) => console.log(`  ${height}p: ${Math.round(p.percent ?? 0)}%`))
      .on('end', () => resolve())
      .on('error', reject)
      .run()
  })
}

export async function processVideo(videoId: string, storagePath: string): Promise<void> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `vidtube-${videoId}-`))
  console.log(`\n🎬 Processing video ${videoId}`)
  console.log(`   Temp dir: ${tmpDir}`)

  try {
    // Mark as processing
    await prisma.video.update({ where: { id: videoId }, data: { status: 'processing' } })

    // 1. Download
    console.log('📥 Downloading...')
    const inputPath = path.join(tmpDir, 'input.mp4')
    await downloadVideo(storagePath, inputPath)

    // 2. Metadata
    const meta = await getMetadata(inputPath)
    console.log(`   ${meta.width}x${meta.height} — ${meta.duration}s`)

    // 3. Thumbnail
    console.log('🖼️  Generating thumbnail...')
    const thumbPath = path.join(tmpDir, 'thumbnail.jpg')
    await generateThumbnail(inputPath, thumbPath)
    const thumbStoragePath = `${videoId}/thumbnail.jpg`
    await uploadFile(thumbPath, 'thumbnails', thumbStoragePath, 'image/jpeg')

    // 4. 360p
    console.log('⚙️  Transcoding 360p...')
    const out360 = path.join(tmpDir, '360p.mp4')
    await transcode(inputPath, out360, 640, 360, '800k')
    const sp360 = `${videoId}/360p.mp4`
    await uploadFile(out360, 'video-variants', sp360, 'video/mp4')

    // 5. 720p (if source is HD)
    let sp720: string | null = null
    if (meta.height >= 720) {
      console.log('⚙️  Transcoding 720p...')
      const out720 = path.join(tmpDir, '720p.mp4')
      await transcode(inputPath, out720, 1280, 720, '2500k')
      sp720 = `${videoId}/720p.mp4`
      await uploadFile(out720, 'video-variants', sp720, 'video/mp4')
    }

    // 6. Update DB
    console.log('💾 Updating database...')
    await prisma.$transaction(async (tx) => {
      await tx.thumbnail.create({
        data: {
          videoId,
          storagePath: thumbStoragePath,
          isSelected: true,
          isAuto: true,
        },
      })

      await tx.videoVariant.create({
        data: {
          videoId,
          quality: '360p',
          storagePath: sp360,
          width: 640,
          height: 360,
          bitrate: 800000,
          status: 'ready',
        },
      })

      if (sp720) {
        await tx.videoVariant.create({
          data: {
            videoId,
            quality: '720p',
            storagePath: sp720,
            width: 1280,
            height: 720,
            bitrate: 2500000,
            status: 'ready',
          },
        })
      }

      await tx.video.update({
        where: { id: videoId },
        data: {
          status: 'published',
          publishedAt: new Date(),
          duration: meta.duration,
        },
      })
    })

    console.log(`✅ Done — video ${videoId} published`)

  } catch (err) {
    console.error('❌ Processing failed:', err)
    await prisma.video.update({ where: { id: videoId }, data: { status: 'failed' } }).catch(() => {})
    throw err
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    await prisma.$disconnect()
  }
}