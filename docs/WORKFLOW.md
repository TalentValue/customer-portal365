# Build Workflow & Phasing
## CustomerPortal365

| | |
|---|---|
| **Version** | 1.0 |
| **Last updated** | 2026-06-16 |
| **Companion to** | [PRD.md](./PRD.md) · [TDD.md](./TDD.md) · [PROMPT_PLAYBOOK.md](./PROMPT_PLAYBOOK.md) |

> This document defines the order in which Claude Code builds the system, the exit criteria ("gate") for each phase, and the working rules the agent follows throughout. Build phase-by-phase; do not start a phase until the previous phase's gate passes.

---

## 1. Working Method (applies to every phase)

1. **Read first.** Before coding a phase, re-read the relevant PRD requirements (by ID), the TDD section, and the design spec pages for that phase.
2. **Plan, then build.** Produce a short task plan for the phase, then implement in small, reviewable commits.
3. **Vertical slices.** Build each feature end-to-end (schema → service → API/action → UI → test) rather than all schemas, then all UIs.
4. **Tests are part of the feature**, not a later phase. Every service and mutation ships with tests, including a cross-tenant denial test where customer data is involved.
5. **Typecheck + lint must stay green.** `tsc --noEmit`, ESLint, and the test suite pass before a commit closes a task.
6. **Audit + tenancy by construction.** Customer-scoped reads/writes go through the tenant-scope wrapper; every mutation writes an audit entry. No exceptions.
7. **Conventional commits**, one logical change each. Reference requirement IDs in messages (e.g. `feat(admin): customer list FR-ADM-10`).
8. **Update CLAUDE.md** when a new pattern or decision emerges so later phases stay consistent.

---

## 2. Phase Plan

Each phase lists scope, the PRD requirement IDs it satisfies, and a **gate** (exit criteria). Detailed prompts for each phase are in [PROMPT_PLAYBOOK.md](./PROMPT_PLAYBOOK.md).

### Phase 0 — Project Foundation
**Scope:** Next.js + TypeScript (strict) app; Tailwind v4 + brand tokens; shadcn/ui; Drizzle + Postgres connection; drizzle-kit config; ESLint/Prettier/Husky; folder structure per TDD §3; `/healthz`; CI pipeline (typecheck, lint, test, build); `.env.example`; base app shell (sidebar + header layout, theming, dark mode toggle).
**Satisfies:** NFR-QA-01/04, NFR-OBS-02, design §2.
**Gate:** app boots; `tsc --noEmit`, lint, and an example test pass in CI; `/healthz` returns 200; the empty app shell renders with brand styling in light/dark.

### Phase 1 — Auth, Roles & App Shell
**Scope:** Clerk integration (email/password, sessions, TOTP MFA required for super_admin); `middleware.ts` route protection; role-group layouts `(admin)`/`(portal)` with redirects; `lib/auth` (currentUser, requireRole); local `users` table + Clerk webhook sync; tenant-scope + RBAC scaffolding; audit-log table + service; sign-in and role-based home pages.
**Satisfies:** FR-AUTH-01/02/03/04/08/10, FR-ADM-60 (infra), NFR-SEC-01/03/05.
**Gate:** users sign in, MFA works for admin, roles redirect correctly, sessions expire, an audit entry is written on a test mutation; cross-role route access is blocked.

### Phase 2 — Customer & Product Management + Invitations
**Scope:** customers + products schema/services/UI; customer CRUD with status; product catalog inline editing; subscriptions + subscription_lines (admin create, add/remove lines); invitation flow end-to-end (create token, email via Resend, validate, accept → provision Clerk user + local user).
**Satisfies:** FR-ADM-10..13, 20/21, 30..33; FR-AUTH-05/06/07.
**Gate:** admin can create/edit customers and products, build a subscription with line items, send an invite, and a recipient can accept and sign in to the correct org/role; all actions audited; cross-tenant tests pass.

### Phase 3 — Billing (Stripe)
**Scope:** Stripe integration (test mode); sync products/prices; create subscriptions in Stripe on confirm; invoices/payments/payment_methods mirror tables; webhook handler with signature verification + reconciliation; admin Billing views (invoices filter/detail/download, payments); proration preview helper.
**Satisfies:** FR-ADM-40/41/42; FR-POR-32 (infra); supports FR-POR-23.
**Gate:** a seeded subscription produces a Stripe invoice; webhook marks it paid and reconciles local tables; admin billing views show correct, filtered data; payment-method add via SetupIntent stores only last4/brand/expiry.

