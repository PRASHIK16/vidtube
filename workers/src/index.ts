import express from 'express'
import { processVideo } from './processor'

const app = express()
app.use(express.json())

const SECRET = process.env.VIDEO_WORKER_SECRET!
const PORT = parseInt(process.env.PORT ?? '3001')

// Auth middleware
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token !== SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/process', auth, async (req, res) => {
  const { videoId, storagePath } = req.body

  if (!videoId || !storagePath) {
    res.status(400).json({ error: 'videoId and storagePath are required' })
    return
  }

  // Respond immediately — processing happens in background
  res.json({ message: 'Processing started', videoId })

  try {
    await processVideo(videoId, storagePath)
  } catch (err) {
    console.error('Background processing error:', err)
  }
})

app.listen(PORT, () => {
  console.log(`🚀 VidTube Worker running on port ${PORT}`)
})