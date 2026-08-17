export const APP_NAME = 'VidTube'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const VIDEO_STATUSES = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  PUBLISHED: 'published',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
  SCHEDULED: 'scheduled',
} as const

export const VIDEO_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
} as const

export const EVENT_TYPES = {
  IMPRESSION: 'impression',
  CLICK: 'click',
  VIDEO_START: 'video_start',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_RESUME: 'video_resume',
  WATCH_25: 'watch_25',
  WATCH_50: 'watch_50',
  WATCH_75: 'watch_75',
  VIDEO_COMPLETE: 'video_complete',
  VIDEO_SKIP: 'video_skip',
  LIKE: 'like',
  DISLIKE: 'dislike',
  COMMENT: 'comment',
  REPLY: 'reply',
  SHARE: 'share',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SEARCH: 'search',
  PLAYLIST_ADD: 'playlist_add',
  WATCH_LATER: 'watch_later',
} as const

export const NOTIFICATION_TYPES = {
  NEW_VIDEO: 'new_video',
  NEW_SUBSCRIBER: 'new_subscriber',
  COMMENT: 'comment',
  REPLY: 'reply',
  COMMENT_LIKE: 'comment_like',
  SYSTEM: 'system',
} as const

export const PAGINATION = {
  FEED_PAGE_SIZE: 20,
  COMMENTS_PAGE_SIZE: 20,
  SEARCH_PAGE_SIZE: 20,
  NOTIFICATIONS_PAGE_SIZE: 30,
  STUDIO_CONTENT_PAGE_SIZE: 30,
} as const

export const VIDEO_RESOLUTIONS = ['360p', '480p', '720p', '1080p'] as const
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number]

export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB
export const MAX_THUMBNAIL_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']