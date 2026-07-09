/**
 * OpenAPI 3.0 spec for the FinanceAI REST API (§10).
 * Served as JSON at /api/v1/openapi.json and rendered by Swagger UI at /docs,
 * where you can browse every route and make live "try it out" requests.
 *
 * Built from a compact route table so it stays complete as routes evolve.
 */

type Auth = 'none' | 'jwt' | 'member' | 'manager' | 'accountant' | 'admin' | 'owner';

interface RouteDef {
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string; // OpenAPI path (e.g. /expenses/{id})
  tag: string;
  summary: string;
  auth: Auth;
  org?: boolean; // requires X-Org-Id header
  query?: [string, string, string?][]; // [name, type, description?]
  params?: string[]; // path param names (uuid)
  body?: Record<string, string>; // prop -> type|note
  rate?: string;
}

const ROUTES: RouteDef[] = [
  // Auth
  { method: 'post', path: '/auth/signup', tag: 'Auth', summary: 'Register a new user', auth: 'none', rate: '10/min', body: { email: 'string', password: 'string (min 8)', fullName: 'string?' } },
  { method: 'post', path: '/auth/login', tag: 'Auth', summary: 'Email/password login', auth: 'none', rate: '10/min', body: { email: 'string', password: 'string' } },
  { method: 'post', path: '/auth/refresh', tag: 'Auth', summary: 'Rotate access token', auth: 'none', rate: '30/min', body: { refreshToken: 'string' } },
  { method: 'post', path: '/auth/logout', tag: 'Auth', summary: 'Revoke refresh token', auth: 'jwt', rate: '60/min', body: { refreshToken: 'string?' } },
  { method: 'get', path: '/auth/me', tag: 'Auth', summary: 'Current user profile', auth: 'jwt', rate: '60/min' },

  // Organizations
  { method: 'post', path: '/organizations', tag: 'Organizations', summary: 'Create organization (tenant)', auth: 'jwt', rate: '5/min', body: { name: 'string', currency: 'string? (3)', country: 'string? (2)' } },
  { method: 'get', path: '/organizations', tag: 'Organizations', summary: 'List my organizations', auth: 'jwt', rate: '60/min' },
  { method: 'get', path: '/organizations/{id}', tag: 'Organizations', summary: 'Get organization', auth: 'member', params: ['id'], rate: '60/min' },
  { method: 'patch', path: '/organizations/{id}', tag: 'Organizations', summary: 'Update organization', auth: 'admin', params: ['id'], rate: '20/min', body: { name: 'string?', currency: 'string?', fiscal_year_end: 'number?', tax_id: 'string?', country: 'string?', chart_of_accounts: 'string[]?' } },
  { method: 'delete', path: '/organizations/{id}', tag: 'Organizations', summary: 'Delete organization (owner)', auth: 'owner', params: ['id'], rate: '2/min' },
  { method: 'get', path: '/organizations/{id}/members', tag: 'Organizations', summary: 'List members', auth: 'member', params: ['id'], rate: '60/min' },
  { method: 'post', path: '/organizations/{id}/invite', tag: 'Organizations', summary: 'Invite member by email', auth: 'admin', params: ['id'], rate: '20/min', body: { email: 'string', role: 'owner|admin|accountant|manager|employee' } },
  { method: 'delete', path: '/organizations/{id}/members/{userId}', tag: 'Organizations', summary: 'Remove member', auth: 'admin', params: ['id', 'userId'], rate: '20/min' },

  // API keys
  { method: 'get', path: '/organizations/{id}/api-keys', tag: 'API Keys', summary: 'List API keys', auth: 'admin', params: ['id'], rate: '30/min' },
  { method: 'post', path: '/organizations/{id}/api-keys', tag: 'API Keys', summary: 'Create API key (plaintext returned once)', auth: 'admin', params: ['id'], rate: '10/min', body: { name: 'string', role: 'admin|accountant|manager|employee', readOnly: 'boolean', expiresAt: 'string?' } },
  { method: 'delete', path: '/organizations/{id}/api-keys/{keyId}', tag: 'API Keys', summary: 'Revoke API key', auth: 'admin', params: ['id', 'keyId'], rate: '20/min' },

  // Dashboard
  { method: 'get', path: '/dashboard', tag: 'Dashboard', summary: 'KPI summary', auth: 'member', org: true, rate: '60/min', query: [['from', 'string', 'YYYY-MM-DD'], ['to', 'string', 'YYYY-MM-DD']] },
  { method: 'get', path: '/dashboard/cashflow', tag: 'Dashboard', summary: 'Monthly cash-flow series', auth: 'member', org: true, rate: '60/min', query: [['months', 'integer', '1-36']] },

  // Expenses
  { method: 'get', path: '/expenses', tag: 'Expenses', summary: 'List expenses', auth: 'member', org: true, rate: '120/min', query: [['page', 'integer'], ['limit', 'integer'], ['category', 'string'], ['status', 'string'], ['vendor', 'string'], ['dateFrom', 'string'], ['dateTo', 'string'], ['amountMin', 'number'], ['amountMax', 'number']] },
  { method: 'post', path: '/expenses', tag: 'Expenses', summary: 'Create expense (auto-categorized)', auth: 'member', org: true, rate: '60/min', body: { amount: 'number', currency: 'string?', category: 'string?', vendor: 'string?', description: 'string?', rawDescription: 'string?', expenseDate: 'string?', receiptUrl: 'string?', autoCategorize: 'boolean?' } },
  { method: 'get', path: '/expenses/{id}', tag: 'Expenses', summary: 'Get expense', auth: 'member', org: true, params: ['id'], rate: '120/min' },
  { method: 'patch', path: '/expenses/{id}', tag: 'Expenses', summary: 'Update expense', auth: 'manager', org: true, params: ['id'], rate: '60/min', body: { amount: 'number?', category: 'string?', vendor: 'string?', description: 'string?', expense_date: 'string?' } },
  { method: 'post', path: '/expenses/{id}/approve', tag: 'Expenses', summary: 'Approve/reject expense', auth: 'manager', org: true, params: ['id'], rate: '60/min', body: { decision: 'approved|rejected' } },
  { method: 'delete', path: '/expenses/{id}', tag: 'Expenses', summary: 'Delete expense', auth: 'admin', org: true, params: ['id'], rate: '30/min' },

  // Invoices
  { method: 'get', path: '/invoices', tag: 'Invoices', summary: 'List invoices', auth: 'member', org: true, rate: '120/min', query: [['page', 'integer'], ['limit', 'integer'], ['status', 'string'], ['client', 'string'], ['dateFrom', 'string'], ['dateTo', 'string']] },
  { method: 'post', path: '/invoices', tag: 'Invoices', summary: 'Create invoice', auth: 'accountant', org: true, rate: '30/min', body: { clientName: 'string', clientEmail: 'string?', lineItems: '[{description,quantity,unitPrice}]', taxRate: 'number?', currency: 'string?', dueDate: 'string?', notes: 'string?' } },
  { method: 'get', path: '/invoices/{id}', tag: 'Invoices', summary: 'Get invoice', auth: 'member', org: true, params: ['id'], rate: '120/min' },
  { method: 'patch', path: '/invoices/{id}', tag: 'Invoices', summary: 'Update invoice', auth: 'accountant', org: true, params: ['id'], rate: '30/min' },
  { method: 'post', path: '/invoices/{id}/send', tag: 'Invoices', summary: 'Send invoice (emails client)', auth: 'accountant', org: true, params: ['id'], rate: '10/min' },
  { method: 'post', path: '/invoices/{id}/mark-paid', tag: 'Invoices', summary: 'Mark invoice paid', auth: 'accountant', org: true, params: ['id'], rate: '30/min' },
  { method: 'get', path: '/invoices/{id}/pdf', tag: 'Invoices', summary: 'Download invoice PDF', auth: 'member', org: true, params: ['id'], rate: '20/min' },
  { method: 'delete', path: '/invoices/{id}', tag: 'Invoices', summary: 'Delete invoice', auth: 'admin', org: true, params: ['id'], rate: '30/min' },

  // Revenues
  { method: 'get', path: '/revenues', tag: 'Revenues', summary: 'List revenues', auth: 'member', org: true, rate: '120/min', query: [['page', 'integer'], ['limit', 'integer'], ['source', 'string'], ['dateFrom', 'string'], ['dateTo', 'string']] },
  { method: 'post', path: '/revenues', tag: 'Revenues', summary: 'Create revenue', auth: 'accountant', org: true, rate: '60/min', body: { amount: 'number', source: 'string', currency: 'string?', description: 'string?', invoiceId: 'string?', revenueDate: 'string?' } },
  { method: 'get', path: '/revenues/{id}', tag: 'Revenues', summary: 'Get revenue', auth: 'member', org: true, params: ['id'], rate: '120/min' },
  { method: 'patch', path: '/revenues/{id}', tag: 'Revenues', summary: 'Update revenue', auth: 'accountant', org: true, params: ['id'], rate: '60/min' },
  { method: 'delete', path: '/revenues/{id}', tag: 'Revenues', summary: 'Delete revenue', auth: 'admin', org: true, params: ['id'], rate: '30/min' },

  // Reports
  { method: 'get', path: '/reports/pl', tag: 'Reports', summary: 'Profit & Loss', auth: 'accountant', org: true, rate: '20/min', query: [['from', 'string'], ['to', 'string']] },
  { method: 'get', path: '/reports/cashflow', tag: 'Reports', summary: 'Cash-flow statement', auth: 'accountant', org: true, rate: '20/min', query: [['months', 'integer']] },
  { method: 'get', path: '/reports/tax-summary', tag: 'Reports', summary: 'Tax liability estimate', auth: 'accountant', org: true, rate: '10/min', query: [['from', 'string'], ['to', 'string']] },
  { method: 'post', path: '/reports/export', tag: 'Reports', summary: 'Export P&L as CSV', auth: 'accountant', org: true, rate: '10/min' },

  // AI
  { method: 'post', path: '/ai/chat', tag: 'AI', summary: 'Ask the AI CFO', auth: 'member', org: true, rate: '20/min', body: { question: 'string', conversationId: 'string?' } },
  { method: 'get', path: '/ai/chat/history', tag: 'AI', summary: 'Conversation history', auth: 'member', org: true, rate: '30/min' },
  { method: 'post', path: '/ai/categorize', tag: 'AI', summary: 'Categorize a transaction', auth: 'member', org: true, rate: '60/min', body: { rawDescription: 'string' } },
  { method: 'post', path: '/ai/parse-receipt', tag: 'AI', summary: 'Structure receipt OCR text', auth: 'member', org: true, rate: '30/min', body: { rawText: 'string' } },
  { method: 'post', path: '/ai/search', tag: 'AI', summary: 'Natural-language search', auth: 'member', org: true, rate: '20/min', body: { query: 'string' } },
  { method: 'get', path: '/ai/forecast', tag: 'AI', summary: '90-day cash forecast', auth: 'member', org: true, rate: '10/min' },
  { method: 'get', path: '/ai/health-score', tag: 'AI', summary: 'Business health score', auth: 'member', org: true, rate: '5/min' },

  // Billing
  { method: 'get', path: '/billing/plans', tag: 'Billing', summary: 'List public plans', auth: 'none', rate: '60/min' },
  { method: 'get', path: '/billing/usage', tag: 'Billing', summary: 'Current-period usage vs quotas (AI credits, OCR, …)', auth: 'member', org: true, rate: '60/min' },
  { method: 'get', path: '/billing/subscription', tag: 'Billing', summary: 'Current subscription', auth: 'admin', org: true, rate: '30/min' },
  { method: 'post', path: '/billing/subscribe', tag: 'Billing', summary: 'Start Stripe checkout', auth: 'owner', org: true, rate: '5/min', body: { planCode: 'starter|growth|professional|enterprise', interval: 'monthly|annual', successUrl: 'string', cancelUrl: 'string' } },
  { method: 'post', path: '/billing/cancel', tag: 'Billing', summary: 'Cancel subscription', auth: 'owner', org: true, rate: '3/min' },

  // Notifications
  { method: 'get', path: '/notifications', tag: 'Notifications', summary: 'List notifications', auth: 'jwt', rate: '60/min', query: [['unread', 'boolean']] },
  { method: 'post', path: '/notifications/{id}/read', tag: 'Notifications', summary: 'Mark notification read', auth: 'jwt', params: ['id'], rate: '60/min' },

  // Webhooks
  { method: 'post', path: '/webhooks/stripe', tag: 'Webhooks', summary: 'Stripe webhook (signature-verified raw body)', auth: 'none' },
];

