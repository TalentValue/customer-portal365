# CLAUDE.md — CustomerPortal365

> Repo guide for AI coding agents. Copy this to the project root as `CLAUDE.md` when scaffolding (Phase 0). Keep it updated as patterns emerge.

## What this is
CustomerPortal365: a multi-tenant B2B SaaS platform for BusinessValue365 — admin console + customer self-service portal + per-product micro-sites. Full specs in `docs/` (PRD, TDD, DESIGN_SYSTEM, WORKFLOW, PROMPT_PLAYBOOK, adr/). **Requirement IDs in the PRD are binding.**

## Stack
Next.js 15 (App Router, RSC + server actions) · TypeScript strict · Tailwind v4 + shadcn/ui + Radix · Lucide · Recharts · TanStack Query (client islands) · React Hook Form + Zod · Drizzle ORM + PostgreSQL 16 · Clerk (auth + MFA) · Stripe (billing) · Resend (email) · S3 (documents) · Vitest/Testing Library/Playwright · pnpm · Vercel + Neon.

## Non-negotiable rules
1. **Tenant isolation:** every customer-scoped query goes through the tenant-scope wrapper; derive `customer_id` from the session, never client input. Postgres RLS is enabled as a backstop. Never write an unscoped query against a customer-scoped table.
2. **RBAC** is enforced in the service/route layer (not just UI). Roles: `super_admin`, `customer_admin`, `customer_user` (see PRD §3.1 access matrix).
3. **Audit everything:** every mutation writes an immutable `audit_logs` entry (actor, action, resource, IP). `audit_logs` has UPDATE/DELETE revoked at the DB level — never add an edit/delete path.
4. **Validate all input with Zod**; reject unknown fields.
5. **Money is integer cents.** IDs are UUID. Timestamps are timezone-aware.
6. **Vertical slices:** schema → service → API/action → UI → tests, per feature.
7. **Green before done:** `tsc --noEmit`, ESLint, and tests pass before closing a task.

## Layout (see TDD §3)
- `app/(admin)/admin/*` — super_admin only.
- `app/(portal)/portal/*` — customer roles; `apps/[slug]` = micro-sites.
- `app/api/v1/*` — REST surface; `app/api/webhooks/*` — Stripe/Clerk; `app/api/cron/*`.
- `lib/db` (schema, migrations) · `lib/auth` · `lib/tenancy` · `lib/rbac` · `lib/services` · `lib/billing` · `lib/email` · `lib/validation` · `lib/api/envelope.ts`.

## API conventions
- Response envelope: `{ ok: true, data, meta }` / `{ ok: false, error: { code, message, details } }`.
- Error codes → HTTP: UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, VALIDATION 422, RATE_LIMITED 429, CONFLICT 409, INTERNAL 500.

## Conventions
- Conventional commits, reference requirement IDs (e.g. `feat(admin): customers list FR-ADM-10`).
- Every data view handles loading/empty/error/success (DESIGN_SYSTEM §3.1).
- Brand tokens and component rules in DESIGN_SYSTEM.md — use the tokens, never hardcode hex.
- If you deviate from an ADR, write a new ADR first.

## Commands (after Phase 0)
- `pnpm dev` · `pnpm typecheck` (`tsc --noEmit`) · `pnpm lint` · `pnpm test` · `pnpm test:e2e`
- `pnpm db:generate` / `pnpm db:migrate` (drizzle-kit) · `pnpm db:seed`

## Build order
Follow WORKFLOW.md phases 0→8; one phase per session; pass the gate before advancing.
