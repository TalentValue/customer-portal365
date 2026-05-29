import type { InviteStatus } from '@/types'

export const INVITE_STATUS_BADGE: Record<InviteStatus, 'success' | 'warning' | 'secondary'> = {
  ACCEPTED: 'success',
  PENDING: 'warning',
  EXPIRED: 'secondary',
}
