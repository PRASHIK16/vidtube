import { getAdminUsers } from '@/lib/actions/admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const { users, total, pages } = await getAdminUsers(currentPage)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users ({total.toLocaleString()})</h1>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Username</th>
              <th className="text-left p-3 font-medium">Channel</th>
              <th className="text-left p-3 font-medium">Comments</th>
              <th className="text-left p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">@{user.username}</td>
                <td className="p-3">
                  {user.channel ? (
                    <Link href={`/channel/${user.channel.handle}`} className="text-blue-500 hover:underline">
                      {user.channel.name}
                    </Link>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-3">{user._count.comments}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/users?page=${p}`}
              className={`px-3 py-1 rounded border text-sm ${p === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}