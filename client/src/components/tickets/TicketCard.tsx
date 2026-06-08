import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MessageSquare, Paperclip, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { Ticket } from '@/types'
import { formatDate } from '@/utils/formatDate'
import { useAuthStore } from '@/store/authStore'

interface Props {
  ticket: Ticket
  showCompany?: boolean
  index?: number
}

const PRIORITY_ACCENT: Record<string, string> = {
  LOW: 'from-slate-300 to-slate-400',
  MEDIUM: 'from-blue-400 to-indigo-500',
  HIGH: 'from-orange-400 to-amber-500',
  URGENT: 'from-red-500 to-rose-600',
}

export function TicketCard({ ticket, showCompany = true, index = 0 }: Props) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const detailPath = isAdmin ? `/admin/tickets/${ticket.id}` : `/portal/tickets/${ticket.id}`
  const accent = PRIORITY_ACCENT[ticket.priority] ?? PRIORITY_ACCENT.MEDIUM

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={detailPath} className="group block">
        <div className="glow-on-hover relative overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
          {/* Priority accent bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />

          {/* Hover sheen */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />

          <div className="relative p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1 text-slate-800 group-hover:text-indigo-600 transition-colors">
                {ticket.title}
              </h3>
              <PriorityBadge priority={ticket.priority} />
            </div>
            {showCompany && ticket.company && (
              <p className="text-xs text-slate-400 mb-2">{ticket.company.name}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <StatusBadge status={ticket.status} />
              {ticket.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(ticket.dueDate)}
                </span>
              )}
              {ticket._count && (
                <>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {ticket._count.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    {ticket._count.attachments}
                  </span>
                </>
              )}
              {ticket.assignee && (
                <span className="flex items-center gap-1 ml-auto text-indigo-400">
                  <User className="h-3 w-3" />
                  {ticket.assignee.firstName}
                </span>
              )}
            </div>
            {(ticket.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {ticket.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 border-indigo-100 text-indigo-500 bg-indigo-50/50">{tag}</Badge>
                ))}
                {ticket.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-indigo-100 text-indigo-400 bg-indigo-50/50">+{ticket.tags.length - 3}</Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
