# Technical Design Document (TDD)
## CustomerPortal365

| | |
|---|---|
| **Product** | CustomerPortal365 |
| **Version** | 1.0 (Claude Code build spec) |
| **Last updated** | 2026-06-16 |
| **Companion to** | [PRD.md](./PRD.md) |
| **Decisions recorded in** | [adr/](./adr/) |

> **Scope note.** The PRD defines *what* and *why*. This TDD defines *how*. It deliberately departs from the original Scope of Work's stack (Vite SPA + Express + express-session) in favor of a modern, managed-service-first architecture that reduces hand-built infrastructure, ships production-grade auth and billing faster, and is easy for an AI coding agent to build incrementally. Rationale for each major choice lives in the linked ADRs.

---

## 1. Architecture Overview

CustomerPortal365 is a **single Next.js application** (App Router) that serves the admin console, the customer portal, and the API surface (route handlers + server actions) from one deployable. It talks to a managed Postgres database via Drizzle ORM, delegates identity to Clerk, and delegates billing to Stripe.

```
                         ┌─────────────────────────────────────────────┐
                         │                Browser (SPA-like)            │
                         │   React Server + Client Components (Next.js) │
                         └───────────────┬─────────────────────────────┘
                                         │ HTTPS
              ┌──────────────────────────▼──────────────────────────────┐
              │                 Next.js App (Node runtime)               │
              │                                                          │
              │  app/(admin)/*      app/(portal)/*     app/api/*         │
              │  ─────────────      ───────────────    ─────────         │
              │  RSC pages          RSC pages          route handlers    │
              │  server actions     server actions     (webhooks, REST)  │
              │                                                          │
              │  ┌────────────────────────────────────────────────────┐ │
              │  │  Application layer (services)                        │ │
              │  │   auth-guard · rbac · tenant-scope · audit · billing │ │
              │  └───────────────┬──────────────────────┬─────────────┘ │
              │                  │ Drizzle              │ SDK            │
              └──────────────────┼──────────────────────┼───────────────┘
                                 │                       │
                   ┌─────────────▼───────┐   ┌───────────▼─────────┐
                   │  PostgreSQL (Neon)  │   │  Clerk · Stripe ·   │
                   │  Drizzle migrations │   │  Resend · S3        │
                   └─────────────────────┘   └─────────────────────┘
```

### 1.1 Key architectural decisions (summary; see ADRs)

- **One framework, one deploy.** Next.js App Router replaces the separate SPA + Express server. Server Components fetch data directly; mutations go through server actions and a thin REST layer for external/webhook use. ([adr/0001](./adr/0001-framework.md))
- **Managed identity.** Clerk provides email/password, TOTP MFA, sessions, organizations, and invitations — replacing hand-rolled `express-session`+bcrypt+MFA. ([adr/0002](./adr/0002-auth-provider.md))
- **Managed billing.** Stripe Billing models products, prices, subscriptions, invoices, and proration. Local tables mirror Stripe for fast reads and reporting. ([adr/0003](./adr/0003-billing.md))
- **Type-safe data.** Drizzle ORM + Postgres, migrations via drizzle-kit. ([adr/0004](./adr/0004-orm.md))
- **Tenant isolation in the data layer.** A mandatory `tenantScope` wrapper injects `customer_id` into every customer-scoped query; Postgres Row-Level Security is enabled as defense-in-depth. ([adr/0005](./adr/0005-multitenancy.md))
- **Consistent API envelope.** All responses use a single success/error shape.

---

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict) | `noUncheckedIndexedAccess`, project-wide strict |
| Framework | Next.js 15 (App Router) | RSC, server actions, route handlers |
| Runtime | Node.js 20 LTS | Node runtime (not edge) for DB + SDKs |
| UI | React 19 + shadcn/ui + Radix | Accessible headless primitives |
| Styling | Tailwind CSS v4 | `@theme` tokens for brand |
| Icons | Lucide React | |
| Charts | Recharts | KPIs, revenue charts |
| Client data | TanStack Query | For interactive client islands; RSC for the rest |
| Forms & validation | React Hook Form + Zod | Zod schemas shared client/server |
| ORM / DB | Drizzle ORM + PostgreSQL 16 | Neon (serverless) or any managed PG |
| Auth | Clerk | Email/pw, TOTP MFA, orgs, invitations, sessions |
| Billing | Stripe (Billing + Webhooks) | Subscriptions, invoices, payment methods |
| Email | Resend + React Email | Invites, notifications, password reset |
| File storage | S3-compatible (AWS S3 / R2) | Document repository |
| Background jobs | Vercel Cron / scheduled route handlers | Renewal reminders, churn recompute |
| Testing | Vitest, Testing Library, Playwright | Unit, component, E2E |
| Tooling | ESLint, Prettier, TypeScript, Husky | Pre-commit gates |
| Package manager | pnpm | |
| Deploy | Vercel (recommended) or Docker on Node host | Env-configured |

