import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Building2, Ticket, AlertCircle, Clock, TrendingUp,
  Plus, UserPlus, BarChart3, ArrowUpRight, Activity,
  Sparkles, Crown, UserCog,
} from 'lucide-react'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { StatCard } from '@/components/common/StatCard'
import { formatRelative } from '@/utils/formatDate'
import api from '@/services/api'
import { DashboardStats } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

/* ── Stat card config ── */
const STAT_CONFIG = [
  {
    key: 'totalCompanies' as keyof DashboardStats,
    label: 'Total Companies',
    icon: Building2,
    desc: 'Active client companies',
    gradient: 'from-blue-500 to-blue-700',
    glow: 'shadow-blue-200',
    ring: 'ring-blue-100',
    topBar: 'bg-gradient-to-r from-blue-400 to-blue-600',
    textColor: 'text-blue-600',
  },
  {
    key: 'activeTickets' as keyof DashboardStats,
    label: 'Active Tickets',
    icon: Ticket,
    desc: 'Open and in-progress',
    gradient: 'from-violet-500 to-purple-700',
    glow: 'shadow-violet-200',
    ring: 'ring-violet-100',
    topBar: 'bg-gradient-to-r from-violet-400 to-purple-600',
    textColor: 'text-violet-600',
  },
  {
    key: 'overdueTickets' as keyof DashboardStats,
    label: 'Overdue Tickets',
    icon: AlertCircle,
    desc: 'Require immediate attention',
    gradient: 'from-red-500 to-orange-600',
    glow: 'shadow-red-200',
    ring: 'ring-red-100',
    topBar: 'bg-gradient-to-r from-red-400 to-orange-500',
    textColor: 'text-red-600',
  },
  {
    key: 'pendingApprovals' as keyof DashboardStats,
    label: 'Pending Approvals',
    icon: Clock,
    desc: 'Awaiting response',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-200',
    ring: 'ring-amber-100',
    topBar: 'bg-gradient-to-r from-amber-400 to-orange-400',
    textColor: 'text-amber-600',
  },
]

/* ── Custom chart tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-indigo-100 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl shadow-indigo-100/50 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Quick action card ── */
function QuickAction({ icon: Icon, label, desc, gradient, onClick, index }: {
  icon: React.ElementType
  label: string
  desc: string
  gradient: string
  onClick: () => void
  index: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400 truncate">{desc}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </motion.button>
  )
}

function SuperAdminBanner() {
  const { data: staff = [] } = useQuery<{ id: string; role: string }[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })
  const superAdmins = staff.filter((u) => u.role === 'SUPER_ADMIN').length
  const admins = staff.filter((u) => u.role === 'ADMIN').length

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-5">
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07]">
        <Crown className="h-28 w-28 text-purple-600" />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
          <Crown className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-purple-800">Platform Overview</p>
          <p className="text-xs text-purple-500">Super Admin view — all data across tenants</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Super Admins', value: superAdmins, icon: Crown, color: 'text-purple-600 bg-purple-100' },
          { label: 'Admins', value: admins, icon: UserCog, color: 'text-indigo-600 bg-indigo-100' },
          { label: 'Staff Total', value: staff.length, icon: UserCog, color: 'text-blue-600 bg-blue-100' },
          { label: 'Cron Jobs', value: 3, icon: Activity, color: 'text-emerald-600 bg-emerald-100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-white/60 border border-white px-3 py-2.5 flex items-center gap-2.5 backdrop-blur-sm">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SAMPLE_CHART = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  tickets: Math.floor(Math.random() * 20) + 5,
  resolved: Math.floor(Math.random() * 15) + 2,
}))

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data),
  })

  if (isLoading) return <PageSkeleton />

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-4"
    >
      {/* ── Welcome banner ── */}
      <motion.div
        variants={rowVariants}
        className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm"
      >
        {/* Background shimmer */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 50%, rgba(6,182,212,0.05) 100%)',
          }}
        />
        <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-5">
          <Sparkles className="h-28 w-28 text-indigo-500" />
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">{today}</p>
            <h1 className="text-2xl font-extrabold text-slate-800">
              {getGreeting()},{' '}
              <span
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent"
              >
                {user?.firstName ?? 'there'}
              </span>{' '}
              👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here's what's happening across your portal today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600">Live Dashboard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* ── SuperAdmin platform overview ── */}
      {user?.role === 'SUPER_ADMIN' && (
        <motion.div variants={rowVariants}>
          <SuperAdminBanner />
        </motion.div>
      )}

      {/* ── Stat cards ── */}
      <motion.div variants={rowVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map((config, i) => (
          <StatCard
            key={config.key}
            label={config.label}
            desc={config.desc}
            icon={config.icon}
            gradient={config.gradient}
            glow={config.glow}
            topBar={config.topBar}
            textColor={config.textColor}
            value={(data?.[config.key] as number) ?? 0}
            index={i}
          />
        ))}
      </motion.div>

      {/* ── Chart + Activity ── */}
      <motion.div variants={rowVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                Ticket Activity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">This week's ticket flow</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={SAMPLE_CHART} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="day" tick={{ fontSize: 16, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 16, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '16px', paddingTop: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="tickets"
                name="Created"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradTickets)"
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#gradResolved)"
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
            <span className="text-base font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {data?.recentActivity?.slice(0, 8).map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1.5 flex-shrink-0 relative">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-sm" />
                  {i < (data.recentActivity.length - 1) && (
                    <div className="absolute left-[3px] top-3 bottom-0 w-px bg-indigo-100" style={{ height: '20px' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 leading-snug">{log.action}</p>
                  <p className="text-base text-slate-400 mt-0.5">{formatRelative(log.createdAt)}</p>
                </div>
              </motion.div>
            )) ?? (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div variants={rowVariants}>
        <h2 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            index={0}
            icon={Plus}
            label="New Ticket"
            desc="Submit a support request"
            gradient="from-indigo-500 to-purple-600"
            onClick={() => navigate('/admin/tickets')}
          />
          <QuickAction
            index={1}
            icon={UserPlus}
            label="Invite Client"
            desc="Add a new contact to a company"
            gradient="from-cyan-500 to-blue-600"
            onClick={() => navigate('/admin/contacts')}
          />
          <QuickAction
            index={2}
            icon={BarChart3}
            label="View Reports"
            desc="Analytics & performance insights"
            gradient="from-emerald-500 to-teal-600"
            onClick={() => navigate('/admin/analytics')}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
