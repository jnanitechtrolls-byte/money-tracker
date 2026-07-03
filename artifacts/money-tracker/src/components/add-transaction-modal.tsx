import { useState } from "react";
import { useCreateExpense } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

type TabType = "expense" | "income" | "transfer";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddTransactionModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<TabType>("expense");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const queryClient = useQueryClient();
  const createExpense = useCreateExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
        handleClose();
      },
    },
  });

  function handleClose() {
    setSelectedCategory(null);
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setTab("expense");
    onClose();
  }

  function handleNumKey(key: string) {
    if (key === "." && amount.includes(".")) return;
    if (key === "." && amount === "") { setAmount("0."); return; }
    if (amount === "0" && key !== ".") { setAmount(key); return; }
    if (amount.includes(".") && amount.split(".")[1].length >= 2) return;
    setAmount((prev) => prev + key);
  }

  function handleBackspace() {
    setAmount((prev) => prev.slice(0, -1));
  }

  function handleSave() {
    if (tab === "transfer") return; // transfer requires accounts
    if (!selectedCategory || !amount || parseFloat(amount) <= 0) return;
    createExpense.mutate({
      data: {
        type: tab as "expense" | "income",
        amount: parseFloat(amount),
        category: selectedCategory,
        description,
        date,
      },
    });
  }

  const categories = tab === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const canSave = tab === "transfer"
    ? false
    : !!(selectedCategory && amount && parseFloat(amount) > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-[#1a1a1a] rounded-t-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <button onClick={handleClose} className="text-muted-foreground text-sm font-medium">Cancel</button>
          <span className="text-white font-semibold">Add</span>
          <button
            onClick={handleSave}
            disabled={!canSave || createExpense.isPending}
            className="text-sm font-semibold text-primary disabled:opacity-40"
          >
            {createExpense.isPending ? "Saving…" : "✓"}
          </button>
        </div>

        {/* Tabs: Expense | Income | Transfer */}
        <div className="flex mx-4 mt-3 rounded-full bg-[#2a2a2a] p-1 gap-1">
          {(["expense", "income", "transfer"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedCategory(null); }}
              className={`flex-1 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {tab === "transfer" ? (
            /* Transfer UI */
            <div className="flex flex-col items-center justify-center px-8 py-12 gap-8">
              <p className="text-muted-foreground text-sm text-center">Select accounts to transfer between</p>
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 aspect-square bg-[#2a2a2a] rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-white text-sm font-medium">Select</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="flex-1 aspect-square bg-[#2a2a2a] rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-white text-sm font-medium">Select</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs text-center">
                Add accounts in Reports → Accounts to enable transfers
              </p>
            </div>
          ) : (
            <>
              {/* Category grid */}
              <div className="grid grid-cols-4 gap-3 px-4 py-4">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                        selectedCategory === cat.name ? "scale-110" : "bg-[#2a2a2a]"
                      }`}
                      style={selectedCategory === cat.name
                        ? { background: cat.color + "33", boxShadow: `0 0 0 2px ${cat.color}` }
                        : {}}
                    >
                      {cat.emoji}
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Amount display */}
              <div className="px-4 pb-2">
                <div className="bg-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Amount</span>
                  <span className="flex-1 text-right text-2xl font-bold text-white">{amount || "0"}</span>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 pb-2">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground outline-none"
                />
              </div>

              {/* Date */}
              <div className="px-4 pb-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
                />
              </div>
            </>
          )}
        </div>

        {/* Photo / Camera / Speak bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[#2a2a2a]">
          <button className="flex items-center gap-1.5 text-muted-foreground text-xs p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Photo</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground text-xs p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            <span>Camera</span>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] rounded-full py-2 px-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="hsl(0 0% 55%)" strokeWidth="1.8"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="hsl(0 0% 55%)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="text-muted-foreground text-sm">Speak</span>
          </div>
          <button className="p-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Number pad (only for expense/income) */}
        {tab !== "transfer" && (
          <div className="grid grid-cols-4 gap-px bg-[#2a2a2a] border-t border-[#2a2a2a]">
            {["1","2","3","4","5","6","7","8","9",".","0"].map((k) => (
              <button
                key={k}
                onClick={() => handleNumKey(k)}
                className="bg-[#1a1a1a] py-3 text-lg font-semibold text-white active:bg-[#2a2a2a] transition-colors"
              >
                {k}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="bg-[#1a1a1a] py-3 flex items-center justify-center active:bg-[#2a2a2a] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-7.59 7.59c-.39.39-.39 1.02 0 1.41l7.59 7.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H20c.55 0 1-.45 1-1s-.45-1-1-1z" fill="hsl(0 0% 55%)"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
