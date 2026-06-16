# ADR 0002 — Clerk as the managed authentication provider (with MFA)

**Status:** Accepted · **Date:** 2026-06-16

## Context
The Scope of Work specified hand-rolled `express-session` + bcrypt, plus a custom TOTP MFA screen and a custom invitation system. Authentication is high-risk, undifferentiated work: sessions, password hashing/rotation, MFA enrollment, rate limiting, account recovery, and email verification are easy to get subtly wrong. The PRD requires MFA (FR-AUTH-02), secure invitations (FR-AUTH-05/06/07), and strong session security (NFR-SEC-01/06).

## Options considered
1. **Custom (express-session + bcrypt + TOTP)** — full control, but large security surface to build and maintain.
2. **BetterAuth (self-hosted library)** — owns data, no vendor; still requires us to operate MFA/recovery flows.
3. **Clerk (managed)** — drop-in email/password, TOTP MFA, secure sessions, organizations, and invitation primitives; React/Next SDK and middleware.

## Decision
Use **Clerk** for identity: email/password, TOTP MFA (required for `super_admin`), session management, and password reset. Local `users` rows are kept in sync via a Clerk webhook and store role + `customer_id` for RBAC/tenancy. The app's own invitation table (token, role, 72h expiry) drives the customer-onboarding flow and provisions a Clerk user on accept.

## Consequences
**Positive:** production-grade auth/MFA on day one; far smaller security surface; satisfies FR-AUTH and NFR-SEC quickly.
**Negative:** third-party dependency and cost; identity data lives partly with the vendor. Mitigated by wrapping all auth access behind `lib/auth` interfaces so the provider is swappable.

## Revisit if
A no-third-party requirement emerges or cost/compliance dictates self-hosting — swap to **BetterAuth** behind the same `lib/auth` interface; the rest of the app is unaffected.
