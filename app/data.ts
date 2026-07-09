// Static content ported verbatim from the Sable prototype (Sable.dc.html).

export type Feature = { icon: string; title: string; body: string };
export const features: Feature[] = [
  { icon: "🧹", title: "Auto-categorization", body: "Turns 'AMZN MKTP US*ZA39X' into clean, tagged expenses. Gemma learns your chart of accounts." },
  { icon: "💬", title: "Ask in plain English", body: '"Show my net profit from last month." No menus, no filters — just answers with charts.' },
  { icon: "📸", title: "Receipt OCR", body: "Snap a photo. Sable extracts vendor, tax, total and files it to the right category instantly." },
  { icon: "📈", title: "Cash-flow forecast", body: '90-day forecast in plain language: "Expect a cash dip in week 3 of August."' },
  { icon: "🛡️", title: "Anomaly & fraud alerts", body: "Spots duplicate charges, unusual vendors, and out-of-pattern spend before you do." },
  { icon: "📊", title: "Investor-ready reports", body: "P&L, cash flow, and burn/runway — export-ready in one click for your next board update." },
];

export type Step = { n: string; title: string; body: string };
export const steps: Step[] = [
  { n: "01", title: "Connect your bank", body: "Secure Plaid sync pulls in transactions. Or import a CSV — setup takes 5 minutes." },
  { n: "02", title: "Let the AI work", body: "Gemma categorizes every transaction, builds your ledger, and drafts your reports automatically." },
  { n: "03", title: "Ask anything", body: "Chat with your CFO about profit, runway, and hiring. Get clear answers, not spreadsheets." },
];

export type CompareRow = { label: string; sable: string; qb: string; xero: string; bg: string };
export const compare: CompareRow[] = [
  { label: "AI CFO assistant", sable: "Native", qb: "—", xero: "—", bg: "#fff" },
  { label: "Natural-language queries", sable: "Included", qb: "—", xero: "—", bg: "#FAFBFD" },
  { label: "Receipt OCR", sable: "Built-in", qb: "Add-on", xero: "Add-on", bg: "#fff" },
  { label: "Cash-flow forecast", sable: "AI", qb: "Basic", xero: "Basic", bg: "#FAFBFD" },
  { label: "Setup time", sable: "5 min", qb: "Hours", xero: "Hours", bg: "#fff" },
  { label: "Starting price", sable: "$0", qb: "$30", xero: "$13", bg: "#FAFBFD" },
];

export type Stat = { v: string; l: string };
export const stats: Stat[] = [
  { v: "10 hrs", l: "saved per week on bookkeeping" },
  { v: "5 min", l: "from signup to first insight" },
  { v: "$0", l: "free tier, live forever" },
  { v: "2,400+", l: "founders on the waitlist" },
];

// ---- Pricing ----
export type Plan = {
  name: string;
  tagline: string;
  price: string;
  per: string;
  billed: string;
  cta: string;
  popular: boolean;
  feats: string[];
  nameColor: string;
  subColor: string;
  priceColor: string;
  featColor: string;
  checkColor: string;
  cardBg: string;
  border: string;
  shadow: string;
  btnBg: string;
  btnColor: string;
  btnBorder: string;
};

