# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ClientPortal365** — Multi-tenant SaaS PWA for BusinessValue365. Client onboarding, collaboration, and ticket management platform.

## Commands

### Development
```bash
# Start both client (port 5173) and server (port 3001) concurrently
npm run dev

# Or start individually
cd client && npm run dev
cd server && npm run dev
```

### Database
```bash
cd server
npx prisma migrate dev          # Create and apply a migration
npx prisma migrate dev --name init  # First migration
npx prisma db seed              # Seed with demo data (SuperAdmin + 2 companies + 5 tickets)
npx prisma studio               # Open Prisma GUI at localhost:5555
npx prisma generate             # Regenerate client after schema changes
```

### Build
```bash
npm run build          # Build both client and server
cd client && npm run build
cd server && npm run build
```

## Architecture

### Monorepo layout
- `client/` — React 18 + Vite + TypeScript PWA frontend
- `server/` — Node.js + Express + Prisma backend
- Root `package.json` uses npm workspaces; `npm run dev` runs both via `concurrently`

### Backend pattern: route → controller → service → Prisma
- `server/src/routes/` — Express routers, mount middleware (authenticate, authorize), delegate to controllers
- `server/src/controllers/` — Thin: validate input, call service, send response. No business logic.
- `server/src/services/` — All business logic. No `req`/`res` objects here.
- `server/src/prisma/schema.prisma` — Single source of truth for the data model

### Authentication & authorization
- JWT access tokens (15 min) + httpOnly cookie refresh tokens (7 days)
- `server/src/middlewares/authenticate.ts` — Verifies Bearer token, attaches `req.user`
- `server/src/middlewares/authorize.ts` — `authorize('ADMIN', 'SUPER_ADMIN')` — RBAC check
- Three roles: `SUPER_ADMIN` | `ADMIN` | `CLIENT`

### Frontend state
- **Zustand** — `client/src/store/authStore.ts` (auth + token), `uiStore.ts` (theme, sidebar)
- **TanStack Query** — all server data; query keys follow `['resource', id?, 'sub-resource']`
- **Socket.io** — `client/src/hooks/useSocket.ts` — invalidates React Query cache on real-time events

### Realtime (Socket.io)
- Server: `server/src/sockets/index.ts` — authenticates via JWT in handshake, user joins `user:{id}` room
- Events emitted: `notification:new`, `ticket:updated`, `comment:new`, `kanban:move`, `presence:*`

### Scheduled jobs (node-cron)
- `server/src/jobs/reminders.job.ts` — hourly, sends reminder emails for active reminders
- `server/src/jobs/escalation.job.ts` — every 30 min, marks tickets OVERDUE when past SLA
- `server/src/jobs/autoClose.job.ts` — daily midnight, closes inactive tickets after N days (default 30)

### PWA
- Configured in `client/vite.config.ts` via `vite-plugin-pwa`
- Offline caching: dashboard and ticket list via `NetworkFirst` strategy
- Auth routes use `NetworkOnly` (never cache)

### File uploads
- `Multer` with `memoryStorage()` → `server/src/utils/storage.ts` → Supabase Storage
- Allowed types: PDF, DOCX, XLSX, ZIP, PNG, JPG, MP4 (enforced client-side; validate server-side too)

### Email
- `server/src/utils/email.ts` — wraps Resend SDK; logs a warning and skips if `RESEND_API_KEY` not set (safe in dev)

## Key files

| File | Purpose |
|---|---|
| `server/prisma/schema.prisma` | Full data model (18 models) |
| `server/src/middlewares/authenticate.ts` | JWT verification, attaches `req.user` |
| `server/src/middlewares/authorize.ts` | RBAC — `authorize(...roles)` |
| `server/src/utils/token.ts` | JWT sign/verify helpers |
| `server/src/utils/email.ts` | Resend integration + email templates |
| `server/src/utils/storage.ts` | Supabase Storage upload/delete |
| `client/src/store/authStore.ts` | Auth state + access token |
| `client/src/services/api.ts` | Axios instance with auto-refresh interceptor |
| `client/src/hooks/useSocket.ts` | Socket.io client + React Query invalidation |
| `client/src/App.tsx` | All routes (AuthLayout / AdminLayout / ClientLayout) |