const TYPE_MAP: Record<string, { type: string; format?: string }> = {
  string: { type: 'string' },
  number: { type: 'number' },
  integer: { type: 'integer' },
  boolean: { type: 'boolean' },
};

function schemaForBody(body: Record<string, string>) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, spec] of Object.entries(body)) {
    const optional = spec.includes('?');
    const base = spec.replace('?', '').trim();
    const t = base.startsWith('[') || base.includes('[]') ? 'array' : base.split(' ')[0]!;
    properties[key] = TYPE_MAP[t] ?? { type: t === 'array' ? 'array' : 'string', description: base };
    if (!optional) required.push(key);
  }
  return {
    content: {
      'application/json': {
        schema: { type: 'object', properties, ...(required.length ? { required } : {}) },
      },
    },
  };
}

function authDescription(r: RouteDef): string {
  const bits: string[] = [];
  if (r.auth === 'none') bits.push('Public');
  else if (r.auth === 'jwt') bits.push('Requires login');
  else bits.push(`Requires role: ${r.auth}+`);
  if (r.org) bits.push('needs X-Org-Id header');
  if (r.rate) bits.push(`rate ${r.rate}`);
  return bits.join(' · ');
}

function buildPaths() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const r of ROUTES) {
    const parameters: unknown[] = [];
    for (const p of r.params ?? []) {
      parameters.push({ name: p, in: 'path', required: true, schema: { type: 'string', format: 'uuid' } });
    }
    if (r.org) {
      parameters.push({ name: 'X-Org-Id', in: 'header', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Target organization' });
    }
    for (const [name, type, description] of r.query ?? []) {
      parameters.push({ name, in: 'query', required: false, schema: TYPE_MAP[type] ?? { type: 'string' }, description });
    }

    const op: Record<string, unknown> = {
      tags: [r.tag],
      summary: r.summary,
      description: authDescription(r),
      security: r.auth === 'none' ? [] : [{ bearerAuth: [] }, { apiKeyAuth: [] }],
      ...(parameters.length ? { parameters } : {}),
      ...(r.body ? { requestBody: schemaForBody(r.body) } : {}),
      responses: {
        '200': { description: 'Success' },
        '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
      },
    };
    paths[r.path] ??= {};
    paths[r.path]![r.method] = op;
  }
  return paths;
}

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'FinanceAI API',
    version: '0.1.0',
    description:
      'AI-powered accounting SaaS backend. Authenticate with a Bearer token (from /auth/login), ' +
      'and for org-scoped routes send your organization id in the `X-Org-Id` header. ' +
      'Click **Authorize** to set both, then use **Try it out** on any endpoint.',
  },
  servers: [{ url: '/api/v1', description: 'This server' }],
  tags: [
    'Auth', 'Organizations', 'API Keys', 'Dashboard', 'Expenses', 'Invoices', 'Revenues',
    'Reports', 'AI', 'Billing', 'Notifications', 'Webhooks',
  ].map((name) => ({ name })),
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Programmatic access. Send your key (sbl_…) here, or as `Authorization: Bearer sbl_…`. The key is bound to one organization, so no X-Org-Id is needed.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: buildPaths(),
};