export function buildPlans(annual: boolean): Plan[] {
  const grey = {
    nameColor: "#0B1220",
    subColor: "#8A93A3",
    priceColor: "#0B1220",
    featColor: "#4A5566",
    checkColor: "#2F6BFF",
    cardBg: "#fff",
    border: "1px solid #E7ECF4",
    shadow: "none",
  };
  return [
    { ...grey, name: "Free Trial", tagline: "Kick the tires, no card.", price: "$0", per: "", billed: "14-day full access", cta: "Start free", btnBg: "#F0F3F9", btnColor: "#0B1220", btnBorder: "1px solid #E4E9F2", popular: false,
      feats: ["1 user", "5 invoices/mo", "20 expenses/mo", "50 AI credits", "Basic reports"] },
    { ...grey, name: "Starter", tagline: "For freelancers & solo founders.", price: annual ? "$15" : "$19", per: "/mo", billed: annual ? "billed annually" : "billed monthly", cta: "Choose Starter", btnBg: "#F0F3F9", btnColor: "#0B1220", btnBorder: "1px solid #E4E9F2", popular: false,
      feats: ["1 user", "50 invoices/mo", "500 AI credits", "Receipt OCR (50/mo)", "Email support"] },
    { name: "Growth", tagline: "For small teams scaling up.", price: annual ? "$39" : "$49", per: "/mo", billed: annual ? "billed annually" : "billed monthly", cta: "Choose Growth", popular: true,
      nameColor: "#fff", subColor: "#9AA6BC", priceColor: "#fff", featColor: "#C9D3E6", checkColor: "#6D9CFF",
      cardBg: "linear-gradient(165deg,#0F1830,#0A1020)", border: "1px solid #2A3A5E", shadow: "0 24px 50px -18px rgba(11,16,32,.5)",
      btnBg: "linear-gradient(135deg,#2F6BFF,#6D5EF6)", btnColor: "#fff", btnBorder: "none",
      feats: ["3 users", "Unlimited invoices", "2,000 AI credits", "Advanced AI CFO chat", "3-month cash forecast", "Full API access"] },
    { ...grey, name: "Professional", tagline: "For growing businesses.", price: annual ? "$79" : "$99", per: "/mo", billed: annual ? "billed annually" : "billed monthly", cta: "Choose Pro", btnBg: "#F0F3F9", btnColor: "#0B1220", btnBorder: "1px solid #E4E9F2", popular: false,
      feats: ["10 users", "Unlimited OCR", "10,000 AI credits", "12-month AI forecast", "Fraud detection", "Approvals + phone support"] },
    { ...grey, name: "Enterprise", tagline: "For accountants & 50+ staff.", price: "Custom", per: "", billed: "annual contract", cta: "Talk to sales", btnBg: "#0B1220", btnColor: "#fff", btnBorder: "none", popular: false,
      feats: ["Unlimited seats", "White-label mode", "SSO + dedicated CSM", "Custom ML fraud", "Dedicated AI training"] },
  ];
}

export type Addon = { name: string; price: string; desc: string };
export const addons: Addon[] = [
  { name: "Extra AI credits", price: "$19/mo", desc: "+5,000 credits for heavy AI users hitting their monthly quota." },
  { name: "OCR pack", price: "$29/mo", desc: "Scan 1,000 receipts/mo — for expense-heavy businesses." },
  { name: "Payroll module", price: "$39/mo", desc: "Basic payroll runs, tax withholding, and pay slips. +$4/employee." },
  { name: "Tax filing automation", price: "$49/mo", desc: "Auto-generate returns and connect to tax APIs." },
  { name: "White-label mode", price: "$199/mo", desc: "Custom branding for accountant firms serving clients." },
  { name: "Advanced integrations", price: "$29/mo", desc: "Stripe, Shopify, PayPal, and Plaid bank sync." },
];

