# Design System & UI/UX Specification
## CustomerPortal365

| | |
|---|---|
| **Version** | 1.0 |
| **Last updated** | 2026-06-16 |
| **Companion to** | [PRD.md](./PRD.md) · [TDD.md](./TDD.md) |

> This document is the visual and interaction source of truth. It tells Claude Code exactly how every screen should look, behave, and respond. Tokens here map directly to Tailwind v4 `@theme` variables and shadcn/ui component variants.

---

## 1. Brand Foundations

### 1.1 Identity
- **Logo mark:** bar-chart icon inside a blue circle; the tallest/middle bar is orange. Used in the sidebar header and favicon.
- **Voice:** professional, clear, confidence-building. "Complete visibility" — never make the user guess what they owe or what's next.

### 1.2 Color tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | `#1A56DB` (hsl 221 79% 48%) | `#3B82F6` | Primary actions, active nav, links, chart series 1 |
| `--accent` | `#F97316` (hsl 25 95% 53%) | `#FB923C` | Highlights, key metric emphasis, chart series 2 |
| `--background` | `#FFFFFF` | `#0B1120` | Page background |
| `--card` | `#FFFFFF` | `#111827` | Surfaces, tiles |
| `--muted` | `#F3F4F6` | `#1F2937` | Secondary surfaces, table headers |
| `--foreground` | `#0F172A` | `#E5E7EB` | Body text |
| `--muted-foreground` | `#64748B` | `#94A3B8` | Secondary text, labels |
| `--border` | `#E2E8F0` | `#1F2937` | Dividers, input borders |
| `--success` | `#16A34A` | `#22C55E` | Paid, active, healthy |
| `--warning` | `#D97706` | `#F59E0B` | Pending, due soon |
| `--destructive` | `#DC2626` | `#EF4444` | Overdue, critical, errors |

Status semantics are consistent everywhere:

| Status family | Color |
|---|---|
| Active / Paid / Healthy | success (green) |
| Pending / Draft / Due soon | warning (amber) |
| Overdue / Suspended / Critical / Cancelled | destructive (red) |
| Churned / Expired / Inactive | muted (gray) |

### 1.3 Typography
- **Font:** DM Sans (Google Fonts), all weights; loaded via `next/font`.
- **Scale:** display 30/36, h1 24/32, h2 20/28, h3 16/24, body 14/20, small 12/16. Numerals tabular for tables and KPI tiles.
- **Weights:** 600 for headings and KPI numbers, 500 for nav/labels, 400 for body.

### 1.4 Spacing, radius, elevation
- 4px spacing base (Tailwind default scale).
- Radius: `--radius` = 10px for cards/inputs/buttons; 9999px for badges/avatars.
- Shadows: subtle (`sm`) on cards, `md` on popovers/modals; avoid heavy shadows.

---

## 2. Layout System

Both admin and portal share one app shell:

```
┌──────────────────────────────────────────────────────────┐
│ Sidebar (fixed, collapsible)  │  Top header bar            │
│  ┌──────────────┐             │  breadcrumb · search · ⛭  │
│  │ logo + name  │             ├────────────────────────────┤
│  ├──────────────┤             │                            │
│  │ nav links    │             │   Main content (scroll)    │
│  │  (Lucide)    │             │   page header + actions    │
│  │              │             │   content grid             │
│  ├──────────────┤             │                            │
│  │ user avatar  │             │                            │
│  │ + role badge │             │                            │
│  └──────────────┘             │                            │
└──────────────────────────────────────────────────────────┘
```

- **Sidebar:** logo mark + product name at top; navigation links with Lucide icons grouped by section; user avatar + role badge pinned to bottom. Active link uses `--primary` background tint + left accent bar.
- **Top header:** breadcrumb/page title, global search (admin), notifications bell with unread count, theme toggle, user menu.
- **Main:** page header (title + primary action button on the right), then content.

