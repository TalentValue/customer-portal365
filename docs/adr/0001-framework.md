# ADR 0001 — Next.js (App Router) as the single full-stack framework

**Status:** Accepted · **Date:** 2026-06-16

## Context
The original Scope of Work specified a separate React + Vite SPA and an Express 5 API in a pnpm monorepo. That split requires hand-built glue: a second deploy target, CORS, manual fetch/serialization layers, duplicated types, and bespoke session wiring. The user asked us to apply current industry best practices rather than follow the document's stack literally. The app is a data-heavy, auth-gated B2B dashboard — exactly the workload server-rendered React frameworks optimize for.

## Options considered
1. **Vite SPA + Express API** (as specced) — maximum separation, but most glue and two deployables.
2. **Remix / React Router framework** — strong data model, good DX; smaller ecosystem for the managed services we want.
3. **Next.js App Router** — RSC for direct server data access, server actions for mutations, route handlers for webhooks/REST, one deploy, first-class integrations with Clerk/Stripe/Vercel.

## Decision
Adopt **Next.js 15 (App Router)** as a single full-stack application. Pages are React Server Components that read data directly through the service layer; mutations use server actions; webhooks and any external REST live under `app/api/v1` and `app/api/webhooks`.

## Consequences
**Positive:** one codebase and deploy; shared TypeScript types end-to-end; less networking glue; built-in code splitting, caching, and streaming; the largest ecosystem of examples for an AI agent to build against.
**Negative:** server actions and RSC have a learning curve; some logic is framework-coupled. Mitigated by keeping business logic in framework-agnostic `lib/services` so it stays testable and portable.

## Revisit if
We need a non-JS backend, or a truly decoupled public API becomes the primary product surface.
