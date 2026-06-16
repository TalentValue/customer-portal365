import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  Receipt,
  BarChart3,
  ScrollText,
  Grid3x3,
  RefreshCw,
  LifeBuoy,
  FileText,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { label: string; href: string; icon: LucideIcon };

/** Admin nav — super_admin (DESIGN_SYSTEM §2.2). */
export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Billing', href: '/admin/billing', icon: Receipt },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
];

/** Portal nav — customer_admin / customer_user (DESIGN_SYSTEM §2.2). */
export const portalNav: NavItem[] = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'Services', href: '/portal/services', icon: Grid3x3 },
  { label: 'Subscriptions', href: '/portal/subscriptions', icon: CreditCard },
  { label: 'Billing', href: '/portal/billing', icon: Receipt },
  { label: 'Renewals', href: '/portal/renewals', icon: RefreshCw },
  { label: 'Support', href: '/portal/tickets', icon: LifeBuoy },
  { label: 'Documents', href: '/portal/documents', icon: FileText },
  { label: 'Success Center', href: '/portal/success', icon: GraduationCap },
];
