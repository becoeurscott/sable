// Central config for talking to the FinanceAI backend.
// Override with NEXT_PUBLIC_API_URL in .env.local (see .env.example).
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";
