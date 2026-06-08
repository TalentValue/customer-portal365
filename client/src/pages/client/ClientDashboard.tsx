import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Bell, AlertTriangle, Sparkles, Activity, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/common/StatCard'
import { TicketCard } from '@/components/tickets/TicketCard'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { useAuthStore } from '@/store/authStore'
import { ticketsService } from '@/services/tickets.service'
import { notificationsService } from '@/services/notifications.service'

const TIPS = [
  'Tip: Use the search bar (⌘K) to jump straight to any ticket.',
  'Tip: Mark a ticket complete the moment your part is done — it keeps your team unblocked.',
  'Tip: Attach files directly to a ticket so everything stays in one thread.',
  'Tip: Turn on email notifications in your profile to never miss an update.',
  'Tip: Add a comment any time you need clarification — your team is notified instantly.',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function ClientDashboard() {
  const { user } = useAuthStore()
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000)
    return () => clearInterval(id)
  }, [])

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['client-tickets'],
    queryFn: () => ticketsService.list({ limit: 5 }).then((r) => r.data),
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount().then((r) => r.data),
  })

  if (isLoading) return <PageSkeleton />

  const openTickets = ticketsData?.data?.filter((t) => !['COMPLETED', 'CLOSED'].includes(t.status)) ?? []
  const overdueTickets = ticketsData?.data?.filter((t) => t.status === 'OVERDUE') ?? []
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-4">
      {/* ── Welcome banner ── */}
      <motion.div
        variants={rowVariants}
        className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 50%, rgba(6,182,212,0.05) 100%)' }}
        />
        <motion.div
          className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-5"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-28 w-28 text-indigo-500" />
        </motion.div>

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">{today}</p>
            <h1 className="text-2xl font-extrabold text-slate-800">
              {getGreeting()},{' '}
              <span className="text-gradient-ai font-extrabold">{user?.firstName ?? 'there'}</span>{' '}
              👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">Here's what needs your attention today.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600">Live Portal</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div variants={rowVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          index={0}
          label="Open Tickets"
          value={openTickets.length}
          icon={Ticket}
          desc="Currently in progress"
          gradient="from-indigo-500 to-blue-600"
          glow="shadow-indigo-100"
          topBar="bg-gradient-to-r from-indigo-400 to-blue-500"
          textColor="text-indigo-600"
        />
        <StatCard
          index={1}
          label="Unread Notifications"
          value={notifData?.count ?? 0}
          icon={Bell}
          desc="Waiting for your review"
          gradient="from-amber-500 to-orange-500"
          glow="shadow-amber-100"
          topBar="bg-gradient-to-r from-amber-400 to-orange-400"
          textColor="text-amber-600"
        />
        <StatCard
          index={2}
          label="Overdue Items"
          value={overdueTickets.length}
          icon={AlertTriangle}
          desc="Past their due date"
          gradient="from-red-500 to-rose-600"
          glow="shadow-red-100"
          topBar="bg-gradient-to-r from-red-400 to-rose-500"
          textColor="text-red-600"
        />
      </motion.div>

      {/* ── AI insight strip ── */}
      <motion.div
        variants={rowVariants}
        className="gradient-border-glow relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 px-5 py-3.5 flex items-center gap-3"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-slate-600"
          >
            {TIPS[tipIndex]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* ── Recent tickets ── */}
      <motion.div variants={rowVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-indigo-500" />
            Recent Tickets
          </h2>
          <Button variant="outline" size="sm" asChild className="border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 group">
            <a href="/portal/tickets" className="flex items-center gap-1">
              View all
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </div>
        {ticketsData?.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticketsData.data.slice(0, 4).map((t, i) => (
              <TicketCard key={t.id} ticket={t} showCompany={false} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No tickets assigned to you yet.</p>
        )}
      </motion.div>
    </motion.div>
  )
}
