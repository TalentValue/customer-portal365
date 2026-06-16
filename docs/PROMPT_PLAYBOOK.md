# Claude Code Prompt Playbook
## CustomerPortal365

| | |
|---|---|
| **Version** | 1.0 |
| **Last updated** | 2026-06-16 |
| **Use with** | [PRD.md](./PRD.md) · [TDD.md](./TDD.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [WORKFLOW.md](./WORKFLOW.md) · [adr/](./adr/) |

> Copy each prompt block into Claude Code in order. Each phase prompt assumes the docs are in the repo under `docs/` and that the previous phase's gate (see WORKFLOW.md) has passed. Run one phase per session/conversation; verify the gate before moving on.

---

## 0. Kickoff prompt (run once)

```
You are building CustomerPortal365, a multi-tenant B2B SaaS platform.

Authoritative specs live in ./docs:
- docs/PRD.md           — product requirements (requirement IDs are binding)
- docs/TDD.md           — technical design, stack, data model, API, security
- docs/DESIGN_SYSTEM.md  — UI/UX, brand tokens, page-by-page specs
- docs/WORKFLOW.md       — phase plan and exit gates
- docs/adr/*            — architecture decisions and rationale

Read all of these before writing code. Then create docs/../CLAUDE.md if it
doesn't exist (use docs/CLAUDE.md as the source) summarizing the stack,
conventions, and guardrails.

Rules you must follow on every task:
1. Build vertical slices: schema -> service -> API/action -> UI -> tests.
2. All customer-scoped data access goes through the tenant-scope wrapper;
   derive customer_id from the session, never from client input.
3. Every mutation writes an immutable audit-log entry.
4. Enforce RBAC in the service/route layer, not just the UI.
5. Validate all inputs with Zod. Money is integer cents. IDs are UUID.
6. Keep tsc --noEmit, ESLint, and tests green before finishing a task.
7. Reference requirement IDs (e.g. FR-ADM-10) in commits.

Confirm you've read the specs and outline the Phase 0 plan before coding.
```

---

## Phase 0 — Foundation

```
Implement Phase 0 from docs/WORKFLOW.md.

Set up the Next.js 15 App Router project (TypeScript strict) exactly per
docs/TDD.md §3 structure. Include:
- Tailwind v4 with the brand tokens from docs/DESIGN_SYSTEM.md §1.2 (light/dark
  via class strategy), DM Sans via next/font.
- shadcn/ui initialized; add the base components we'll reuse (button, input,
  card, table, dialog, dropdown-menu, badge, tabs, toast, form).
- Drizzle ORM + Postgres client and drizzle.config.ts; empty schema file.
- ESLint, Prettier, Husky pre-commit (typecheck + lint + test).
- The app shell: collapsible sidebar + top header per DESIGN_SYSTEM §2, with
  the responsive behavior and dark-mode toggle. Use placeholder nav for now.
- GET /healthz route handler returning app+DB status.
- .env.example with every var from TDD §10.2.
- A CI workflow: install -> typecheck -> lint -> test -> build.
- One example unit test so the suite runs.

Gate: app boots, /healthz returns 200, tsc/lint/test pass, shell renders in
light and dark. Do not implement features yet.
```

---

## Phase 1 — Auth, Roles & App Shell

```
Implement Phase 1 from docs/WORKFLOW.md (FR-AUTH-01/02/03/04/08/10, NFR-SEC).

- Integrate Clerk (email/password, sessions, TOTP MFA). Require MFA for
  super_admin. Add middleware.ts protecting all non-public routes.
- Build lib/auth: currentUser(), requireRole(), the AuthContext type from
  TDD §4.
- Create the users table (with clerk_user_id, role, customer_id) and a Clerk
  webhook that syncs users.
- Implement role-group layouts (admin)/(portal) with redirects per the access
  matrix in PRD §3.1.
- Scaffold lib/tenancy/tenant-scope.ts and lib/rbac per TDD §4.
- Create audit_logs table + lib/services/audit with an append-only write API,
  and the migration step that REVOKEs UPDATE/DELETE on audit_logs.
- Build the sign-in experience and role-based home pages (empty dashboards).
- Add rate limiting on auth endpoints.

Tests: role redirects, MFA path, session expiry, audit write on a sample
mutation, and a cross-role access-denied test.
Gate per WORKFLOW.md Phase 1.
```

---

## Phase 2 — Customer & Product Management + Invitations

```
Implement Phase 2 from docs/WORKFLOW.md
(FR-ADM-10..13, 20/21, 30..33; FR-AUTH-05/06/07).

- Schema + services for customers, products, subscriptions, subscription_lines
  per TDD §5. All customer-scoped access via tenant-scope; all mutations audited.
- Admin UI per DESIGN_SYSTEM §4.2: customers list + detail (tabs), product
  catalog with inline editing, subscriptions list + detail with add/remove
  line items.
- Invitation flow end to end: POST /customers/:id/invite creates a token
  (72h), emails it via Resend; /invite/:token validates; accept provisions a
  Clerk user + local users row bound to the org and role.
- Zod schemas for every form; loading/empty/error states per DESIGN_SYSTEM §3.1.

Tests: customer/product/subscription CRUD, line-item add/remove, full
invitation accept flow, and cross-tenant denial (org A cannot see org B).
Gate per WORKFLOW.md Phase 2.
```

---

## Phase 3 — Billing (Stripe)

```
Implement Phase 3 from docs/WORKFLOW.md (FR-ADM-40/41/42; supports FR-POR-23/32).

- Integrate Stripe in test mode per ADR 0003 and TDD §8. Sync products/prices.
- Create/update Stripe subscriptions; mirror invoices, payments,
  payment_methods locally.
- Webhook handler at /api/webhooks/stripe with signature verification and
  idempotent reconciliation (invoice.paid, payment_failed,
  subscription.updated, etc.).
- Proration preview helper used before any subscription change is confirmed.
- Admin Billing UI per DESIGN_SYSTEM §4.2: invoices (filter by customer/status/
  date, detail drawer, download), payments history.
- Payment-method add via SetupIntent; store only last4/brand/expiry.

Tests: subscription -> invoice creation, webhook reconciliation marks paid,
filtered billing queries, no PAN stored.
Gate per WORKFLOW.md Phase 3.
```

---

## Phase 4 — Customer Portal (Self-Service)

```
Implement Phase 4 from docs/WORKFLOW.md
(FR-POR-01..04, 10/11, 20..23, 30..32, 40/41, 60).

- Portal dashboard (KPIs, announcements feed, upcoming tasks).
- Services/Launchpad product grid linking to micro-site routes.
- Subscription self-service: add/remove products, change cycle with an accurate
  Stripe proration preview shown before confirm, then checkout.
- Billing views (invoices, payments, payment methods) scoped to the org.
- Renewal workflow: confirm renewal -> status update + notify super_admin.
- Documents repository: S3 upload + signed-URL download.
- customer_user is strictly read-only; customer_admin can mutate within the org.

Tests: scoped reads, proration accuracy, renewal confirm, document
upload/download, customer_user write-denied.
Gate per WORKFLOW.md Phase 4.
```

---

## Phase 5 — Support & Notifications + Success Center

```
Implement Phase 5 from docs/WORKFLOW.md (FR-POR-50..52, 61; FR-NOT-01..03).

- tickets + ticket_messages: list with priority badges, create, detail thread,
  status updates, close/reopen. Role/tenant scoped.
- notifications table + in-app unread list + mark-read; email triggers for
  invite sent, subscription change, renewal due, invoice due/overdue, ticket
  reply, announcement.
- Success Center: onboarding checklist with completion %, CSM contact card,
  resource/KB links.

Tests: full ticket lifecycle scoped by role/tenant; notification creation and
read; email trigger fires on events.
Gate per WORKFLOW.md Phase 5.
```

---

## Phase 6 — Analytics & Audit

```
Implement Phase 6 from docs/WORKFLOW.md (FR-ADM-01/02/03, 50..53, 61, 62).

- Admin dashboard: KPI tiles (MRR, ARR, active customers, active subscriptions),
  12-month revenue chart (Recharts, brand palette), recent activity feed.
- MRR/ARR compute per TDD §5.4 + nightly cron recompute.
- Reports: revenue by product (stacked bar + table), revenue by customer,
  churn risk (overdue + contract <60d + usage signals), renewals calendar.
- Audit log viewer: filter by actor/action/resource/date; read-only, with NO
  edit or delete affordance anywhere (verify FR-ADM-62).

Tests: MRR/ARR math against seed data, churn rule flags, report totals match
source, audit viewer exposes no mutation path.
Gate per WORKFLOW.md Phase 6.
```

---

## Phase 7 — Product Micro-sites

```
Implement Phase 7 from docs/WORKFLOW.md (FR-APP-01/02/03).

- /portal/apps/[slug] for all 8 products (Workplace365, TalentValue365,
  BackgroundCheck365, RepoReceptionist365, RepoWeb365, Finance365,
  SkipTrace365, FeeManagement365).
- Each: branded header + status badge, product-specific metric tiles, quick
  actions (Launch App, View Documentation, Contact Support), activity feed.
- Subscription gating: subscribed orgs see the dashboard; others see a
  locked/upsell state.

Tests: page renders per subscription state; gating denies unsubscribed orgs.
Gate per WORKFLOW.md Phase 7.
```

---

## Phase 8 — Hardening & Launch

```
Implement Phase 8 from docs/WORKFLOW.md (all NFR-SEC, NFR-UX-01, NFR-QA, PRD §10).

- Security: verify rate limiting, CSRF, CSP + security headers, and Postgres
  RLS policies on every customer-scoped table; add automated cross-tenant tests
  across all resources.
- Accessibility: pass to reach Lighthouse >=90 on sign-in, both dashboards,
  customer detail, and a portal billing page.
- Full Playwright E2E: login, create customer, add subscription, open ticket,
  accept invite, renewal confirm.
- Finalize idempotent seed (1 super_admin, 2-3 customers, full catalog, sample
  subscriptions/invoices/tickets).
- Staging validation; production deploy with key swap (Stripe live, Clerk prod);
  smoke tests on /healthz and core flows. Write a deploy runbook.

Gate: every PRD §10 acceptance criterion satisfied; security + cross-tenant
tests pass; Lighthouse >=90; staging UAT sign-off; production smoke green.
```

---

## Tips for driving Claude Code well
- Keep one phase per conversation; long contexts drift.
- After each phase, ask Claude to run the **Phase Gate Checklist** (WORKFLOW.md §4) and report results before you accept.
- If Claude proposes deviating from an ADR, make it write a new ADR documenting the change before proceeding.
- When a bug spans phases, point Claude at the specific requirement ID and TDD section rather than re-describing the feature.
- Periodically ask Claude to update `CLAUDE.md` so conventions persist across sessions.

---

*End of Prompt Playbook — CustomerPortal365.*
