# Product Requirements Document (PRD)
## CustomerPortal365 — One Portal. Every Service. Complete Visibility.

| | |
|---|---|
| **Product** | CustomerPortal365 |
| **Owner** | BusinessValue365 |
| **Version** | 1.0 (Claude Code build spec) |
| **Status** | Approved for build |
| **Last updated** | 2026-06-16 |
| **Related docs** | [TDD.md](./TDD.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [WORKFLOW.md](./WORKFLOW.md) · [PROMPT_PLAYBOOK.md](./PROMPT_PLAYBOOK.md) · [adr/](./adr/) |

> **How to read this document.** The PRD defines *what* we are building and *why*. It is product-truth: when the TDD and the PRD disagree on a behavior, the PRD wins; when they disagree on an implementation mechanism, the TDD wins. Every requirement has a stable ID (e.g. `FR-ADM-01`) so it can be referenced from tests, commits, and prompts.

---

## 1. Executive Summary

CustomerPortal365 is a multi-tenant B2B SaaS platform that lets BusinessValue365 manage its entire customer lifecycle — customers, products, subscriptions, billing, support, and analytics — from a single application. It serves two audiences through one codebase:

- **Internal staff (Super Admins)** manage customers, products, subscriptions, billing, and investor-grade analytics from an admin console.
- **Customer organizations** view their subscribed products, manage subscriptions and billing, raise support tickets, complete renewals, and access documents through a self-service portal.

The product's central promise is *complete visibility*: a customer always knows what they pay for, what's due, and what's next; BusinessValue365 always knows revenue, churn risk, and account health. A complete, immutable audit trail underpins compliance and accountability.

This PRD specifies the production scope. It is paired with a TDD that selects a modern, managed-service-first stack (Next.js, Postgres + Drizzle, Clerk auth with MFA, Stripe billing) instead of building undifferentiated infrastructure by hand.

---

## 2. Problem Statement & Goals

### 2.1 Problem

BusinessValue365 sells eight products but has no unified system to onboard customers, track what they own, bill them, support them, or measure revenue health. Customer-facing work is manual and opaque; internal reporting is reconstructed by hand. There is no single source of truth for the customer lifecycle and no audit trail.

### 2.2 Business objectives

| ID | Objective |
|---|---|
| OBJ-1 | Consolidate customer management, billing, support, and product delivery into one portal. |
| OBJ-2 | Provide customer self-service to reduce vendor support load. |
| OBJ-3 | Produce investor-ready dashboards: MRR, ARR, churn risk, revenue by product/customer. |
| OBJ-4 | Enable frictionless, secure onboarding via email invitation tokens. |
| OBJ-5 | Maintain a complete, immutable audit trail for compliance and accountability. |

### 2.3 Success metrics (targets, measurable post-launch)

| ID | Metric | Target |
|---|---|---|
| KPI-1 | Support tickets deflected via self-service | ≥ 30% within 2 quarters |
| KPI-2 | Customer onboarding time (invite → first login) | < 10 minutes median |
| KPI-3 | Admin dashboard data freshness | ≤ 60s from source event |
| KPI-4 | Renewal confirmation completed in-portal | ≥ 60% of eligible renewals |
| KPI-5 | Audit coverage of mutating admin actions | 100% |
| KPI-6 | Lighthouse accessibility score (key pages) | ≥ 90 |

---

## 3. Personas & Roles

| Persona | Role code | Primary need |
|---|---|---|
| BusinessValue365 Staff | `super_admin` | Manage all customers, products, revenue, and reports |
| Customer Company Admin | `customer_admin` | Manage their org's subscriptions, invoices, and tickets |
| Customer End User | `customer_user` | Access subscribed applications via the launchpad |

### 3.1 Access matrix

| Capability area | `super_admin` | `customer_admin` | `customer_user` |
|---|---|---|---|
| Admin console (`/admin/*`) | Full | Denied → redirect to portal | Denied |
| Customer portal (`/portal/*`) | Read (impersonation/support view) | Full (own org) | Read-only (own org) |
| Write to billing/subscriptions | All orgs | Own org only | None |
| Raise/respond to tickets | Respond to all | Own org | None (read own org tickets) |
| Reports & audit logs | Full | Own-org spend report only | None |

**Tenancy rule (non-negotiable):** every customer-scoped read and write is filtered by the caller's `customer_id`. A `customer_admin`/`customer_user` can never read or affect another organization's data. This is enforced server-side in the data-access layer, not only in the UI. See `NFR-SEC-*` and TDD §"Multi-tenancy".

---

## 4. Product Scope Overview

The product is delivered as three experiences in one application:

1. **Super Admin Console** (`/admin`) — internal operations and analytics.
2. **Customer Portal** (`/portal`) — customer self-service.
3. **Product Suite Micro-sites** (`/portal/apps/:slug`) — per-product informational dashboards for the eight 365 products.

The eight products in scope (informational micro-sites only; their backends are external and out of scope):

| Product | Description |
|---|---|
| Workplace365 | Workforce management and HR operations hub |
| TalentValue365 | Talent acquisition and compensation analytics |
| BackgroundCheck365 | Background screening and compliance tracking |
| RepoReceptionist365 | Repossession intake and assignment management |
| RepoWeb365 | Web-based repo case tracking and client portal |
| Finance365 | Financial reporting, budgeting, and AP/AR management |
| SkipTrace365 | Skip tracing workflow and batch processing |
| FeeManagement365 | Fee scheduling, collection, and remittance reporting |

---

## 5. Functional Requirements

Requirement IDs are stable. `M` = MVP/early-phase, `S` = standard, `L` = late-phase. The phase mapping lives in [WORKFLOW.md](./WORKFLOW.md).

### 5.1 Authentication & Onboarding (`FR-AUTH`)

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Users sign in with email + password; a session is established on success. | M |
| FR-AUTH-02 | Multi-factor authentication (TOTP) is supported and can be required for `super_admin`. | M |
| FR-AUTH-03 | Sign-out destroys the session everywhere it is valid. | M |
| FR-AUTH-04 | A current-user endpoint returns identity, role, and `customer_id`. | M |
| FR-AUTH-05 | Super admin can invite a customer's primary contact; system emails a tokenized, time-limited (72h) invite link. | M |
| FR-AUTH-06 | Invitee opens the link, the token is validated, and accepting it provisions the user account bound to the correct organization and role. | M |
| FR-AUTH-07 | Expired/used/invalid tokens are rejected with a clear message and a path to request a new invite. | M |
| FR-AUTH-08 | Failed-login attempts are rate-limited per IP and per account. | M |
| FR-AUTH-09 | Password reset via email is supported. | S |
| FR-AUTH-10 | Role-based redirects: signing in routes each role to its correct home (`super_admin`→`/admin`, customers→`/portal`). | M |

### 5.2 Super Admin Console (`FR-ADM`)

**Dashboard**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-01 | KPI tiles: MRR, ARR, total active customers, total active subscriptions. | M |
| FR-ADM-02 | Revenue chart: MRR trend over trailing 12 months. | S |
| FR-ADM-03 | Recent-activity feed: latest payments, new customers, subscription changes. | S |
| FR-ADM-04 | Quick actions: New Customer, New Subscription. | M |

**Customer management**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-10 | Paginated, searchable customer list with status badges (Active, Suspended, Churned). | M |
| FR-ADM-11 | Create customer: company name, industry, billing address, primary contact email, billing cycle, contract start/end. | M |
| FR-ADM-12 | Customer detail: editable company info, subscription summary, invoice history, ticket list, user list, "Send Invite" action. | M |
| FR-ADM-13 | Suspend / reactivate / mark-churned a customer with reason captured to audit log. | S |

**Product catalog**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-20 | List all products with pricing and feature lists. | M |
| FR-ADM-21 | Edit product: name, description, monthly price, annual price, features (list), active flag. | M |

**Subscription management**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-30 | Global subscription list filterable by status (Active, Pending, Cancelled, Expired). | M |
| FR-ADM-31 | Subscription detail: parent record + line items (product, quantity, unit price, licensed users, setup fee). | M |
| FR-ADM-32 | Add / remove subscription line items. | M |
| FR-ADM-33 | Mark subscription renewed or cancelled; state change is audited and notifies the customer. | S |

**Billing & payments**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-40 | Invoice list filterable by customer, status (Paid, Pending, Overdue, Draft), and date range. | M |
| FR-ADM-41 | Invoice detail: line items, totals, payment status, download/print. | S |
| FR-ADM-42 | Payment list: transaction history with reference IDs and timestamps. | S |

**Reports**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-50 | Revenue by Product: stacked bar chart + table of MRR contribution per product. | L |
| FR-ADM-51 | Revenue by Customer: table of each customer's total spend and growth. | L |
| FR-ADM-52 | Churn Risk Report: flags customers with overdue invoices, declining usage signals, or contracts expiring within 60 days. | L |
| FR-ADM-53 | Renewals Calendar: upcoming renewals in a timeline view. | L |

**Audit logs**

| ID | Requirement | Priority |
|---|---|---|
| FR-ADM-60 | Immutable, append-only log of all mutating system events (actor, action, resource type/id, IP, timestamp). | M |
| FR-ADM-61 | Filterable by actor, action type, resource, and date range. | S |
| FR-ADM-62 | No UI or API path exists to edit or delete audit records. | M |

### 5.3 Customer Portal (`FR-POR`)

**Dashboard**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-01 | Welcome banner with org name and assigned Customer Success Manager contact. | M |
| FR-POR-02 | KPI tiles: active products, outstanding balance, open tickets, days to next renewal. | M |
| FR-POR-03 | System announcements feed (pushed by super admin via notifications). | S |
| FR-POR-04 | Upcoming tasks / action items (e.g. "Invoice due in 5 days"). | S |

**Services (Launchpad)**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-10 | Grid of subscribed products with status badges and launch buttons. | M |
| FR-POR-11 | Each card links to that product's micro-site page. | M |

**Subscriptions**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-20 | View current subscription: all line items, quantities, pricing. | M |
| FR-POR-21 | Add products to subscription (triggers checkout flow). | S |
| FR-POR-22 | Remove products from subscription. | S |
| FR-POR-23 | Change billing cycle (monthly ↔ annual) with proration preview before confirm. | S |

**Billing**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-30 | Invoice history: date, amount, status, download. | M |
| FR-POR-31 | Payment history: all recorded transactions. | S |
| FR-POR-32 | Payment methods: list saved cards/ACH; add new via secure form. | S |

**Renewal workflow**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-40 | Renewal page shows contract end date and renewal options. | S |
| FR-POR-41 | Customer confirms renewal online; triggers status update + notification to super admin. | S |

**Support tickets**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-50 | Ticket list (open/closed) with priority badges (Low, Medium, High, Critical). | M |
| FR-POR-51 | New ticket: subject, category (Technical/Billing/General), priority, description. | M |
| FR-POR-52 | Ticket detail: message thread, status updates, close/reopen. | M |

**Documents & Success Center**

| ID | Requirement | Priority |
|---|---|---|
| FR-POR-60 | Document repository: name, type, upload date, view/download. | S |
| FR-POR-61 | Success Center: onboarding checklist with completion %, CSM contact card, links to resources. | S |

### 5.4 Product Suite Micro-sites (`FR-APP`)

| ID | Requirement | Priority |
|---|---|---|
| FR-APP-01 | Each of the 8 products has a dedicated micro-site page within the portal. | L |
| FR-APP-02 | Page includes: branded header with status badge, product-specific metric tiles, quick actions (Launch App, View Docs, Contact Support), and a recent activity/usage feed. | L |
| FR-APP-03 | A micro-site is only reachable if the org is subscribed to that product; otherwise show an upsell/locked state. | L |

### 5.5 Notifications (`FR-NOT`)

| ID | Requirement | Priority |
|---|---|---|
| FR-NOT-01 | Users have an unread-notification list, scoped to user or whole org. | S |
| FR-NOT-02 | Notifications can be marked read. | S |
| FR-NOT-03 | System emits notifications for: invite sent, subscription change, renewal due, invoice due/overdue, ticket reply, announcement. | S |

---

## 6. Non-Functional Requirements (`NFR`)

### 6.1 Security & privacy

| ID | Requirement |
|---|---|
| NFR-SEC-01 | All passwords/credentials handled by the managed auth provider; if any secrets are stored, they are hashed (bcrypt/argon2, cost ≥ 12). |
| NFR-SEC-02 | Tenant isolation enforced server-side on every customer-scoped query; cross-tenant access is impossible via the API. |
| NFR-SEC-03 | RBAC enforced at the route/middleware and data-access layers; UI checks are convenience only. |
| NFR-SEC-04 | CSRF protection on all state-changing requests. |
| NFR-SEC-05 | Rate limiting on auth endpoints (≤ 10 attempts/min/IP) and sensitive mutations. |
| NFR-SEC-06 | All production traffic over HTTPS/TLS 1.2+; HSTS enabled. |
| NFR-SEC-07 | Content Security Policy and standard security headers set on all responses. |
| NFR-SEC-08 | All request bodies validated and sanitized (schema validation) before use. |
| NFR-SEC-09 | Audit log is append-only and immutable at the database level. |
| NFR-SEC-10 | Secrets supplied via environment variables; none committed to source control. |

### 6.2 Performance & reliability

| ID | Requirement |
|---|---|
| NFR-PERF-01 | P95 server response for list/detail pages < 500ms at expected load. |
| NFR-PERF-02 | Dashboards reflect source events within 60s. |
| NFR-PERF-03 | Lists are paginated/virtualized; no unbounded queries. |
| NFR-PERF-04 | Graceful degradation: a failing widget never takes down the page. |

### 6.3 Usability & accessibility

| ID | Requirement |
|---|---|
| NFR-UX-01 | WCAG 2.1 AA targeted; Lighthouse accessibility ≥ 90 on key pages. |
| NFR-UX-02 | Responsive: desktop-first, sidebar collapses ≤1024px, mobile sheet ≤768px. |
| NFR-UX-03 | Dark/light mode supported. |
| NFR-UX-04 | Consistent BusinessValue365 brand across all screens. |
| NFR-UX-05 | All forms show inline validation, disabled submit while loading, and success/error toasts. |

### 6.4 Maintainability & quality

| ID | Requirement |
|---|---|
| NFR-QA-01 | TypeScript strict; `tsc --noEmit` passes with zero errors. |
| NFR-QA-02 | ≥ 80% line coverage on server route handlers and core lib. |
| NFR-QA-03 | Key flows covered by E2E tests (login, create customer, add subscription, open ticket, accept invite). |
| NFR-QA-04 | Database migrations are versioned, committed, and apply cleanly to a fresh database. |
| NFR-QA-05 | Idempotent seed script produces a full demo environment. |

### 6.5 Observability

| ID | Requirement |
|---|---|
| NFR-OBS-01 | Structured logging with request IDs. |
| NFR-OBS-02 | Health endpoint returns 200 when app + DB are reachable. |
| NFR-OBS-03 | Errors are captured with enough context to debug (no PII leakage). |

---

## 7. Assumptions

- The eight 365-product backends are external systems; the portal links out to them and renders informational micro-sites only.
- Email delivery requires a configured transactional email provider.
- Object storage credentials for documents are supplied via environment.
- Designs follow the existing BusinessValue365 brand (royal blue, orange, DM Sans).
- A managed auth provider (Clerk) and Stripe are acceptable third-party dependencies (see [adr/0002](./adr/0002-auth-provider.md), [adr/0003](./adr/0003-billing.md)).

## 8. Out of Scope

- Native mobile apps (iOS/Android).
- Real-time websocket features beyond polling (live chat, live dashboard streaming).
- Building any of the 8 product backends.
- Enterprise SSO/SAML beyond what the managed auth provider offers out of the box.
- Automated invoice PDF generation engine (basic download is in scope; a templated rendering pipeline is a later phase).

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tenant data leak across orgs | Critical | Enforce isolation in the data-access layer + DB row-level checks; add automated cross-tenant tests (NFR-SEC-02). |
| Billing edge cases (proration, partial periods) | High | Delegate to Stripe; show proration preview before confirm (FR-POR-23). |
| Audit gaps | High | Centralize mutations through a service layer that always writes audit entries (FR-ADM-60). |
| Scope creep across 8 phases | Medium | Phase gates with acceptance criteria in WORKFLOW.md. |
| Email deliverability for invites | Medium | Use a reputable provider; surface invite status and allow re-send (FR-AUTH-07). |

## 10. Acceptance Criteria (Definition of Done)

The product is complete when:

1. All FRs marked `M` and `S` are implemented and navigable; `L` features delivered per phase plan.
2. All API endpoints return correct data with correct role + tenant enforcement.
3. `tsc --noEmit` passes with zero errors.
4. Migrations apply cleanly to a fresh database; seed produces a working demo.
5. Login, invitation, MFA, password reset, and session expiry work end-to-end.
6. BusinessValue365 brand applied consistently (logo, royal blue, orange, DM Sans).
7. Admin dashboard shows correct MRR/ARR/active-customer metrics.
8. Audit log captures all admin mutations and is immutable.
9. Lighthouse accessibility ≥ 90 on key pages.
10. Security controls (rate limiting, CSRF, HTTPS, CSP, tenant isolation) implemented and verified by tests.
11. Cross-tenant access tests pass (no org can read/write another's data).
12. UAT sign-off received from an authorized BusinessValue365 representative.

---

*End of PRD — CustomerPortal365. © 2026 BusinessValue365. Confidential.*