export type Faq = { q: string; a: string };
export const faqs: Faq[] = [
  { q: "Is my financial data secure?", a: "Yes. Data is encrypted in transit and at rest, isolated per organization with row-level security. Gemma can run on private infrastructure so your numbers never leave your control." },
  { q: "Do I need an accountant to use Sable?", a: "No. Sable is built for founders, not accountants. The AI CFO handles categorization and reporting — though your accountant can join with white-label access anytime." },
  { q: "What happens when I hit my AI credit limit?", a: "You can top up instantly or upgrade. Core accounting always keeps working — AI credits only gate the assistant features." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts. The free tier stays live forever, so you can downgrade instead of losing your data." },
];

// ---- Dashboard ----
export type Kpi = { label: string; value: string; delta: string; deltaColor: string };
export const kpis: Kpi[] = [
  { label: "Revenue (MTD)", value: "$52,900", delta: "↑ 8% vs last month", deltaColor: "#0E9F6E" },
  { label: "Expenses (MTD)", value: "$34,480", delta: "↓ 3% vs last month", deltaColor: "#0E9F6E" },
  { label: "Net profit", value: "$18,420", delta: "↑ 12% vs last month", deltaColor: "#0E9F6E" },
  { label: "Cash runway", value: "14.2 mo", delta: "$443K in the bank", deltaColor: "#8A93A3" },
];

export type ChartBar = { m: string; rev: string; exp: string };
export const chartBars: ChartBar[] = [
  { m: "Feb", rev: "52%", exp: "40%" }, { m: "Mar", rev: "64%", exp: "46%" },
  { m: "Apr", rev: "58%", exp: "44%" }, { m: "May", rev: "78%", exp: "58%" },
  { m: "Jun", rev: "88%", exp: "60%" }, { m: "Jul", rev: "96%", exp: "62%" },
];

export type RecentTx = { icon: string; name: string; cat: string; amt: string; color: string };
export const recentTx: RecentTx[] = [
  { icon: "💳", name: "Stripe payout", cat: "Revenue · Jul 6", amt: "+$4,800", color: "#0E9F6E" },
  { icon: "🎨", name: "Adobe Systems", cat: "Software · Jul 2", amt: "−$54.99", color: "#0B1220" },
  { icon: "☕", name: "The Coffee Bean", cat: "Meals · Jul 1", amt: "−$18.40", color: "#0B1220" },
  { icon: "📦", name: "Amazon", cat: "Office · Jun 30", amt: "−$132.10", color: "#0B1220" },
];

export type Outstanding = { client: string; id: string; due: string; status: string; amt: string; badgeBg: string; badgeColor: string };
export const outstanding: Outstanding[] = [
  { client: "Palette Studio", id: "INV-1040", due: "Jun 15", status: "Overdue", amt: "$6,500", badgeBg: "#FEECEC", badgeColor: "#D64545" },
  { client: "Basecamp42", id: "INV-1041", due: "Jul 12", status: "Sent", amt: "$2,200", badgeBg: "#EEF3FF", badgeColor: "#2F6BFF" },
  { client: "Lumen & Co", id: "INV-1042", due: "Paid", status: "Paid", amt: "$4,800", badgeBg: "#E9F7F0", badgeColor: "#0E9F6E" },
];

// ---- CFO chat ----
export const chatAnswers: Record<string, string> = {
  "What was my net profit last month?": "Your net profit in June was **$18,420** — up 12% vs May. Revenue held at $52,900 while expenses fell to $34,480. Your strongest month this quarter.",
  "How long is my cash runway?": "At your current burn of **$31,200/mo** and $443K in the bank, you have **14.2 months** of runway. If you close the two overdue invoices, that extends to 15.1 months.",
  "Which expenses grew the most?": "Software subscriptions grew **+38%** ($1,240 → $1,710) — mostly new AI tools. Travel is up 22%. I flagged a duplicate $99 charge from 'Notion' on Jun 18 — want me to dispute it?",
  "Can I afford to hire a designer?": "A $6,500/mo designer would raise burn to ~$37,700 and cut runway to **11.8 months**. Affordable if you keep revenue flat — but I'd close the $6,500 Palette invoice first to stay above 12 months.",
};
export const suggestedQuestions = Object.keys(chatAnswers);
export const chatFallback =
  "I looked across your ledger — everything's reconciled and I don't see any anomalies this period. Ask me about profit, runway, expenses, or hiring.";

// ---- Invoices ----
export type Invoice = { id: string; client: string; amount: number; status: string; due: string };
export const initialInvoices: Invoice[] = [
  { id: "INV-1042", client: "Lumen & Co", amount: 4800, status: "Paid", due: "Jun 28" },
  { id: "INV-1041", client: "Basecamp42", amount: 2200, status: "Sent", due: "Jul 12" },
  { id: "INV-1040", client: "Palette Studio", amount: 6500, status: "Overdue", due: "Jun 15" },
  { id: "INV-1039", client: "Frameworq", amount: 1800, status: "Paid", due: "Jun 10" },
];

// ---- Expenses ----
export type Expense = { raw: string; vendor: string; cat: string; amount: number; date: string };
export const initialExpenses: Expense[] = [
  { raw: "ADOBE *SYSTEMS INC", vendor: "Adobe", cat: "Software", amount: 54.99, date: "Jul 2" },
  { raw: "SQ *COFFEEBEAN 04-291", vendor: "The Coffee Bean", cat: "Meals", amount: 18.40, date: "Jul 1" },
  { raw: "AMZN MKTP US*ZA39X", vendor: "Amazon", cat: "Office Supplies", amount: 132.10, date: "Jun 30" },
  { raw: "UBER *TRIP HELP.UBER", vendor: "Uber", cat: "Travel", amount: 27.65, date: "Jun 29" },
];

export type CatBreakdown = { name: string; amt: string; pct: string; color: string };
export const catBreakdown: CatBreakdown[] = [
  { name: "Software", amt: "$1,710", pct: "82%", color: "#2F6BFF" },
  { name: "Travel", amt: "$980", pct: "47%", color: "#6D5EF6" },
  { name: "Office supplies", amt: "$640", pct: "31%", color: "#5A87FF" },
  { name: "Meals", amt: "$420", pct: "20%", color: "#A6B7FF" },
];

// ---- Reports ----
export type ForecastBar = { w: string; h: string; top: string; bottom: string };
export const forecastBars: ForecastBar[] = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"].map((w, i) => {
  const heights = [58, 62, 66, 61, 68, 72, 70, 55, 60, 74, 82, 90];
  const dip = i === 6; // week ~3 of Aug dip visual
  return { w, h: (dip ? 46 : heights[i]) + "%", top: dip ? "#F0A34A" : "#5A87FF", bottom: dip ? "#E5843A" : "#2F6BFF" };
});