### 2.1 Responsive breakpoints
- **≥1280px:** full sidebar (240px).
- **≤1024px:** sidebar collapses to icon-only (64px); labels on hover tooltip.
- **≤768px:** sidebar becomes an off-canvas sheet toggled by a hamburger; content full-width.

### 2.2 Navigation maps

**Admin (`super_admin`)** — icons: LayoutDashboard, Users, CreditCard, Package, Receipt, BarChart3, ScrollText
Dashboard · Customers · Subscriptions · Products · Billing · Reports · Audit Logs

**Portal (`customer_admin` / `customer_user`)** — icons: LayoutDashboard, Grid3x3, CreditCard, RefreshCw, LifeBuoy, FileText, GraduationCap
Dashboard · Services · Subscriptions · Billing · Renewals · Support · Documents · Success Center

(Read-only `customer_user` sees the same nav but action buttons/forms are hidden or disabled with tooltips.)

---

## 3. Component Standards

Built on **shadcn/ui + Radix**. Standard components and their rules:

- **Buttons:** variants `default` (primary blue), `secondary`, `outline`, `ghost`, `destructive`. Primary action per page is filled blue; key revenue/CTA emphasis may use accent orange sparingly. Disabled + spinner while submitting.
- **Data tables:** sortable column headers, search input above, status badge chips, right-aligned row-actions dropdown (kebab). Pagination footer with page size. Empty state with icon + message + primary action. Loading skeleton rows.
- **Forms:** React Hook Form + Zod. Inline error message below each field in `--destructive`; submit disabled while loading; toast on success/error. Group related fields; required fields marked.
- **KPI tiles:** card with label (muted, small, uppercase tracking), large tabular number, optional delta chip (green up / red down) and sparkline.
- **Badges:** pill, colored per status semantics (§1.2). Priority badges: Low (muted), Medium (blue), High (amber), Critical (red).
- **Modals/dialogs (Radix):** for create/edit forms and confirmations; destructive confirmations require explicit confirm.
- **Toasts:** top-right; success/error/info; auto-dismiss; one action max.
- **Charts (Recharts):** brand palette — series 1 blue, series 2 orange, then teal/violet/slate. Gridlines muted; tooltips on hover; accessible labels; responsive container.
- **Tabs, breadcrumbs, avatars, tooltips, dropdown menus:** Radix primitives, brand-tokened.

### 3.1 States to always handle
Every data view implements: **loading** (skeleton), **empty** (illustration/icon + guidance), **error** (retry), and **success/populated**. A failing widget renders an inline error card, never blanks the page (NFR-PERF-04).

---

## 4. Page-by-Page Specifications

For each page: purpose, key components, and primary actions. Requirement IDs reference the PRD.

### 4.1 Auth & onboarding
- **Sign-in** (`/sign-in`): centered card, logo, email/password, MFA step for super admins, "forgot password" link. (FR-AUTH-01/02/09)
- **Invite landing** (`/invite/[token]`): validates token; on valid, shows set-password / accept form; on invalid/expired, shows clear error + "request new invite". (FR-AUTH-06/07)

