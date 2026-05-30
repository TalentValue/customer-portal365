import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, Ticket, BarChart3,
  Bell, Settings, FileText, ChevronLeft, LogOut, Shield, Users2, Copy,
} from 'lucide-react'
import { cn } from '@/utils/cn'
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
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col h-full shrink-0 overflow-hidden bg-white border-r border-indigo-100"
      >
        {/* Subtle top aurora tint */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-40 opacity-40"
          style={{ background: 'linear-gradient(180deg, #eef2ff 0%, transparent 100%)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center h-16 px-4 gap-3 overflow-hidden border-b border-indigo-100">
          <motion.div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="h-4 w-4 text-white" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <span className="font-bold text-sm whitespace-nowrap text-slate-800">
                  Client<span className="text-indigo-600">Portal</span>
                  <span className="text-cyan-500">365</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            const item = (
              <Link
                key={to}
                to={to}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 group',
                  active
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent'
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
        <div className="relative p-2 border-t border-indigo-100 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <Avatar className="h-7 w-7 shrink-0 ring-2 ring-indigo-200">
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold truncate text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-base text-slate-400 truncate capitalize">
                    {user?.role?.toLowerCase().replace('_', ' ')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="w-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={toggleSidebar}
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