> If a fully self-hosted, no-third-party path is later required, [adr/0002](./adr/0002-auth-provider.md) and [adr/0003](./adr/0003-billing.md) document the swap to BetterAuth + mock/self-hosted billing. The application layer is written against internal interfaces so providers are replaceable.

---

## 3. Project Structure

```
customerportal365/
├─ app/
│  ├─ (marketing)/                 # public: login entry, invite landing
│  │  ├─ sign-in/
│  │  └─ invite/[token]/
│  ├─ (admin)/admin/               # super_admin only (layout guards role)
│  │  ├─ dashboard/
│  │  ├─ customers/[id]/
│  │  ├─ subscriptions/[id]/
│  │  ├─ products/
│  │  ├─ billing/
│  │  ├─ reports/
│  │  └─ audit/
│  ├─ (portal)/portal/             # customer_admin / customer_user
│  │  ├─ dashboard/
│  │  ├─ services/
│  │  ├─ subscriptions/
│  │  ├─ billing/
│  │  ├─ renewals/
│  │  ├─ tickets/[id]/
│  │  ├─ documents/
│  │  ├─ success/
│  │  └─ apps/[slug]/              # product micro-sites
│  └─ api/
│     ├─ webhooks/stripe/route.ts
│     ├─ webhooks/clerk/route.ts
│     ├─ cron/[job]/route.ts
│     └─ v1/                        # REST surface (see §6)
├─ lib/
│  ├─ db/
│  │  ├─ schema.ts                  # Drizzle schema (§5)
│  │  ├─ index.ts                   # db client
│  │  └─ migrations/                # drizzle-kit output (committed)
│  ├─ auth/                         # Clerk helpers, requireRole, currentUser
│  ├─ tenancy/tenant-scope.ts       # mandatory query scoper (§4)
│  ├─ rbac/                         # permission definitions + guards
│  ├─ services/                     # customers, subscriptions, billing, tickets, audit, notifications
│  ├─ billing/stripe.ts             # Stripe client + sync helpers
│  ├─ email/                        # Resend + React Email templates
│  ├─ validation/                   # Zod schemas (shared)
│  └─ api/envelope.ts               # success()/error() helpers
├─ components/                      # shadcn/ui + app components
├─ tests/
│  ├─ unit/  integration/  e2e/
├─ scripts/seed.ts                  # idempotent seed
├─ drizzle.config.ts
├─ middleware.ts                    # Clerk + route protection
├─ CLAUDE.md                        # agent build guide
└─ docs/                            # this doc set
```

---

## 4. Multi-Tenancy & Authorization

Tenancy is the highest-risk area. It is enforced at **three** layers:

1. **Routing/middleware.** `middleware.ts` (Clerk) authenticates every non-public route and attaches the session. Route-group layouts (`(admin)`, `(portal)`) assert role and redirect mismatches.
2. **Data-access layer (primary control).** Every customer-scoped query goes through `tenantScope(ctx)`, which derives `customer_id` from the authenticated session — never from client input — and applies it as a mandatory `WHERE customer_id = $ctx.customerId`. Services must use scoped queries; raw cross-tenant access is forbidden by lint rule + code review.
3. **Database (defense-in-depth).** Postgres RLS policies on customer-scoped tables restrict rows to the current tenant via a session GUC set per request.

```ts
// lib/tenancy/tenant-scope.ts (shape)
export type AuthContext = {
  userId: string;
  role: 'super_admin' | 'customer_admin' | 'customer_user';
  customerId: string | null; // null only for super_admin
};

export function assertTenantAccess(ctx: AuthContext, targetCustomerId: string) {
  if (ctx.role === 'super_admin') return;          // can act across tenants (audited)
  if (ctx.customerId !== targetCustomerId) throw new ForbiddenError();
}
```

**RBAC** is a capability map (`role → permissions`). Guards (`requireRole`, `requirePermission`) wrap server actions and route handlers. `customer_user` is read-only in the portal; `customer_admin` can mutate within its org; `super_admin` can do everything (and every mutation is audited with actor + IP).

---

## 5. Data Model

PostgreSQL via Drizzle. IDs are UUID v7 (time-ordered). Money is stored in integer **cents**. JSON columns are `jsonb`. All customer-scoped tables carry `customer_id` and are covered by RLS.

