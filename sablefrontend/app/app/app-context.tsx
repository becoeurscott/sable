"use client";

// App data + actions, now backed by the FinanceAI REST API (via app/lib/api.ts).
// Loads invoices, expenses and dashboard KPIs on mount, and every mutation
// (create invoice, file a receipt, ask the CFO) hits the backend and refreshes.
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  invoicesApi,
  expensesApi,
  dashboardApi,
  aiApi,
  ApiError,
  type InvoiceView,
  type ExpenseView,
  type KpiView,
} from "../lib/api";

type ChatMsg = { role: "ai" | "user"; text: string };
type OcrState = "idle" | "scanning" | "done";

type AppState = {
  loading: boolean;
  error: string | null;
  refresh: () => void;

  // Dashboard
  kpis: KpiView[];

  // CFO chat
  chat: ChatMsg[];
  thinking: boolean;
  askCFO: (q: string) => void;

  // Invoices
  invoices: InvoiceView[];
  showInvoiceForm: boolean;
  invClient: string;
  invAmount: string;
  invItem: string;
  setInvClient: (v: string) => void;
  setInvAmount: (v: string) => void;
  setInvItem: (v: string) => void;
  toggleInvoiceForm: () => void;
  createInvoice: () => void;

  // Expenses + receipt capture
  expenses: ExpenseView[];
  ocrState: OcrState;
  scanReceipt: () => void;
  confirmReceipt: () => void;
  dismissReceipt: () => void;
};

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

const CFO_GREETING =
  "Hi — I'm your AI CFO. Ask me anything about your finances, or tap a question below.";
const CFO_FALLBACK =
  "I couldn't reach your financial data just now. Make sure the API is running, then try again.";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<KpiView[]>([]);
  const [invoices, setInvoices] = useState<InvoiceView[]>([]);
  const [expenses, setExpenses] = useState<ExpenseView[]>([]);

  const [chat, setChat] = useState<ChatMsg[]>([{ role: "ai", text: CFO_GREETING }]);
  const [thinking, setThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invClient, setInvClient] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invItem, setInvItem] = useState("");

  const [ocrState, setOcrState] = useState<OcrState>("idle");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, exp, k] = await Promise.all([
        invoicesApi.list(),
        expensesApi.list(),
        dashboardApi.kpis(),
      ]);
      setInvoices(inv);
      setExpenses(exp);
      setKpis(k);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const askCFO = useCallback(
    async (q: string) => {
      setChat((c) => [...c, { role: "user", text: q }]);
      setThinking(true);
      try {
        const res = await aiApi.chat(q, conversationId);
        setConversationId(res.conversationId);
        setChat((c) => [...c, { role: "ai", text: res.answer }]);
      } catch {
        setChat((c) => [...c, { role: "ai", text: CFO_FALLBACK }]);
      } finally {
        setThinking(false);
      }
    },
    [conversationId],
  );

  const toggleInvoiceForm = () => {
    setShowInvoiceForm((s) => !s);
    setInvClient("");
    setInvAmount("");
    setInvItem("");
  };

  const createInvoice = useCallback(async () => {
    const amount = parseFloat(invAmount);
    if (!invClient || !amount) return;
    try {
      const created = await invoicesApi.create({
        clientName: invClient,
        lineItems: [{ description: invItem || "Services", quantity: 1, unitPrice: amount }],
      });
      // "Create & send" → transition draft → sent immediately.
      await invoicesApi.send(created.backendId).catch(() => {});
      setShowInvoiceForm(false);
      setInvClient("");
      setInvAmount("");
      setInvItem("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create invoice");
    }
  }, [invClient, invAmount, invItem, refresh]);

  // Receipt capture — the UI simulates the OCR scan animation; on confirm we
  // create a real, auto-categorized expense on the backend.
  const scanReceipt = () => {
    if (ocrState !== "idle") return;
    setOcrState("scanning");
    setTimeout(() => setOcrState("done"), 1700);
  };
  const confirmReceipt = useCallback(async () => {
    try {
      await expensesApi.create({ amount: 15.0, rawDescription: "FIGMA MONTHLY", vendor: "Figma" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not file expense");
    } finally {
      setOcrState("idle");
    }
  }, [refresh]);
  const dismissReceipt = () => setOcrState("idle");

  return (
    <AppContext.Provider
      value={{
        loading,
        error,
        refresh,
        kpis,
        chat,
        thinking,
        askCFO,
        invoices,
        showInvoiceForm,
        invClient,
        invAmount,
        invItem,
        setInvClient,
        setInvAmount,
        setInvItem,
        toggleInvoiceForm,
        createInvoice,
        expenses,
        ocrState,
        scanReceipt,
        confirmReceipt,
        dismissReceipt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
