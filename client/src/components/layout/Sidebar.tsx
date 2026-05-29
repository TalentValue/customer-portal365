import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, Ticket, BarChart3,
  Bell, Settings, FileText, ChevronLeft, LogOut, Shield, Users2, Copy,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const ADMIN_NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/companies', icon: Building2, label: 'Companies' },
  { to: '/admin/contacts', icon: Users, label: 'Contacts' },
  { to: '/admin/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/admin/templates', icon: Copy, label: 'Templates' },
  { to: '/admin/team', icon: Users2, label: 'Team' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

const CLIENT_NAV = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portal/tickets', icon: Ticket, label: 'My Tickets' },
  { to: '/portal/notifications', icon: Bell, label: 'Notifications' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const nav = isAdmin ? ADMIN_NAV : CLIENT_NAV

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?'

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col h-full bg-card border-r shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b gap-2 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold text-sm whitespace-nowrap"
              >
                ClientPortal365
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            const item = (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
            return sidebarCollapsed ? (
              <Tooltip key={to}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : item
          })}
        </nav>

        {/* User + collapse */}
        <div className="p-2 border-t space-y-1">
          <div className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg', !sidebarCollapsed && 'pr-0')}>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={toggleSidebar}
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
