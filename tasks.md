# Tasks

## DB Table Sub-Agent Implementation

### Setup
- [x] Inspect database schema (`server/prisma/schema.prisma`)
- [x] Identify all 15 tables: User, Company, Contact, Team, TeamMember, Ticket, TicketComment, TicketAttachment, TicketWatcher, Notification, Reminder, ActivityLog, EmailTemplate, Setting, Session
- [x] Review existing `.claude/` folder structure

### Table Sub-Agents (`.claude/agents/`)
- [x] `db-user-agent.md` — auth fields, role enforcement, password hash safety
- [x] `db-company-agent.md` — status transitions, multi-tenant scoping
- [x] `db-contact-agent.md` — invite lifecycle, company scoping
- [x] `db-team-agent.md` — membership, access control
- [x] `db-team-member-agent.md` — composite PK, cascade integrity
- [x] `db-ticket-agent.md` — status transitions, SLA, CLIENT scoping
- [x] `db-ticket-comment-agent.md` — internal comment visibility
- [x] `db-ticket-attachment-agent.md` — file validation, Supabase sync
- [x] `db-ticket-watcher-agent.md` — duplicate prevention, notification triggering
- [x] `db-notification-agent.md` — user scoping, bulk mark-read safety
- [x] `db-reminder-agent.md` — frequency validation, cron logic
- [x] `db-activity-log-agent.md` — append-only enforcement, metadata safety
- [x] `db-email-template-agent.md` — XSS prevention, variable consistency
- [x] `db-setting-agent.md` — global vs per-company, nullable upsert fix
- [x] `db-session-agent.md` — token rotation, expiry enforcement

### Coordinator
- [x] `database-review-coordinator.md` — routes to correct table agent(s), deduplicates findings

### Hooks
- [x] Existing `FileChanged` hook retained for general code review
- [x] Second `FileChanged` hook added to trigger `database-review-coordinator` on DB-related changes
- [x] Both hooks in `.claude/settings.json`

### Documentation
- [x] `CLAUDE.md` updated with DB sub-agent section
- [x] `tasks.md` created (this file)
- [x] `decisions/db-subagents.md` created

---

## Session Persistence Fix

> Fixes the bug where refreshing the page after login redirects back to `/login`.

### Root Cause Analysis (via `db-session-agent`)
- **Client**: `isAuthenticated` was excluded from Zustand `partialize` → lost on reload
- **Client**: No silent session restore on app boot → access token always `null` after reload
- **Server**: Refresh token was a JWT (`signRefreshToken`) → verifiable without DB lookup, breaking revocation
- **Server**: `session.update()` used for token rotation → left a window where old token was still valid

### Changes Applied
- [x] `client/src/store/authStore.ts` — add `isAuthenticated` to `partialize`; add `isRestoring` state (not persisted); remove unsafe `onRehydrateStorage` mutation
- [x] `client/src/hooks/useSessionRestore.ts` — new hook: calls `/api/auth/refresh` on boot using httpOnly cookie; clears store on failure; marks `isRestoring = false` when done
- [x] `client/src/hooks/useSessionRestore.ts` — added `timeout: 5000` to prevent infinite spinner if server is unreachable
- [x] `client/src/App.tsx` — call `useSessionRestore()` at app root (outside all layout guards)
- [x] `client/src/layouts/AdminLayout.tsx` — show loading spinner while `isRestoring`, then check `isAuthenticated`
- [x] `client/src/layouts/ClientLayout.tsx` — same `isRestoring` spinner pattern
- [x] `server/src/services/auth.service.ts` — `login()`: use `generateToken()` (opaque 32-byte hex) instead of JWT for refresh token
- [x] `server/src/services/auth.service.ts` — `refresh()`: rotate via `$transaction([delete, create])` instead of `update()`

### Verification
- [x] TypeScript check: `client/` — no errors
- [x] TypeScript check: `server/` — no errors
- [x] Code review (code-reviewer agent) — no remaining criticals

### See Also
- `decisions/session-persistence-fix.md` — full rationale and trade-offs

---

## Pending / Future Work

- [ ] Add `@@index([isActive, lastSentAt])` to Reminder for cron query performance
- [ ] Add compound index `[companyId, status]` to Ticket for filtered list queries
- [ ] Add session expiry cleanup cron job (`prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })`)
- [ ] Add notification retention cleanup cron (purge read notifications older than 90 days)
- [ ] Add new table sub-agent if a new Prisma model is added (see CLAUDE.md for instructions)
- [ ] Consider adding `companyId` to Team model if multi-tenant scoping is required
