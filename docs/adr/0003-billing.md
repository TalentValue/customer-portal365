# ADR 0003 — Stripe Billing for subscriptions, invoices, and payments

**Status:** Accepted · **Date:** 2026-06-16

## Context
The Scope of Work treated payments as mock data through Phase 7, deferring "real" integration to a separate engagement, and asked the app to compute invoices, proration, and payment-method storage itself. Billing correctness (proration, partial periods, tax, dunning, PCI scope) is hard and risky to hand-build. The PRD requires subscription self-service with proration preview (FR-POR-23), payment methods (FR-POR-32), and accurate revenue analytics (FR-ADM-50/51).

## Options considered
1. **Mock billing now, real later** (as specced) — throwaway code; two integrations; revenue metrics not trustworthy.
2. **Hand-built billing engine** — full control, very high risk and maintenance, PCI exposure.
3. **Stripe Billing from the start, test mode early** — one code path; Stripe owns money movement, proration, and PCI scope; local tables mirror Stripe for fast reads/reporting.

## Decision
Integrate **Stripe Billing** from Phase 3. Products/prices, subscriptions, invoices, payment methods, and payments are mirrored in local tables for fast reads and reporting, with **Stripe as the source of truth** for money. Proration previews use Stripe before customer confirm. Payment methods are added via SetupIntent; only `last4`/`brand`/expiry are stored locally (no PANs). Early phases run Stripe in **test mode** with seeded fixtures — the identical code path serves production by swapping keys, so nothing is thrown away.

## Consequences
**Positive:** trustworthy revenue data; correct proration/dunning; minimal PCI scope; no rewrite between "mock" and "real".
**Negative:** Stripe dependency and fees; webhook reconciliation complexity. Mitigated with signature-verified webhooks and idempotent reconciliation, all behind `lib/billing`.

## Revisit if
The client mandates a different processor — the `lib/billing` interface isolates the provider.
