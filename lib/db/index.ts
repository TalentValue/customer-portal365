import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

/**
 * Lazily-created singleton postgres client.
 * Returns null when DATABASE_URL is unset so the app (and /healthz) can boot
 * and report DB status gracefully (NFR-PERF-04, NFR-OBS-02).
 */
declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

function getClient() {
  if (!connectionString) return null;
  if (!globalThis.__pgClient) {
    globalThis.__pgClient = postgres(connectionString, { max: 10, prepare: false });
  }
  return globalThis.__pgClient;
}

const client = getClient();

export const db = client ? drizzle(client, { schema }) : null;

/** Ping the database. Returns true when reachable, false otherwise. */
export async function checkDbConnection(): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