### 5.1 Entity overview

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, email, role, customer_id, clerk_user_id, created_at | role enum; `customer_id` null for super_admin |
| `customers` | id, name, industry, status, billing_address (jsonb), mrr_cents, arr_cents, contract_start, contract_end, stripe_customer_id | status: active/suspended/churned |
| `products` | id, name, slug, description, monthly_price_cents, annual_price_cents, features (jsonb), is_active, stripe_product_id | features = string[] |
| `subscriptions` | id, customer_id, status, billing_cycle, start_date, end_date, stripe_subscription_id | status: active/pending/cancelled/expired |
| `subscription_lines` | id, subscription_id, product_id, quantity, unit_price_cents, licensed_users, setup_fee_cents | one row per product |
| `invoices` | id, customer_id, subscription_id, status, amount_cents, due_date, paid_at, line_items (jsonb), stripe_invoice_id | status: draft/pending/paid/overdue |
| `payments` | id, customer_id, invoice_id, amount_cents, reference, paid_at | reference = gateway TX id |
| `payment_methods` | id, customer_id, type, last4, brand, expiry_month, expiry_year, is_default, stripe_payment_method_id | type: credit_card/ach |
| `tickets` | id, customer_id, user_id, subject, category, priority, status, created_at | priority low/medium/high/critical |
| `ticket_messages` | id, ticket_id, author_id, body, created_at | thread for FR-POR-52 |
| `documents` | id, customer_id, name, type, storage_key, uploaded_at | storage_key → S3 |
| `notifications` | id, user_id, customer_id, message, read, created_at | user- or org-scoped |
| `invitations` | id, customer_id, email, token (uuid), role, expires_at, accepted_at | 72h expiry |
| `audit_logs` | id, actor_id, actor_email, action, resource_type, resource_id, ip, metadata (jsonb), created_at | append-only, immutable |
| `announcements` | id, title, body, published_at, audience | for FR-POR-03 |

### 5.2 Relationships

- `customers 1—* users`, `customers 1—* subscriptions`, `customers 1—* invoices`, `customers 1—* tickets`, `customers 1—* documents`, `customers 1—* payment_methods`, `customers 1—* invitations`.
- `subscriptions 1—* subscription_lines`; `subscription_lines *—1 products`.
- `invoices 1—* payments`; `invoices *—1 subscriptions`.
- `tickets 1—* ticket_messages`.

### 5.3 Drizzle schema (illustrative excerpt)

```ts
// lib/db/schema.ts
import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['super_admin', 'customer_admin', 'customer_user']);
export const customerStatus = pgEnum('customer_status', ['active', 'suspended', 'churned']);

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'),
  status: customerStatus('status').notNull().default('active'),
  billingAddress: jsonb('billing_address').$type<BillingAddress>(),
  mrrCents: integer('mrr_cents').notNull().default(0),
  arrCents: integer('arr_cents').notNull().default(0),
  contractStart: timestamp('contract_start', { withTimezone: true }),
  contractEnd: timestamp('contract_end', { withTimezone: true }),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id'),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),            // created | updated | deleted | ...
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  ip: text('ip'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// audit_logs: REVOKE UPDATE, DELETE from app role (migration §10.3)
```

### 5.4 Derived metrics

- **MRR** = sum over active subscription lines of normalized monthly value (annual line ÷ 12) × quantity. Stored on `customers.mrr_cents` and recomputed on subscription change + nightly cron.
- **ARR** = MRR × 12.
- **Churn risk** = rule engine flagging overdue invoices, contract end within 60 days, and (future) usage decline signals.

---

## 6. API Design

Two surfaces, one set of services:

- **Server actions** for in-app mutations invoked from RSC/forms (type-safe, no manual fetch).
- **REST under `/api/v1`** for webhooks, health, and any external/automation use. All `/api/v1` mutations require auth and enforce role + tenant.

### 6.1 Response envelope

```jsonc
// success
{ "ok": true, "data": { /* ... */ }, "meta": { "page": 1, "total": 120 } }
// error
{ "ok": false, "error": { "code": "FORBIDDEN", "message": "…", "details": [] } }
```
Error codes map to HTTP status: `UNAUTHENTICATED`→401, `FORBIDDEN`→403, `NOT_FOUND`→404, `VALIDATION`→422, `RATE_LIMITED`→429, `CONFLICT`→409, `INTERNAL`→500.

### 6.2 Endpoint catalog

All paths prefixed `/api/v1`. "self" = own organization only.

