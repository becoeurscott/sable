// ─────────────────────────────────────────────────────────────────────────────
// FinanceAI API client — the single place the frontend talks to the backend.
// Attaches the JWT (Bearer) and the active tenant (X-Org-Id), transparently
// refreshes an expired access token, and normalizes errors. Endpoint wrappers
// and view-model mappers (backend shape → the UI types in data.ts) live here.
// ─────────────────────────────────────────────────────────────────────────────
import { API_BASE } from "./config";
import { supabase } from "./supabase";
import {
  getToken,
  getOrgId,
  getRefreshToken,
  setTokens,
  clearSession,
} from "./session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Options {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach Bearer token (default true)
  org?: boolean; // attach X-Org-Id (default true)
}

async function raw(path: string, opts: Options): Promise<Response> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  if (opts.org !== false) {
    const o = getOrgId();
    if (o) headers["X-Org-Id"] = o;
  }
  return fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    // Supabase mode: let supabase-js refresh the session, then re-store the token.
    if (supabase) {
      const { data } = await supabase.auth.refreshSession();
      const session = data.session ?? (await supabase.auth.getSession()).data.session;
      if (!session) {
        clearSession();
        return false;
      }
      setTokens(session.access_token, session.refresh_token ?? "");
      return true;
    }
    // Backend mode: rotate via /auth/refresh.
    const rt = getRefreshToken();
    if (!rt) return false;
    const res = await raw("/auth/refresh", {
      method: "POST",
      body: { refreshToken: rt },
      auth: false,
      org: false,
    });
    if (!res.ok) {
      clearSession();
      return false;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  })();
  const out = await refreshing;
  refreshing = null;
  return out;
}

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  let res = await raw(path, opts);
  if (res.status === 401 && opts.auth !== false && (supabase || getRefreshToken())) {
    if (await tryRefresh()) res = await raw(path, opts);
  }
  if (res.status === 204) return null as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? "error", err.message ?? "Request failed", err.details);
  }
  return data as T;
}

const http = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown, o?: Options) => request<T>(p, { ...o, method: "POST", body }),
  patch: <T>(p: string, body?: unknown) => request<T>(p, { method: "PATCH", body }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};

// ── Backend row types (subset of fields we use) ──────────────────────────────
export interface BackendUser {
  id: string;
  email: string;
  full_name: string | null;
}
interface AuthResponse {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface BackendOrg {
  id: string;
  name: string;
  slug: string;
  currency: string;
  role?: string;
}
interface ExpenseRow {
  id: string;
  amount: string;
  category: string;
  vendor: string | null;
  description: string | null;
  raw_description: string | null;
  expense_date: string;
  ai_confidence: string | null;
}
interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  total: string;
  status: string;
  due_date: string | null;
}
interface DashboardKpis {
  total_revenue: string;
  total_expenses: string;
  net_profit: number;
  outstanding: string;
  invoice_count: number;
  expense_count: number;
  overdue_count: number;
}

// ── View models (match the UI types in data.ts, extended with backend ids) ───
export interface InvoiceView {
  id: string; // display id = invoice_number
  backendId: string;
  client: string;
  amount: number;
  status: string; // Title-cased for the UI badge logic
  due: string;
}
export interface ExpenseView {
  backendId: string;
  raw: string;
  vendor: string;
  cat: string;
  amount: number;
  date: string;
}
export interface KpiView {
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
}
export interface ReceiptData {
  vendor: string | null;
  date: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  total: number | null;
  currency: string;
  receiptType: string;
  lineItems: { description: string; amount: number }[];
  source: "gemma" | "heuristic";
}

