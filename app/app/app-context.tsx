"use client";

import { createContext, useContext, useState } from "react";
import {
  Invoice,
  Expense,
  initialInvoices,
  initialExpenses,
  chatAnswers,
  chatFallback,
} from "../data";

type ChatMsg = { role: "ai" | "user"; text: string };
type OcrState = "idle" | "scanning" | "done";
export type ReceiptFile = { name: string; size: number; type: string; url: string } | null;

type AppState = {
  // CFO chat
  chat: ChatMsg[];
  thinking: boolean;
  askCFO: (q: string) => void;

  // Invoices
  invoices: Invoice[];
  showInvoiceForm: boolean;
  invClient: string;
  invAmount: string;
  invItem: string;
  setInvClient: (v: string) => void;
  setInvAmount: (v: string) => void;
  setInvItem: (v: string) => void;
  toggleInvoiceForm: () => void;
  createInvoice: () => void;

  // Expenses OCR
  expenses: Expense[];
  ocrState: OcrState;
  receipt: ReceiptFile;
  uploadReceipt: (file: File) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi — I'm your AI CFO. Ask me anything about your finances, or tap a question below." },
  ]);
  const [thinking, setThinking] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invClient, setInvClient] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invItem, setInvItem] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [receipt, setReceipt] = useState<ReceiptFile>(null);

  const askCFO = (q: string) => {
    const a = chatAnswers[q] || chatFallback;
    setChat((c) => [...c, { role: "user", text: q }]);
    setThinking(true);
    setTimeout(() => {
      setChat((c) => [...c, { role: "ai", text: a }]);
      setThinking(false);
    }, 950);
  };

  const toggleInvoiceForm = () => {
    setShowInvoiceForm((s) => !s);
    setInvClient("");
    setInvAmount("");
    setInvItem("");
  };

  const createInvoice = () => {
    if (!invClient || !invAmount) return;
    setInvoices((s) => [
      { id: "INV-1043", client: invClient, amount: parseFloat(invAmount) || 0, status: "Sent", due: "Jul 30" },
      ...s,
    ]);
    setShowInvoiceForm(false);
    setInvClient("");
    setInvAmount("");
    setInvItem("");
  };

  const clearReceipt = () =>
    setReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });

  const beginScan = () => {
    setOcrState("scanning");
    setTimeout(() => setOcrState("done"), 1700);
  };

  // Real upload: takes the file the user picked/dropped, previews it, then runs
  // the (still simulated) extraction. Only images get a thumbnail URL.
  const uploadReceipt = (file: File) => {
    if (ocrState === "scanning") return;
    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { name: file.name, size: file.size, type: file.type, url };
    });
    beginScan();
  };

  // Demo path: run the simulation with no real file attached.
  const scanReceipt = () => {
    if (ocrState !== "idle") return;
    clearReceipt();
    beginScan();
  };

  const confirmReceipt = () => {
    setExpenses((s) => [
      { raw: "FIGMA MONTHLY", vendor: "Figma", cat: "Software", amount: 15.0, date: "Jul 5" },
      ...s,
    ]);
    clearReceipt();
    setOcrState("idle");
  };
  const dismissReceipt = () => {
    clearReceipt();
    setOcrState("idle");
  };

  return (
    <AppContext.Provider
      value={{
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
        receipt,
        uploadReceipt,
        scanReceipt,
        confirmReceipt,
        dismissReceipt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