export type PlRow = { label: string; value: string; weight: number; labelColor: string; valColor: string; border: string };
export const plRows: PlRow[] = [
  { label: "Revenue", value: "$52,900", weight: 500, labelColor: "#0B1220", valColor: "#0B1220", border: "#F1F4F9" },
  { label: "Cost of goods sold", value: "−$8,200", weight: 400, labelColor: "#5A6472", valColor: "#5A6472", border: "#F1F4F9" },
  { label: "Gross profit", value: "$44,700", weight: 600, labelColor: "#0B1220", valColor: "#0B1220", border: "#F1F4F9" },
  { label: "Operating expenses", value: "−$26,280", weight: 400, labelColor: "#5A6472", valColor: "#5A6472", border: "#F1F4F9" },
  { label: "Net profit", value: "$18,420", weight: 700, labelColor: "#0E9F6E", valColor: "#0E9F6E", border: "transparent" },
];

// ---- Billing ----
export type Usage = { label: string; used: string; pct: string; color: string; note: string };
export const usage: Usage[] = [
  { label: "AI credits", used: "1,240 / 2,000", pct: "62%", color: "linear-gradient(90deg,#2F6BFF,#6D5EF6)", note: "760 remaining" },
  { label: "Receipt OCR", used: "184 / 500", pct: "37%", color: "#2F6BFF", note: "316 scans left" },
  { label: "Storage", used: "3.1 / 10 GB", pct: "31%", color: "#6D5EF6", note: "6.9 GB free" },
];

export type Receipt = { date: string; desc: string; amt: string };
export const receipts: Receipt[] = [
  { date: "Jan 3, 2026", desc: "Growth · annual", amt: "$468.00" },
  { date: "Jan 3, 2025", desc: "Growth · annual", amt: "$468.00" },
  { date: "Dec 3, 2024", desc: "Starter · monthly", amt: "$19.00" },
];

// ---- App nav ----
export type NavItem = { label: string; icon: string; href: string };
export const appNav: NavItem[] = [
  { label: "Dashboard", icon: "◫", href: "/app/dashboard" },
  { label: "AI CFO", icon: "✦", href: "/app/cfo" },
  { label: "Invoices", icon: "❐", href: "/app/invoices" },
  { label: "Expenses", icon: "⊟", href: "/app/expenses" },
  { label: "Reports", icon: "◱", href: "/app/reports" },
  { label: "Billing", icon: "◎", href: "/app/billing" },
];

export const appMeta: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Wednesday, July 7 · Northwind Studio" },
  cfo: { title: "AI CFO", sub: "Your financial co-pilot, powered by Gemma" },
  invoices: { title: "Invoices", sub: "Create, send and track invoices" },
  expenses: { title: "Expenses", sub: "Auto-categorized by your AI CFO" },
  reports: { title: "Reports", sub: "P&L, cash flow and runway" },
  billing: { title: "Billing & plan", sub: "Manage your subscription and usage" },
};

// ---- Onboarding ----
export type UseCase = { icon: string; title: string; sub: string; k: string };
export const obUseCases: UseCase[] = [
  { icon: "🧑‍💻", title: "Freelancer / solo", sub: "Invoicing, expenses, tax prep", k: "solo" },
  { icon: "🏢", title: "Small business", sub: "1–50 staff, multi-user", k: "smb" },
  { icon: "🚀", title: "Startup", sub: "Burn rate & runway tracking", k: "startup" },
  { icon: "📊", title: "Accountant", sub: "Manage multiple clients", k: "acct" },
];

export type Bank = { name: string; color: string };
export const obBanks: Bank[] = [
  { name: "Chase", color: "#1560C4" }, { name: "Bank of America", color: "#C4262E" },
  { name: "Wells Fargo", color: "#D6A400" }, { name: "Mercury", color: "#5A3FE0" },
];

export const obNextLabels = ["Continue", "Continue", "Connect & continue", "Enter Sable →"];
