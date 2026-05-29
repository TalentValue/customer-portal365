import { Link } from 'react-router-dom'
import { Calendar, MessageSquare, Paperclip, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { Ticket } from '@/types'
import { formatDate } from '@/utils/formatDate'
import { useAuthStore } from '@/store/authStore'

interface Props {
  ticket: Ticket
  showCompany?: boolean
}

export function TicketCard({ ticket, showCompany = true }: Props) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const detailPath = isAdmin ? `/admin/tickets/${ticket.id}` : `/portal/tickets/${ticket.id}`

  return (
    <Link to={detailPath}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-medium text-sm line-clamp-2 flex-1">{ticket.title}</h3>
            <PriorityBadge priority={ticket.priority} />
          </div>
          {showCompany && ticket.company && (
            <p className="text-xs text-muted-foreground mb-2">{ticket.company.name}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              <span className="flex items-center gap-1 ml-auto">
                <User className="h-3 w-3" />
                {ticket.assignee.firstName}
              </span>
            )}
          </div>
          {(ticket.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ticket.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">{tag}</Badge>
              ))}
              {ticket.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">+{ticket.tags.length - 3}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
