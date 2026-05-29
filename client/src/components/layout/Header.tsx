import { useEffect, useState } from 'react'
import { Bell, Search, Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import { NotificationDropdown } from './NotificationDropdown'
import { CommandPalette } from '@/components/common/CommandPalette'

export function Header() {
  const { theme, setTheme } = useUIStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount().then((r) => r.data),
    refetchInterval: 30000,
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const themeIcons = { light: Sun, dark: Moon, system: Monitor }
  const ThemeIcon = themeIcons[theme]
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <>
      <header className="flex items-center h-16 px-6 border-b gap-4 bg-background">
        <div className="flex-1 max-w-md">
          <button
            onClick={() => setSearchOpen(true)}
            className="relative w-full flex items-center gap-2 rounded-md border px-3 h-9 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search companies, tickets...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setTheme(nextTheme)}>
            <ThemeIcon className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setNotifOpen((o) => !o)}>
              <Bell className="h-4 w-4" />
              {countData?.count && countData.count > 0 ? (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {countData.count > 9 ? '9+' : countData.count}
                </span>
              ) : null}
            </Button>
            {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
          </div>
        </div>
      </header>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </>
  )
}
