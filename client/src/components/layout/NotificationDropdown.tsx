import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, X } from 'lucide-react'
import { notificationsService } from '@/services/notifications.service'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatRelative } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list({ limit: 10 }).then((r) => r.data),
  })

  const markAll = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border bg-popover shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Notifications</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAll.mutate()}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {!data?.data?.length ? (
            <p className="text-center text-muted-foreground text-sm py-8">No notifications</p>
          ) : (
            data.data.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOne.mutate(n.id)}
                className={cn(
                  'px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors',
                  !n.isRead && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                  <div className={cn('flex-1 min-w-0', n.isRead && 'pl-4')}>
                    <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