## Environment variables

Copy `server/.env.example` to `server/.env`. Required:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/clientportal365
JWT_SECRET=                      # any random secret
JWT_REFRESH_SECRET=              # different random secret
SUPABASE_URL=                    # leave blank to skip file uploads in dev
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=                  # leave blank to skip emails in dev
CLIENT_URL=http://localhost:5173
SERVER_PORT=3001
```

## Seed credentials

After running `npx prisma db seed`:
- **SuperAdmin**: `superadmin@businessvalue365.com` / `Admin123!`
- **Admin**: `admin@businessvalue365.com` / `Admin123!`

---

## Database Table Sub-Agents

Every Prisma model has a dedicated sub-agent in `.claude/agents/`. These agents run automatically via the `FileChanged` hook whenever a file that touches database code is saved.

### How They Work

```
FileChanged hook
    └── database-review-coordinator     ← detects affected tables
            ├── db-user-agent           ← if User table touched
            ├── db-ticket-agent         ← if Ticket table touched
            ├── db-session-agent        ← if Session table touched
            └── ... (15 table agents total)
```

1. The `FileChanged` hook fires after any file is written or edited.
2. The **coordinator** (`database-review-coordinator.md`) reads the changed file and checks for Prisma queries, service layer DB calls, or schema references.
3. It identifies which tables are affected and reads the relevant table agent files.
4. Each table agent applies its checklist (SELECT/INSERT/UPDATE/DELETE, security, performance).
5. The coordinator combines results and outputs a deduplicated report with CRITICAL / WARNING / INFO severity levels.

### Table → Agent Mapping

| Table | Agent File |
|---|---|
| User | `.claude/agents/db-user-agent.md` |
| Company | `.claude/agents/db-company-agent.md` |
| Contact | `.claude/agents/db-contact-agent.md` |
| Team | `.claude/agents/db-team-agent.md` |
| TeamMember | `.claude/agents/db-team-member-agent.md` |
| Ticket | `.claude/agents/db-ticket-agent.md` |
| TicketComment | `.claude/agents/db-ticket-comment-agent.md` |
| TicketAttachment | `.claude/agents/db-ticket-attachment-agent.md` |
| TicketWatcher | `.claude/agents/db-ticket-watcher-agent.md` |
| Notification | `.claude/agents/db-notification-agent.md` |
| Reminder | `.claude/agents/db-reminder-agent.md` |
| ActivityLog | `.claude/agents/db-activity-log-agent.md` |
| EmailTemplate | `.claude/agents/db-email-template-agent.md` |
| Setting | `.claude/agents/db-setting-agent.md` |
| Session | `.claude/agents/db-session-agent.md` |

### When Sub-Agents Are Triggered

Automatically on every file change via `.claude/settings.json` hooks. They also run if you explicitly invoke the coordinator:

```
Use the database-review-coordinator agent to review server/src/services/tickets.service.ts
```

The coordinator skips non-DB files (React components, config files, markdown, `dist/`, migrations SQL) with a one-line message.

### Review Output Format

```
## Database Review: <filename>

### Tables Affected
- Ticket, TicketComment

### Ticket Findings
**[CRITICAL]** Missing companyId scope on findMany
- Line: 42
- Problem: Returns tickets from all companies
- Fix: Add where: { companyId: req.user.companyId }

### Verdict
NEEDS CHANGES
```

### Adding a New Table Sub-Agent

When you add a new Prisma model:

1. Create `.claude/agents/db-<tablename>-agent.md` using any existing table agent as a template.
   Include: schema, FK relationships, business rules, CRUD checklist, security risks, performance flags.

2. Add the table to the coordinator's **Table Registry** in `.claude/agents/database-review-coordinator.md`.

3. Add a checklist entry to `tasks.md`.

4. Document the decision in `decisions/` if there are notable design choices.

### Architecture Decision

See `decisions/db-subagents.md` for the full rationale, alternatives considered, and trade-offs.
