import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Phase 0 placeholder home. Renders the shared app shell so the foundation is
 * visible in light/dark. Real role-based routing/home pages land in Phase 1.
 */
export default function Home() {
  const tiles = ['MRR', 'ARR', 'Active Customers', 'Active Subscriptions'];
  return (
    <AppShell variant="admin" title="Dashboard" showSearch>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Foundation ready</h2>
          <p className="text-sm text-muted-foreground">
            Phase 0 scaffold — app shell, brand tokens, and tooling. Features land in later phases.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((label) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">—</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
