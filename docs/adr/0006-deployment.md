# ADR 0006 — Vercel-first deployment with a portable fallback

**Status:** Accepted · **Date:** 2026-06-16

## Context
The app is a single Next.js application with a managed Postgres database and scheduled jobs (renewal reminders, MRR/churn recompute). We need staging and production environments, a migration step in the pipeline, and cron. The Scope of Work assumed a generic Node + PostgreSQL host.

## Options considered
1. **Vercel + Neon** — native Next.js hosting, preview deploys per PR, built-in Cron, Neon Postgres branching for safe migrations/testing.
2. **Docker on a Node host (Fly/Render/ECS) + managed Postgres** — portable, more ops to own (build, scaling, cron, TLS).
3. **Kubernetes** — overkill for current scale.

## Decision
Target **Vercel + a managed Postgres (Neon)** as the primary path: preview deployments per PR, environment-scoped secrets, Vercel Cron for scheduled route handlers, and Neon branches for migration testing. Keep the app **portable**: no Vercel-only runtime lock-in in business logic, a committed `Dockerfile`, and database access that works on any managed Postgres — so option 2 remains a low-effort fallback.

## Consequences
**Positive:** fastest path to staging/prod with preview environments, TLS, and cron handled; safe migration testing via DB branching.
**Negative:** vendor-specific cron/config; potential cost at scale. Mitigated by keeping logic framework/host-agnostic and shipping a Dockerfile.

## Revisit if
Cost, data residency, or compliance requires self-hosting — deploy the Docker image to a Node host and move cron to the platform scheduler.
