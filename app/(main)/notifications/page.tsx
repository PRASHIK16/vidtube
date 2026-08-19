import { getNotifications, markAllRead } from '@/lib/actions/notifications'
import { timeAgo } from '@/lib/utils/format'
import { Bell } from 'lucide-react'

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 rounded-xl border ${!n.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''}`}>
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
              <p className="text-xs text-muted-foreground mt-1">{timeAgo(new Date(n.createdAt))}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}