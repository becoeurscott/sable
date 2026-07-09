/**
 * Database access layer (§9 config/supabase.ts equivalent).
 *
 * Two access modes:
 *   1. query()/serviceTxn()  — SERVICE context. Runs as the table owner, which
 *      bypasses RLS. Used for signup, Stripe webhooks, cron/usage writes, and
 *      the SECURITY-DEFINER-style admin work that legitimately spans tenants.
 *   2. asUser(userId, fn)    — TENANT context. Opens a transaction, switches to
 *      the low-privilege RLS role, and injects the user's JWT claims so
 *      auth.uid() resolves. Every query inside is subject to the §8 policies —
 *      hard tenant isolation enforced by Postgres, not just the API (§12).
 *
 * Same contract works on Supabase: set DB_RLS_ROLE=authenticated.
 */
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { env, pgSsl } from './env.js';
import { logger } from './logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  ssl: pgSsl(), // enabled automatically for Supabase / remote hosts
});

pool.on('error', (err) => logger.error({ err }, 'unexpected idle pg client error'));

// Guard against SQL injection via the (non-parameterizable) role identifier.
const RLS_ROLE = env.DB_RLS_ROLE;
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(RLS_ROLE)) {
  throw new Error(`Invalid DB_RLS_ROLE identifier: ${RLS_ROLE}`);
}

/** Service-context query (RLS bypassed — never pass raw user input as SQL). */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query<T>(text, params as never[]);
  return res.rows;
}

/** Service-context transaction (RLS bypassed). For atomic cross-tenant setup. */
export async function serviceTxn<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Tenant-context transaction. Switches to the RLS role and sets the request's
 * JWT claims so auth.uid() = userId and the §8 policies apply to every query.
 */
export async function asUser<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Order matters: set claims first (as owner), then drop into the RLS role.
    const claims = JSON.stringify({ sub: userId, role: 'authenticated' });
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [claims]);
    await client.query(`SET LOCAL ROLE ${RLS_ROLE}`);
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Convenience: tenant-context query returning rows. */
export async function asUserQuery<T extends QueryResultRow = QueryResultRow>(
  userId: string,
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  return asUser(userId, async (client) => {
    const res = await client.query<T>(text, params as never[]);
    return res.rows;
  });
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