### Phase 4 — Customer Portal (Self-Service)
**Scope:** portal dashboard (KPIs, announcements, tasks); Services/Launchpad grid; subscription self-service (add/remove products, change cycle with proration preview, checkout); billing views (invoices, payments, payment methods); renewal workflow; documents repository (S3 upload + signed download).
**Satisfies:** FR-POR-01..04, 10/11, 20..23, 30..32, 40/41, 60.
**Gate:** a customer_admin can view their subscription, change it with an accurate proration preview, confirm via Stripe, view invoices/payments, confirm a renewal, and download a document — all scoped to their org; customer_user is read-only.

### Phase 5 — Support & Notifications + Success Center
**Scope:** tickets + ticket_messages (list, create, detail thread, status, close/reopen); notifications table + in-app list + email triggers; Success Center (onboarding checklist, CSM card, resource links); MFA polish.
**Satisfies:** FR-POR-50..52, 61; FR-NOT-01..03.
**Gate:** full ticket lifecycle works with role/tenant scoping; notifications appear in-app and via email for key events; success center renders org-specific data.

### Phase 6 — Analytics & Audit
**Scope:** admin dashboard KPIs + 12-month revenue chart + activity feed; reports (revenue by product, revenue by customer, churn risk, renewals calendar); MRR/ARR compute + nightly cron; audit log viewer with filters (read-only, immutable).
**Satisfies:** FR-ADM-01/02/03, 50..53, 61; FR-ADM-62 verified.
**Gate:** dashboard shows correct MRR/ARR/active counts against seed data; reports match underlying data; churn rules flag the right customers; audit viewer is filterable and offers no edit/delete path.

### Phase 7 — Product Micro-sites
**Scope:** `/portal/apps/[slug]` for all 8 products; branded header + status badge, product metric tiles, quick actions, activity feed; subscription gating (locked/upsell state when not subscribed).
**Satisfies:** FR-APP-01/02/03.
**Gate:** each product page renders for subscribed orgs; unsubscribed orgs see the locked state; launch/docs/support actions work.

### Phase 8 — Hardening & Launch
**Scope:** security review (rate limiting, CSRF, CSP/headers, RLS verification); accessibility pass (Lighthouse ≥90 on key pages); full E2E suite (Playwright); seed finalization; staging validation; production deploy + smoke tests; runbook.
**Satisfies:** all NFR-SEC-*, NFR-UX-01, NFR-QA-02/03, acceptance criteria §10.
**Gate:** all PRD acceptance criteria (§10) satisfied; security and cross-tenant tests pass; Lighthouse ≥90; staging UAT sign-off; production smoke tests green.

---

## 3. Definition of Done (per feature)
- Requirement IDs implemented and demoable.
- Schema + migration committed and applies cleanly.
- Service + API/action enforce role and tenant; mutation writes an audit entry.
- Unit + (where relevant) integration tests pass, including cross-tenant denial.
- UI handles loading/empty/error/success states and matches the design spec.
- `tsc --noEmit`, lint, and the suite are green.

## 4. Phase Gate Checklist (copy per phase)
```
[ ] All phase requirement IDs implemented
[ ] Migrations apply cleanly to a fresh DB
[ ] Tenant + role enforcement verified by tests
[ ] Audit entries written for all mutations
[ ] Unit/integration/E2E for the phase pass
[ ] tsc --noEmit clean; lint clean
[ ] Design spec matched (states, responsive, brand)
[ ] CLAUDE.md updated with new patterns
[ ] Demo walkthrough recorded/notes added
```

## 5. Sequencing Notes
- Phases are mostly sequential; Phase 3 (Stripe) must precede Phase 4 portal billing/self-service.
- Reports (Phase 6) depend on real subscription/invoice data from Phases 2–4.
- Micro-sites (Phase 7) depend on subscription data (Phase 2) for gating.
- Keep Stripe in **test mode** until Phase 8; production keys are a deploy-time swap.

---

*End of Workflow — CustomerPortal365.*
