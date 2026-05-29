# Decision: Database Table Sub-Agent Architecture

**Date:** 2026-05-25
**Status:** Implemented

---

## Context

ClientPortal365 has a 15-table PostgreSQL schema managed via Prisma. As the codebase grows, changes to service layer files, controllers, or cron jobs carry database-level risks (N+1 queries, missing auth scopes, improper status transitions, cascade side effects). A single generic code reviewer cannot carry deep knowledge of every table's business rules simultaneously.

## Decision

Create one dedicated sub-agent per database table, each containing:
- Full schema definition for that table
- Foreign key relationships and cascade behavior
- Table-specific business rules (e.g., status transition matrix for Ticket, append-only rule for ActivityLog)
- CRUD-specific review checklist (SELECT/INSERT/UPDATE/DELETE)
- Security risks specific to the table
- Performance red flags

These agents are coordinated by a `database-review-coordinator` agent that:
1. Detects whether a changed file touches database code
2. Identifies which tables are affected
3. Reads the relevant table agents and applies their checklists
4. Produces a consolidated, deduplicated report

Both the coordinator and table agents are triggered automatically via a `FileChanged` hook in `.claude/settings.json`.

## Alternatives Considered

**Single monolithic DB reviewer agent** — rejected because it would grow too large to fit efficiently in Haiku's context, and generic rules would dilute table-specific knowledge.

**Manual invocation only** — rejected because it relies on developers remembering to run a review, which is inconsistent.

**PostToolUse hook instead of FileChanged** — PostToolUse on Write/Edit is equivalent in practice. FileChanged was chosen as it maps more semantically to "a file in the repo changed" regardless of which tool caused it.

## Agent Model Choices

- **Table agents**: `claude-haiku-4-5-20251001` — fast, cheap, focused checklist work
- **Coordinator**: `claude-haiku-4-5-20251001` — routing + combining results; upgraded to `claude-sonnet-4-6` in the agent definition for more nuanced cross-table analysis if needed

## Files Created

```
.claude/agents/
├── database-review-coordinator.md   ← entry point for all DB reviews
├── db-user-agent.md
├── db-company-agent.md
├── db-contact-agent.md
├── db-team-agent.md
├── db-team-member-agent.md
├── db-ticket-agent.md
├── db-ticket-comment-agent.md
├── db-ticket-attachment-agent.md
├── db-ticket-watcher-agent.md
├── db-notification-agent.md
├── db-reminder-agent.md
├── db-activity-log-agent.md
├── db-email-template-agent.md
├── db-setting-agent.md
└── db-session-agent.md
```

## How to Add a New Table Sub-Agent

When a new Prisma model is added:
1. Create `.claude/agents/db-<tablename>-agent.md` following the existing template
2. Add the table to the coordinator's Table Registry (`database-review-coordinator.md`)
3. Add a checklist item to `tasks.md`

## Trade-offs

- **Context cost**: Each FileChanged event runs two agent hooks (code reviewer + DB coordinator). On small non-DB files the DB coordinator exits quickly with a skip message.
- **Timeout**: DB coordinator has a 180s timeout to allow reading multiple agent files and the changed file. Haiku is fast enough that this should not be hit on normal service files.
- **Maintenance**: Table agents must be updated if the Prisma schema changes. This is low-friction since each agent maps 1:1 to a schema model.