// ── Formatting helpers ───────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}
function money(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Mappers ──────────────────────────────────────────────────────────────────
function mapInvoice(r: InvoiceRow): InvoiceView {
  return {
    id: r.invoice_number,
    backendId: r.id,
    client: r.client_name,
    amount: Number(r.total),
    status: title(r.status),
    due: r.status === "paid" ? "Paid" : fmtDate(r.due_date),
  };
}
function mapExpense(r: ExpenseRow): ExpenseView {
  return {
    backendId: r.id,
    raw: r.raw_description || r.description || r.vendor || r.category,
    vendor: r.vendor || r.description || "—",
    cat: r.category,
    amount: Number(r.amount),
    date: fmtDate(r.expense_date),
  };
}
function mapKpis(k: DashboardKpis): KpiView[] {
  const net = k.net_profit;
  return [
    { label: "Revenue (YTD)", value: money(Number(k.total_revenue)), delta: `${k.invoice_count} invoices`, deltaColor: "#0E9F6E" },
    { label: "Expenses (YTD)", value: money(Number(k.total_expenses)), delta: `${k.expense_count} logged`, deltaColor: "#8A93A3" },
    { label: "Net profit", value: money(net), delta: net >= 0 ? "In the black" : "Running at a loss", deltaColor: net >= 0 ? "#0E9F6E" : "#D64545" },
    { label: "Outstanding", value: money(Number(k.outstanding)), delta: `${k.overdue_count} overdue`, deltaColor: k.overdue_count > 0 ? "#D64545" : "#8A93A3" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API surface — grouped by resource (mirrors §10 of the blueprint).
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (email: string, password: string, fullName?: string) =>
    http.post<AuthResponse>("/auth/signup", { email, password, fullName }, { auth: false, org: false }),
  login: (email: string, password: string) =>
    http.post<AuthResponse>("/auth/login", { email, password }, { auth: false, org: false }),
  me: () => http.get<{ user: BackendUser }>("/auth/me"),
  logout: (refreshToken: string) => http.post<null>("/auth/logout", { refreshToken }),
};

export interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string | null;
  joined_at: string;
}

export interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;
  role: string;
  readOnly: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export const apiKeysApi = {
  list: (orgId: string) => http.get<{ apiKeys: ApiKeyView[] }>(`/organizations/${orgId}/api-keys`),
  create: (orgId: string, body: { name: string; role: string; readOnly: boolean }) =>
    http.post<{ key: string; apiKey: ApiKeyView }>(`/organizations/${orgId}/api-keys`, body),
  revoke: (orgId: string, keyId: string) => http.del<null>(`/organizations/${orgId}/api-keys/${keyId}`),
};

export const orgApi = {
  listMine: () => http.get<{ organizations: BackendOrg[] }>("/organizations"),
  create: (name: string, currency = "USD") =>
    http.post<{ organization: BackendOrg }>("/organizations", { name, currency }, { org: false }),
  get: (orgId: string) =>
    http.get<{ organization: BackendOrg & { chart_of_accounts: string[]; country: string | null } }>(
      `/organizations/${orgId}`,
    ),
  update: (orgId: string, patch: Record<string, unknown>) =>
    http.patch<{ organization: BackendOrg }>(`/organizations/${orgId}`, patch),
  members: (orgId: string) => http.get<{ members: MemberRow[] }>(`/organizations/${orgId}/members`),
  invite: (orgId: string, email: string, role: string) =>
    http.post<{ membership: MemberRow }>(`/organizations/${orgId}/invite`, { email, role }),
  removeMember: (orgId: string, userId: string) =>
    http.del<null>(`/organizations/${orgId}/members/${userId}`),
};

export interface ExpenseFilters {
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const expensesApi = {
  async list(filters: ExpenseFilters = {}): Promise<ExpenseView[]> {
    const res = await http.get<{ data: ExpenseRow[] }>(`/expenses${qs({ limit: 100, ...filters })}`);
    return res.data.map(mapExpense);
  },
  async create(input: {
    amount: number;
    rawDescription?: string;
    vendor?: string;
    category?: string;
    description?: string;
    expenseDate?: string;
  }) {
    const res = await http.post<{ expense: ExpenseRow }>("/expenses", input);
    return mapExpense(res.expense);
  },
};

// ── Revenues (§10 /revenues, §11 /app/revenue) ───────────────────────────────
interface RevenueRow {
  id: string;
  amount: string;
  source: string;
  description: string | null;
  revenue_date: string;
}
export interface RevenueView {
  id: string;
  source: string;
  description: string;
  amount: number;
  date: string;
}
function mapRevenue(r: RevenueRow): RevenueView {
  return {
    id: r.id,
    source: r.source,
    description: r.description || "—",
    amount: Number(r.amount),
    date: fmtDate(r.revenue_date),
  };
}
export const revenuesApi = {
  async list(): Promise<RevenueView[]> {
    const res = await http.get<{ data: RevenueRow[] }>("/revenues?limit=100");
    return res.data.map(mapRevenue);
  },
  async create(input: { amount: number; source: string; description?: string; revenueDate?: string }) {
    const res = await http.post<{ revenue: RevenueRow }>("/revenues", input);
    return mapRevenue(res.revenue);
  },
};

// ── Notifications (§10 /notifications) ───────────────────────────────────────
export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}
export const notificationsApi = {
  list: () => http.get<{ notifications: NotificationRow[] }>("/notifications"),
  read: (id: string) => http.post<null>(`/notifications/${id}/read`),
};

export const invoicesApi = {
  async list(): Promise<InvoiceView[]> {
    const res = await http.get<{ data: InvoiceRow[] }>("/invoices?limit=100");
    return res.data.map(mapInvoice);
  },
  async create(input: {
    clientName: string;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    taxRate?: number;
  }) {
    const res = await http.post<{ invoice: InvoiceRow }>("/invoices", input);
    return mapInvoice(res.invoice);
  },
  send: (backendId: string) => http.post<{ invoice: InvoiceRow }>(`/invoices/${backendId}/send`),
  markPaid: (backendId: string) => http.post<{ invoice: InvoiceRow }>(`/invoices/${backendId}/mark-paid`),
};

export const dashboardApi = {
  async kpis(): Promise<KpiView[]> {
    const res = await http.get<{ kpis: DashboardKpis }>("/dashboard");
    return mapKpis(res.kpis);
  },
  cashflow: () => http.get<{ series: { month: string; revenue: string; expenses: string }[] }>("/dashboard/cashflow?months=6"),
};

export const reportsApi = {
  pl: (from?: string, to?: string) =>
    http.get<{
      revenue: number;
      expenses: number;
      netProfit: number;
      expensesByCategory: { category: string; total: number }[];
    }>(`/reports/pl${qs({ from, to })}`),
  async exportCsv(): Promise<Blob> {
    let res = await raw("/reports/export", { method: "POST" });
    if (res.status === 401 && getRefreshToken() && (await tryRefresh())) {
      res = await raw("/reports/export", { method: "POST" });
    }
    if (!res.ok) throw new ApiError(res.status, "error", "Export failed");
    return res.blob();
  },
};

export const aiApi = {
  async chat(question: string, conversationId?: string) {
    return http.post<{ conversationId: string; answer: string }>("/ai/chat", { question, conversationId });
  },
  async categorize(rawDescription: string) {
    return http.post<{ result: { category: string; cleanName: string; confidence: string } }>(
      "/ai/categorize",
      { rawDescription },
    );
  },
  parseReceipt: (rawText: string) =>
    http.post<{ receipt: ReceiptData }>("/ai/parse-receipt", { rawText }),
  healthScore: () =>
    http.get<{ health: { score: number; grade: string; narrative: string } }>("/ai/health-score"),
  search: (query: string) =>
    http.post<{
      table: string;
      interpreted: unknown;
      total: number;
      results: Record<string, unknown>[];
    }>("/ai/search", { query }),
  forecast: () =>
    http.get<{
      forecast: {
        averageMonthlyNet: number;
        trend: string;
        projection: { month: string; projectedNet: number }[];
        note: string;
      };
    }>("/ai/forecast"),
};

export interface UsageMetric {
  used: number;
  limit: number | null;
  remaining: number | null;
  pct: number;
  nearLimit: boolean;
}
export interface UsageSummary {
  period: string;
  plan: { code: string; name: string } | null;
  metrics: Record<string, UsageMetric>;
  aiCreditCosts: Record<string, number>;
}

export const billingApi = {
  plans: () => http.get<{ plans: { id: string; code: string; name: string; price_monthly: number; quotas: Record<string, number | null> }[] }>("/billing/plans"),
  subscription: () =>
    http.get<{ subscription: { status: string; plan_id: string | null; current_period_end: string | null } }>(
      "/billing/subscription",
    ),
  usage: () => http.get<UsageSummary>("/billing/usage"),
};
