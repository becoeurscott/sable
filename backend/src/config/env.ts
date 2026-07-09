/**
 * Zod-validated environment configuration (§9 config/env.ts).
 * Fails fast at boot if required vars are missing/malformed.
 */
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_RLS_ROLE: z.string().default('app_authenticated'),
  // auto = SSL on for non-localhost hosts (e.g. Supabase); on/off to force.
  DATABASE_SSL: z.enum(['auto', 'on', 'off']).default('auto'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(3600),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),

  // Auth model: 'local' = self-issued JWTs; 'supabase' = verify Supabase Auth JWTs.
  AUTH_MODE: z.enum(['local', 'supabase']).default('local'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(), // Settings → API → JWT Secret (HS256)

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  GEMMA_API_KEY: z.string().optional(),
  GEMMA_MODEL: z.string().default('gemma-3-27b-it'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('FinanceAI <onboarding@resend.dev>'),

  RATE_LIMIT_STORE: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('✗ Invalid environment:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const stripeEnabled = Boolean(env.STRIPE_SECRET_KEY);
export const gemmaEnabled = Boolean(env.GEMMA_API_KEY);
export const emailEnabled = Boolean(env.RESEND_API_KEY);

/** True when DATABASE_URL points at a remote host (not localhost). */
export function isRemoteDb(): boolean {
  try {
    return !/^(localhost|127\.0\.0\.1|::1)$/.test(new URL(env.DATABASE_URL).hostname);
  } catch {
    return false;
  }
}

/** node-pg ssl option derived from DATABASE_SSL + host. */
export function pgSsl(): false | { rejectUnauthorized: boolean } {
  if (env.DATABASE_SSL === 'off') return false;
  if (env.DATABASE_SSL === 'on') return { rejectUnauthorized: false };
  return isRemoteDb() ? { rejectUnauthorized: false } : false; // auto
}

/** Are we targeting Supabase (its `auth` schema + `authenticated` role exist)? */
export const isSupabaseTarget = (): boolean => env.DB_RLS_ROLE !== 'app_authenticated';

export const authMode = env.AUTH_MODE;
if (authMode === 'supabase' && !env.SUPABASE_JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('✗ AUTH_MODE=supabase requires SUPABASE_JWT_SECRET');
  process.exit(1);
}
