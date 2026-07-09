/** Server bootstrap + graceful shutdown. */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closeDb, pool } from './config/db.js';

async function main() {
  // Probe the DB, but don't block boot — /health and /docs should work even
  // before the database is wired (e.g. while setting up Supabase).
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection OK');
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Database unreachable — API up, but data routes will 5xx until DATABASE_URL works');
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`FinanceAI API on http://localhost:${env.PORT}  ·  docs: http://localhost:${env.PORT}/docs`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
    // Force-exit if graceful close hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
