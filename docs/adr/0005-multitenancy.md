# ADR 0005 — Defense-in-depth multi-tenant isolation

**Status:** Accepted · **Date:** 2026-06-16

## Context
CustomerPortal365 is multi-tenant: many customer organizations share one database. The single most damaging failure mode is one organization reading or modifying another's data. The PRD makes tenant isolation non-negotiable (NFR-SEC-02) and read/write scoping a hard rule. UI-only checks are insufficient.

## Options considered
1. **Database-per-tenant** — strongest isolation, heavy operational cost, painful cross-tenant admin analytics.
2. **Shared DB, app-layer scoping only** — simple, but one missed `WHERE customer_id` leaks data.
3. **Shared DB, app-layer scoping + Postgres RLS** — layered controls; a bug in one layer is caught by another.

## Decision
Shared database with **defense in depth**:
- **App layer (primary):** every customer-scoped query goes through `tenantScope(ctx)` / `assertTenantAccess`, deriving `customer_id` from the authenticated session — never from client input. A lint rule and code review forbid unscoped customer-table access.
- **Database (backstop):** Postgres **Row-Level Security** policies on all customer-scoped tables, keyed to a per-request session GUC.
- **Tests:** automated cross-tenant denial tests assert org A cannot read/write org B.
`super_admin` operates across tenants by design; every such action is written to the immutable audit log.

## Consequences
**Positive:** a single layer's mistake does not cause a breach; admin analytics remain simple; cost stays low.
**Negative:** RLS adds query/setup complexity and requires discipline setting the session context per request. Mitigated by a single DB-connection wrapper that sets the GUC and by the centralized service layer.

## Revisit if
A customer contractually requires physical data isolation — promote that tenant to a dedicated database.
