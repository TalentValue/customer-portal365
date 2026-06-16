# CustomerPortal365 — Design & Build Document Set

This folder contains everything Claude Code needs to design and build **CustomerPortal365**, a multi-tenant B2B SaaS platform for BusinessValue365 (admin console + customer self-service portal + per-product micro-sites).

The documents were derived from the original *Scope of Work* but deliberately modernize the stack to current best practices (Next.js full-stack, managed auth via Clerk with MFA, Stripe billing, Drizzle + Postgres, defense-in-depth multi-tenancy). Rationale is in the ADRs.

## Documents

| File | Purpose | Read when |
|---|---|---|
| [PRD.md](./PRD.md) | Product requirements — *what* and *why*; binding requirement IDs, personas, NFRs, acceptance criteria. | First. Source of product truth. |
| [TDD.md](./TDD.md) | Technical design — stack, architecture, multi-tenancy, data model, API, security, deployment. | Before building anything. |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI/UX — brand tokens, layout, components, page-by-page specs, accessibility. | When building any screen. |
| [WORKFLOW.md](./WORKFLOW.md) | Phased build plan (0–8) with exit gates and working rules. | To sequence the work. |
| [PROMPT_PLAYBOOK.md](./PROMPT_PLAYBOOK.md) | Copy-paste prompts to drive Claude Code phase by phase. | When actually prompting Claude. |
| [CLAUDE.md](./CLAUDE.md) | Repo guide / guardrails for the agent. Copy to project root at Phase 0. | Throughout. |
| [adr/](./adr/) | Architecture Decision Records — the *why* behind each major choice. | When questioning or changing a decision. |

## How to use this with Claude Code

1. Put this `docs/` folder at the root of your new project repo.
2. Open Claude Code in the repo and run the **Kickoff prompt** in [PROMPT_PLAYBOOK.md](./PROMPT_PLAYBOOK.md). It tells Claude to read all the specs and create the root `CLAUDE.md`.
3. Work **one phase per session**: paste the Phase 0 prompt, let Claude build, then run the Phase Gate Checklist ([WORKFLOW.md §4](./WORKFLOW.md)) before accepting.
4. Repeat for Phases 1–8 in order. Don't start a phase until the previous gate passes.
5. If Claude wants to deviate from an ADR, have it write a new ADR first.

## Authority order
When documents disagree: PRD wins on product behavior; TDD wins on implementation mechanism; ADRs explain and can supersede earlier technical choices (write a new ADR to change one).

## Stack at a glance
Next.js 15 · TypeScript strict · Tailwind v4 + shadcn/ui · Drizzle + PostgreSQL · Clerk (auth + TOTP MFA) · Stripe (billing) · Resend (email) · S3 (documents) · Vitest/Playwright · pnpm · Vercel + Neon.

---
*© 2026 BusinessValue365. Confidential.*