**Auth & identity** (mostly handled by Clerk; thin wrappers)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/auth/me` | Authenticated | Current user profile, role, customer_id |
| POST | `/auth/logout` | Authenticated | End session |

**Customers**

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/customers` | super_admin | List w/ pagination + search |
| POST | `/customers` | super_admin | Create customer |
| GET | `/customers/:id` | super_admin · self | Customer detail |
| PATCH | `/customers/:id` | super_admin | Update info / status |
| POST | `/customers/:id/invite` | super_admin | Send invitation email |
| GET | `/admin/stats` | super_admin | MRR/ARR/active aggregates |
| GET | `/admin/revenue-chart` | super_admin | Monthly revenue series |

**Subscriptions**

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/subscriptions` | super_admin · customer_admin | List (role-filtered) |
| POST | `/subscriptions` | super_admin | Create |
| GET | `/subscriptions/:id` | super_admin · self | Detail w/ line items |
| PATCH | `/subscriptions/:id` | super_admin | Update status / billing cycle |
| POST | `/subscriptions/:id/lines` | super_admin | Add line item |
| DELETE | `/subscriptions/:id/lines/:lineId` | super_admin | Remove line item |
| POST | `/subscriptions/:id/checkout` | customer_admin | Confirm changes (Stripe) |
| POST | `/subscriptions/:id/renew` | super_admin · customer_admin | Trigger renewal |

**Billing**

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/invoices` | super_admin · customer_admin | List (role-filtered) |
| GET | `/invoices/:id` | super_admin · self | Detail w/ line items |
| GET | `/payments` | super_admin · customer_admin | Transaction history |
| GET | `/payment-methods` | customer_admin | List org payment methods |
| POST | `/payment-methods` | customer_admin | Add card/ACH (Stripe SetupIntent) |

**Support**

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/tickets` | super_admin · customer_admin | List (role-filtered) |
| POST | `/tickets` | customer_admin | Open ticket |
| GET | `/tickets/:id` | super_admin · self | Detail w/ thread |
| PATCH | `/tickets/:id` | super_admin · customer_admin | Update status / add reply |

**Dashboards, reports, misc**

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | customer_admin | Portal KPIs |
| GET | `/dashboard/activity` | customer_admin | Recent activity feed |
| GET | `/reports/spend` | customer_admin | Org spend by product |
| GET | `/reports/admin` | super_admin | Revenue by product & customer |
| GET | `/reports/renewals` | super_admin | Renewals + churn risk |
| GET | `/notifications` | Authenticated | Unread notifications |
| POST | `/notifications/:id/read` | Authenticated | Mark read |
| GET | `/documents` | customer_admin | Org documents |
| GET | `/invitations/:token` | Public | Validate token |
| POST | `/invitations/:token/accept` | Public | Accept & provision user |
| GET | `/healthz` | Public | Health check (app + DB) |

**Webhooks** (no `/v1` prefix): `POST /api/webhooks/stripe`, `POST /api/webhooks/clerk` — signature-verified; reconcile local mirror tables.

---

## 7. Authentication, Authorization & Onboarding

### 7.1 Sign-in & MFA
Clerk handles email/password and TOTP MFA. The app requires MFA for `super_admin`. After sign-in, `middleware.ts` attaches the session; the role-group layout redirects to `/admin` or `/portal`. A Clerk webhook keeps the local `users` row in sync (`clerk_user_id` ↔ `users.id`).

### 7.2 Invitation flow (FR-AUTH-05/06/07)
1. Super admin calls `POST /customers/:id/invite`.
2. Service creates an `invitations` row (UUID token, role, 72h expiry) and sends an email (Resend) with `/invite/:token`.
3. Invitee opens link → `GET /invitations/:token` validates (exists, not expired, not accepted).
4. `POST /invitations/:token/accept` provisions a Clerk user, creates the local `users` row bound to `customer_id` + role, marks the invite accepted. All steps audited.

### 7.3 Authorization
Capability map + guards (§4). Every mutation passes through a service that (a) checks permission, (b) asserts tenant access, (c) performs the change, (d) writes an audit entry — in one transaction where possible.

---

## 8. Billing Design (Stripe)

- Local `products`/`subscriptions`/`invoices`/`payments`/`payment_methods` mirror Stripe for fast reads, reporting, and offline correctness; Stripe is the source of truth for money movement.
- Product/price changes sync local↔Stripe.
- Customer subscription changes (add/remove product, change cycle) compute a **proration preview** via Stripe before the customer confirms (FR-POR-23), then create/update the Stripe subscription on confirm (`/checkout`).
- Adding a payment method uses a Stripe SetupIntent; only `last4`/`brand`/expiry are stored locally — never full PANs.
- Stripe webhooks (`invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, etc.) reconcile local tables and emit notifications + audit entries.
- **Phasing:** per [adr/0003](./adr/0003-billing.md), early phases may run Stripe in test mode with seeded fixtures; the same code path serves production by swapping keys. No separate "mock" implementation to throw away.

