import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Building2, Ticket, Users, X } from 'lucide-react'
import { companiesService } from '@/services/companies.service'
import { ticketsService } from '@/services/tickets.service'
import api from '@/services/api'
import { useDebounce } from '@/hooks/useDebounce'

interface CommandPaletteProps {
  onClose: () => void
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const debouncedQuery = useDebounce(query, 300)
  const enabled = debouncedQuery.length >= 2

  const { data: companies } = useQuery({
    queryKey: ['search', 'companies', debouncedQuery],
    queryFn: () => companiesService.list({ search: debouncedQuery, limit: 5 }).then((r) => r.data.data),
    enabled,
  })

  const { data: tickets } = useQuery({
    queryKey: ['search', 'tickets', debouncedQuery],
    queryFn: () => ticketsService.list({ search: debouncedQuery, limit: 5 }).then((r) => r.data.data),
    enabled,
  })

  const { data: contacts } = useQuery({
    queryKey: ['search', 'contacts', debouncedQuery],
    queryFn: () => api.get('/contacts', { params: { search: debouncedQuery, limit: 5 } }).then((r) => r.data.data),
    enabled,
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onClose])

  const navigate_ = (path: string) => {
    navigate(path)
    onClose()
  }

  const hasResults = (companies?.length || tickets?.length || contacts?.length)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div
        className="bg-background border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, tickets, contacts..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {!query && (
            <p className="text-center text-sm text-muted-foreground py-8">Start typing to search...</p>
          )}
          {query && !enabled && (
            <p className="text-center text-sm text-muted-foreground py-8">Type at least 2 characters</p>
          )}
          {enabled && !hasResults && (
            <p className="text-center text-sm text-muted-foreground py-8">No results for "{query}"</p>
          )}

          {!!companies?.length && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Companies</p>
              {companies.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => navigate_(`/admin/companies/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-sm"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{c.industry ?? ''}</span>
                </button>
              ))}
            </div>
          )}

          {!!tickets?.length && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tickets</p>
              {tickets.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => navigate_(`/admin/tickets/${t.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-sm"
                >
                  <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">{t.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{t.status?.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}

          {!!contacts?.length && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contacts</p>
              {contacts.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => navigate_(`/admin/contacts`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-sm"
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">{c.firstName} {c.lastName}</span>
                  <span className="text-xs text-muted-foreground shrink-0 truncate max-w-40">{c.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span><kbd className="font-mono bg-muted px-1 rounded">↵</kbd> select</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
