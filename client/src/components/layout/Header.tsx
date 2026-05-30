import { useEffect, useState } from 'react'
import { Bell, Search, Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import { NotificationDropdown } from './NotificationDropdown'
import { CommandPalette } from '@/components/common/CommandPalette'

export function Header() {
  const { theme, setTheme } = useUIStore()
  const { user } = useAuthStore()
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
      <header className="relative flex items-center h-16 px-6 gap-4 z-20 border-b border-indigo-100/80 bg-white/75 backdrop-blur-xl shadow-sm shadow-indigo-100/50">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 h-9 text-sm text-slate-400 hover:border-indigo-300 hover:bg-white transition-all duration-200 group"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-indigo-400 group-hover:text-indigo-500" />
            <span className="flex-1 text-left text-xs">Search anything...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-indigo-200 bg-white px-1.5 font-mono text-base font-medium text-indigo-400">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* User greeting */}
          {user && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-base text-slate-400 leading-none mt-0.5 capitalize">
                  {user.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-5 w-px bg-indigo-100 mx-1" />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(nextTheme)}
            className="h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen((o) => !o)}
              className="h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <Bell className="h-4 w-4" />
              {countData?.count && countData.count > 0 ? (
                <span
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-base font-bold text-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 0 6px rgba(99,102,241,0.5)' }}
                >
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
