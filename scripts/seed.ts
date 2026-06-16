/**
 * Idempotent seed (TDD §10.3): 1 super_admin, 2–3 customers, full product
 * catalog, sample subscriptions/invoices/tickets.
 * Phase 0: placeholder — populated as schema lands in later phases.
 */
async function seed() {
  console.log('[seed] Phase 0 — no schema yet; nothing to seed.');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
