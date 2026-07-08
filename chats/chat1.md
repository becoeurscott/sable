# Design and promotional strategy

_Started 2026-07-07 19:38 UTC_

---

## User

i want to build this but i need i design that will sell with me promoting it with all posible page and who it will function

## Assistant

I'll start by reading your plan document so I understand what you're building.

_[tool: read_skill_prompt]_

_[tool: list_files]_

_[tool: run_script]_

I'll try reading it page by page to avoid the timeout.

_[tool: run_script]_

37 pages — let me read the whole plan in chunks.

_[tool: run_script]_

I've read your FinanceAI plan — it's a detailed 30-day MVP blueprint for an AI-powered accounting SaaS (AI CFO, receipt OCR, cash-flow forecasting, 5-tier pricing, launch strategy). Before I design, a few questions so this sells the way you want it to.

_[tool: questions_v2]_

## User

Questions answered:
- scope: Marketing landing page (the sales pitch), Product UI screens (dashboard, invoices, AI CFO, etc.), Interactive clickable prototype, Explore a few options, Pricing page, Decide for me
- product_screens: Dashboard / KPI overview, Invoices (create + send), Cash-flow forecast & reports, Billing & subscription, Onboarding / signup flow, Expenses + receipt OCR, AI CFO chat (natural-language queries)
- audience: Small businesses (1–50 staff)
- vibe: Modern fintech — clean, trustworthy, blue/dark
- name: Decide for me
- variations: Just one, make it great
- promo: Product Hunt launch, Waitlist / beta signup
- emphasis: The AI CFO magic (wow factor)
- extra: built all the possible pages

## Assistant

Got it — one polished modern-fintech direction covering the full thing: marketing landing + pricing, and a clickable product prototype (dashboard, AI CFO chat, invoices, expenses/OCR, forecast/reports, onboarding, billing). I'll name it **Sable — "your AI CFO"** (clean, premium, sells well on Product Hunt).

Let me grab the prototype recipe and lay out a plan.

_[tool: read_skill_prompt]_

_[tool: update_todos]_

_[tool: dc_write]_

Design system locked in. Building **Sable** — modern fintech, deep navy + electric blue with an indigo AI accent, Space Grotesk display + IBM Plex Sans/Mono. Starting with the shell, router logic, and the landing page.I left a garbled style in the footer — fixing that, then I'll check the landing page.

_[tool: dc_html_str_replace]_

_[tool: show_html]_

Landing is up. Now the pricing page — replacing its placeholder.

_[tool: dc_html_str_replace]_

Now the pricing data + toggle logic in the class.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the `buildPlans` helper method:

_[tool: dc_js_str_replace]_

App shell + Dashboard + AI CFO chat next. Replacing the app placeholder.

_[tool: dc_html_str_replace]_

Now the app handlers and data. Adding navigation handlers:

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Dashboard and CFO chat are wired. Now the Invoices screen.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

Now the Expenses screen with receipt OCR simulation.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

Now the Reports screen (forecast + P&L + AI narrative).

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

Now Billing screen, then the onboarding flow.

_[tool: dc_js_str_replace]_

Finally the onboarding flow.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

All screens built — marketing landing, pricing, dashboard, AI CFO chat, invoices, expenses/OCR, reports, billing, and onboarding. Let me verify.

_[tool: update_todos]_

Let me spot-check a few screens before handing off — landing, then the app.

_[tool: show_html]_

Landing looks sharp. Let me check the app dashboard and the CFO chat interaction.

_[tool: multi_screenshot]_

Clicks didn't match. Let me navigate via "Sign in" (goes to dashboard) and check the app.

_[tool: multi_screenshot]_

Dashboard is excellent. Let me confirm the AI CFO chat and expenses OCR navigate and interact.

_[tool: multi_screenshot]_

The nav handlers work (Sign-in reached the app); my test selector was just grabbing the wrong element. Let me target precisely.

_[tool: multi_screenshot]_

_[tool: show_html]_

_[tool: multi_screenshot]_

Everything works — the AI CFO chat answers live, and the receipt OCR extracts and files a Figma expense. Let me add a small tweak control (where the demo opens) and hand off.

_[tool: dc_js_str_replace]_

_[tool: dc_set_props]_

Everything's built and interactive. Handing off for verification.

_[tool: ready_for_verification]_

