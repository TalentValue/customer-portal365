import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/db';
import { success } from '@/lib/api/envelope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /healthz — app + DB status (TDD §6.2, NFR-OBS-02).
 * Returns 200 when the app is up. `db` reflects DB reachability; a missing
 * DATABASE_URL or unreachable DB reports false without crashing the route.
 */
export async function GET() {
  const dbOk = await checkDbConnection();
  return NextResponse.json(
    success({
      status: 'ok',
      app: true,
      db: dbOk,
      timestamp: new Date().toISOString(),
    }),
    { status: 200 },
  );
}
