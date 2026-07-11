/**
 * Express application assembly (§9, §12).
 * Security order matters: helmet + CORS first, the Stripe webhook is mounted
 * with a raw body BEFORE the JSON parser, then the versioned API, then the
 * 404 and centralized error boundary last.
 */
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env, gemmaEnabled, aiProvider, stripeEnabled, emailEnabled, masterKeyEnabled } from './config/env.js';
import { logger } from './config/logger.js';
import { apiRouter } from './routes/index.js';
import { openapiSpec } from './docs/openapi.js';
import { stripeWebhook } from './controllers/webhook.controller.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Swagger UI shell (assets from CDN). Renders the spec at /api/v1/openapi.json.
const DOCS_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>FinanceAI API — Reference</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
<style>body{margin:0}.topbar{display:none}</style></head>
<body><div id="app"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>window.ui=SwaggerUIBundle({url:'/api/v1/openapi.json',dom_id:'#app',deepLinking:true,persistAuthorization:true,tryItOutEnabled:true});</script>
</body></html>`;

export function createApp(): Express {
  const app = express();

  // Behind Vercel/Railway proxies — needed for correct req.ip in rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // §12: security headers (CSP kept conservative; this is a JSON API).
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      hsts: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // Allow the configured origins, plus any *.vercel.app deployment (so preview /
  // production URLs work without updating CORS_ORIGINS on every deploy).
  const allowed = new Set(env.CORS_ORIGINS);
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // non-browser clients (curl, server-to-server)
        if (allowed.has(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
          return cb(null, true);
        }
        return cb(null, false);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id', 'X-API-Key'],
    }),
  );

  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ userId: req.user?.id, orgId: req.org?.id }),
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  );

  // Stripe webhook — RAW body required for signature verification (§12).
  app.post('/api/v1/webhooks/stripe', express.raw({ type: '*/*' }), stripeWebhook);

  // JSON for everything else.
  app.use(express.json({ limit: '1mb' }));

  // Liveness / readiness.
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: env.NODE_ENV,
      integrations: { gemma: gemmaEnabled, aiProvider, stripe: stripeEnabled, email: emailEnabled, masterKey: masterKeyEnabled },
    });
  });

  // Interactive API reference (public). Browse every route + "Try it out".
  app.get('/api/v1/openapi.json', (_req, res) => res.json(openapiSpec));
  app.get(['/docs', '/api-docs'], (_req, res) => {
    // Override the strict global CSP so Swagger UI's CDN assets can load here.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; " +
        "font-src 'self' data: https://unpkg.com; connect-src 'self'; worker-src 'self' blob:",
    );
    res.type('html').send(DOCS_HTML);
  });

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
