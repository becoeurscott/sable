/**
 * Migration runner — applies migrations/*.sql in filename order inside a
 * transaction, tracking applied files in public.schema_migrations.
 *
 *   npm run db:migrate             apply pending migrations
 *   npm run db:migrate -- --reset  drop & recreate the public schema first
 *
 * Supabase-aware:
 *   - When DB_RLS_ROLE != app_authenticated (Supabase target), the local-only
 *     auth shim (files with "local" in the name) is skipped — Supabase already
 *     provides auth.uid() and the `authenticated` role.
 *   - SSL is enabled automatically for non-localhost hosts.
 *   - --reset NEVER drops the `auth` schema and REFUSES to run against a remote
 *     DB unless FORCE_REMOTE_RESET=true (prevents nuking a live Supabase project).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

function isRemote(url: string): boolean {
  try {
    return !/^(localhost|127\.0\.0\.1|::1)$/.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

async function main() {
  const reset = process.argv.includes('--reset');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const remote = isRemote(url);
  const sslMode = process.env.DATABASE_SSL ?? 'auto';
  const ssl = sslMode === 'off' ? false : sslMode === 'on' || remote ? { rejectUnauthorized: false } : false;
  const supabaseTarget = (process.env.DB_RLS_ROLE ?? 'app_authenticated') !== 'app_authenticated';

  const client = new Client({ connectionString: url, ssl });
  await client.connect();

  try {
    if (reset) {
      if (remote && process.env.FORCE_REMOTE_RESET !== 'true') {
        throw new Error(
          'Refusing --reset against a remote database. This would drop all data. ' +
            'Set FORCE_REMOTE_RESET=true only if you are certain.',
        );
      }
      console.log('⚠  Resetting public schema (auth schema left untouched)…');
      await client.query('DROP SCHEMA IF EXISTS public CASCADE');
      await client.query('CREATE SCHEMA public');
      // Restore default grants Supabase expects on a fresh public schema.
      if (supabaseTarget) {
        await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role');
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query('SELECT filename FROM public.schema_migrations')).rows.map(
        (r) => r.filename as string,
      ),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      if (supabaseTarget && file.includes('local')) {
        console.log(`↷ ${file} … skipped (Supabase provides this)`);
        continue;
      }
      if (!supabaseTarget && file.includes('supabase')) {
        console.log(`↷ ${file} … skipped (Supabase-only)`);
        continue;
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write(`→ ${file} … `);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log('ok');
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('FAILED');
        throw err;
      }
    }

    console.log(ran ? `✓ Applied ${ran} migration(s).` : '✓ Up to date, nothing to apply.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
