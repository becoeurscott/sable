/**
 * Vercel serverless entry for the Express API.
 *
 * Vercel invokes the default export as the request handler; an Express app IS
 * a (req, res) handler, so we build it once at module scope (reused across warm
 * invocations) and export it. All routing/CORS/error handling lives in
 * createApp() exactly as it does when running the long-lived server locally.
 *
 * The vercel.json rewrite sends every path here, and Express matches the
 * original URL (/health, /docs, /api/v1/*) as normal.
 */
import { createApp } from '../src/app.js';

const app = createApp();

export default app;