---

## 9. Security Design

| Area | Control |
|---|---|
| Transport | HTTPS/TLS 1.2+, HSTS |
| Headers | CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors via Next config |
| AuthN | Clerk sessions (HTTP-only, signed); MFA (TOTP) |
| AuthZ | RBAC guards + tenant scoping at data layer + Postgres RLS |
| CSRF | Server actions are origin-checked; REST mutations require CSRF token / same-site cookies |
| Rate limiting | Auth + sensitive mutations limited per IP + per account (Upstash/Redis or in-DB) |
| Input validation | Zod on every action/route body; reject unknown fields |
| Secrets | Env vars only; never committed; rotated via host secret manager |
| Audit | Append-only `audit_logs`; UPDATE/DELETE revoked from app DB role |
| PII | Documents in private S3 buckets with signed URLs; least-privilege |
| Dependencies | `pnpm audit` + Dependabot in CI |

---

## 10. Infrastructure, Environments & Migrations

### 10.1 Environments

| Env | Purpose | Notes |
|---|---|---|
| Development | Local dev | Next dev server, local/Neon-branch Postgres, Stripe test mode |
| Staging | Pre-prod | Mirrors prod config; seeded test data |
| Production | Live | Hardened, TLS, managed Postgres, Stripe live |

### 10.2 Environment variables

```
DATABASE_URL=                 # Postgres connection
DIRECT_URL=                   # (migrations, if pooled)
CLERK_SECRET_KEY=             # auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=               # email
S3_BUCKET= S3_REGION= S3_ACCESS_KEY_ID= S3_SECRET_ACCESS_KEY=
REDIS_URL=                    # rate limiting / cache (optional)
APP_URL=                      # base URL for links/emails
NODE_ENV=
```

### 10.3 Migrations & seed
- drizzle-kit generates SQL migrations; files are committed.
- A post-migration SQL step revokes `UPDATE, DELETE` on `audit_logs` from the application role and enables RLS policies.
- Migrations run in the deploy pipeline (not auto on boot).
- `scripts/seed.ts` is idempotent: 1 super_admin, 2–3 customers, full product catalog, sample subscriptions/invoices/tickets.

### 10.4 CI/CD
Pipeline: install → typecheck (`tsc --noEmit`) → lint → unit + integration tests → build → (on main) apply migrations → deploy → smoke test (`/healthz`). E2E (Playwright) runs against staging.

---

## 11. Testing Strategy (summary; see PRD NFR-QA)

- **Unit (Vitest):** services, RBAC guards, tenant-scope, billing math (MRR/ARR/proration), Zod schemas. ≥80% on `lib/` and route handlers.
- **Integration:** API flows against a real test Postgres — auth lifecycle, subscription CRUD, invoice/payment reconciliation, ticket workflow, invitation acceptance, **cross-tenant denial tests**.
- **Component (Testing Library):** forms, tables, dialogs.
- **E2E (Playwright):** login→dashboard, create customer, add subscription, open ticket, accept invite, renewal confirm.
- **Non-functional:** Lighthouse accessibility ≥90 on key pages; `pnpm audit` in CI.

---

## 12. Observability & Ops

- Structured JSON logs with request IDs; no PII in logs.
- `/healthz` checks app + DB connectivity.
- Error tracking (Sentry-compatible) wired via env.
- Cron route handlers: nightly MRR/ARR recompute, churn recompute, renewal reminders, overdue-invoice notifications.

---

## 13. Mapping to PRD Requirements

| PRD area | Implemented by |
|---|---|
| FR-AUTH-* | §7 (Clerk, invitations), middleware, `lib/auth` |
| FR-ADM-* | `(admin)` route group, services, `/api/v1` admin endpoints, audit |
| FR-POR-* | `(portal)` route group, dashboard/billing/tickets services |
| FR-APP-* | `(portal)/apps/[slug]` micro-sites, subscription gating |
| FR-NOT-* | `notifications` service + table, email/in-app |
| NFR-SEC-* | §4, §9, RLS migration §10.3 |
| NFR-QA-* | §11, CI §10.4 |

---

*End of TDD — CustomerPortal365. © 2026 BusinessValue365. Confidential.*
