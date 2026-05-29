import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, pattern) : '—'
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'MMM d, yyyy h:mm a')
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
