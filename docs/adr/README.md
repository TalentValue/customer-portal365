# Architecture Decision Records

Each ADR captures one significant decision: its context, the options considered, the choice, and the consequences. Status is `Accepted` unless noted. These records explain *why* the TDD departs from the original Scope of Work's stack.

| # | Decision | Status |
|---|---|---|
| [0001](./0001-framework.md) | Next.js (App Router) as the single full-stack framework | Accepted |
| [0002](./0002-auth-provider.md) | Clerk as the managed authentication provider (with MFA) | Accepted |
| [0003](./0003-billing.md) | Stripe Billing for subscriptions, invoices, and payments | Accepted |
| [0004](./0004-orm.md) | Drizzle ORM + PostgreSQL | Accepted |
| [0005](./0005-multitenancy.md) | Defense-in-depth multi-tenant isolation | Accepted |
| [0006](./0006-deployment.md) | Vercel-first deployment with a portable fallback | Accepted |

> Template for new ADRs: Context → Options considered → Decision → Consequences (positive/negative) → Revisit-if triggers.