### 4.2 Admin console
- **Dashboard** (`/admin/dashboard`): 4 KPI tiles (MRR, ARR, Active Customers, Active Subscriptions) across the top; revenue chart (12-mo MRR trend, bar/line toggle); recent-activity feed (right column); quick-action buttons (New Customer, New Subscription) in the page header. (FR-ADM-01..04)
- **Customers list** (`/admin/customers`): searchable paginated table — Company, Industry, Status badge, MRR, Contract end, actions. "New Customer" primary button opens dialog/form. (FR-ADM-10/11)
- **Customer detail** (`/admin/customers/[id]`): header with name + status + "Send Invite"; tabs — Overview (editable info), Subscriptions, Invoices, Tickets, Users. (FR-ADM-12/13)
- **Products** (`/admin/products`): table/cards with inline editing of name, description, monthly/annual price, features, active flag. (FR-ADM-20/21)
- **Subscriptions list** (`/admin/subscriptions`): filter chips by status; table — Customer, Status, Cycle, MRR, Start/End, actions. (FR-ADM-30)
- **Subscription detail** (`/admin/subscriptions/[id]`): parent summary + line-items table (add/remove rows); Renew/Cancel actions. (FR-ADM-31/32/33)
- **Billing** (`/admin/billing`): Invoices tab (filter by customer/status/date; detail drawer with line items, totals, download) + Payments tab (transaction history). (FR-ADM-40/41/42)
- **Reports** (`/admin/reports`): Revenue by Product (stacked bar + table), Revenue by Customer (table), Churn Risk (flagged list), Renewals Calendar (timeline). (FR-ADM-50..53)
- **Audit logs** (`/admin/audit`): read-only filterable table — Timestamp, Actor, Action, Resource type, Resource id, IP. No edit/delete affordances anywhere. (FR-ADM-60/61/62)

### 4.3 Customer portal
- **Dashboard** (`/portal/dashboard`): welcome banner (org name + CSM contact); 4 KPI tiles (Active Products, Outstanding Balance, Open Tickets, Days to Renewal); announcements feed; upcoming tasks. (FR-POR-01..04)
- **Services / Launchpad** (`/portal/services`): responsive product card grid — icon, name, status badge, Launch button linking to micro-site. (FR-POR-10/11)
- **Subscriptions** (`/portal/subscriptions`): current subscription with line items, quantities, pricing; Add/Remove products; Change cycle with **proration preview** modal before confirm. (FR-POR-20..23)
- **Billing** (`/portal/billing`): Invoices tab (history + download), Payments tab, Payment Methods tab (list + add card/ACH form). (FR-POR-30/31/32)
- **Renewals** (`/portal/renewals`): contract end date, renewal options, confirm-renewal action. (FR-POR-40/41)
- **Support** (`/portal/tickets`): ticket list with priority badges; New Ticket form; detail (`/portal/tickets/[id]`) with message thread, status, close/reopen. (FR-POR-50..52)
- **Documents** (`/portal/documents`): table — name, type, upload date, view/download. (FR-POR-60)
- **Success Center** (`/portal/success`): onboarding checklist with completion %, CSM contact card, resource/KB links. (FR-POR-61)

### 4.4 Product micro-sites (`/portal/apps/[slug]`)
Each of the 8 products: branded header (product logo + status badge), product-specific metric tiles, quick actions (Launch App, View Documentation, Contact Support), recent activity/usage feed. If the org isn't subscribed, show a locked/upsell state. (FR-APP-01..03)

---

## 5. Interaction & Motion
- Transitions subtle and fast (150–200ms). Use for nav collapse, dialog enter/exit, toast slide.
- Skeletons for initial loads; optimistic UI for quick mutations (e.g. mark notification read) with rollback on error.
- Respect `prefers-reduced-motion`.

## 6. Accessibility (NFR-UX-01, target WCAG 2.1 AA)
- Color contrast ≥ 4.5:1 for text; never rely on color alone (pair badges with text/icon).
- Full keyboard navigation; visible focus rings; logical tab order.
- Radix primitives provide ARIA roles; preserve them. Label all inputs and icon-only buttons.
- Charts have accessible summaries/data tables as alternatives.
- Lighthouse accessibility ≥ 90 on sign-in, both dashboards, customer detail, and a portal billing page.

## 7. Theming Implementation Notes
- Tailwind v4 `@theme inline` maps the tokens in §1.2 to CSS variables; light/dark via `class` strategy with a toggle in the header.
- shadcn/ui components consume the same variables so brand changes are single-source.
- DM Sans via `next/font/google`; expose as `--font-sans`.

---

*End of Design System — CustomerPortal365. © 2026 BusinessValue365.*
