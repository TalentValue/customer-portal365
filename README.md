# CustomerPortal365

Multi-tenant B2B SaaS platform for BusinessValue365 — admin console, customer
self-service portal, and per-product micro-sites in one Next.js app.

Authoritative specs live in [`docs/`](./docs): PRD, TDD, DESIGN_SYSTEM,
WORKFLOW, PROMPT_PLAYBOOK, and ADRs. Requirement IDs in the PRD are binding.
Agent build guide: [`CLAUDE.md`](./CLAUDE.md).

## Stack
Next.js 15 (App Router) · TypeScript strict · Tailwind v4 + shadcn/ui · Drizzle
ORM + PostgreSQL · Clerk (auth/MFA) · Stripe (billing) · Resend · S3 · Vitest +
Playwright · pnpm · Vercel + Neon.

## Getting started
```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev                     # http://localhost:3000
```

## Scripts
| Command | Purpose |
|---|---|
| `pnpm dev` | Run the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (next) |
| `pnpm test` / `pnpm test:watch` | Vitest unit/integration |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm db:generate` / `db:migrate` / `db:push` | Drizzle migrations |
| `pnpm db:seed` | Seed demo data |

## Health
`GET /healthz` returns app + DB status (200 when the app is up).

## Build order
Phases 0→8 per [`docs/WORKFLOW.md`](./docs/WORKFLOW.md); one phase per session,
pass the gate before advancing.
