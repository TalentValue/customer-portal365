import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { notificationsService } from '@/services/notifications.service'
import { authService } from '@/services/auth.service'
import { formatRelative } from '@/utils/formatDate'
import { cn } from '@/utils/cn'
import { useToast } from '@/hooks/useToast'

const PREF_LABELS: Record<string, string> = {
  ticket_created: 'New ticket created',
  ticket_updated: 'Ticket status updated',
  ticket_assigned: 'Ticket assigned to me',
  comment_added: 'New comment on ticket',
  ticket_overdue: 'Ticket overdue alert',
  ticket_approved: 'Ticket approved/rejected',
  reminder: 'Reminders',
}

export default function Notifications() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationsService.list({ limit: 50 }).then((r) => r.data),
  })

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => authService.getNotificationPreferences().then((r) => r.data),
  })

  const markAll = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const del = useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const updatePrefs = useMutation({
    mutationFn: (updated: Record<string, boolean>) =>
      authService.updateNotificationPreferences(updated),
    onSuccess: (_, updated) => {
      qc.setQueryData(['notification-preferences'], updated)
    },
    onError: () => toast({ title: 'Failed to save preferences', variant: 'destructive' }),
  })

  const togglePref = (key: string, current: boolean) => {
    const current_prefs = prefs ?? {}
    updatePrefs.mutate({ ...current_prefs, [key]: !current })
  }

  const unreadCount = data?.data?.filter((n) => !n.isRead).length ?? 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <p className="text-muted-foreground text-sm">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <Check className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {data.data.map((n) => (
            <div key={n.id} className={cn('flex items-start gap-3 rounded-lg border p-4 transition-colors', !n.isRead && 'bg-primary/5 border-primary/20')}>
              {!n.isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
              <div className={cn('flex-1 min-w-0', n.isRead && 'pl-4')}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => del.mutate(n.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">Choose which notifications you receive</p>
        </div>
        {prefsLoading ? (
          <div className="space-y-3">
            {Object.keys(PREF_LABELS).map((k) => (
              <div key={k} className="h-8 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(PREF_LABELS).map(([key, label]) => {
              const enabled = prefs ? (prefs[key] !== false) : true
              return (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label htmlFor={`pref-${key}`} className="text-sm cursor-pointer">{label}</Label>
                  <Switch
                    id={`pref-${key}`}
                    checked={enabled}
                    onCheckedChange={() => togglePref(key, enabled)}
                    disabled={updatePrefs.isPending}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
