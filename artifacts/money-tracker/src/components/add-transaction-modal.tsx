import { useState } from "react";
import { useCreateExpense } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

type TabType = "expense" | "income";

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
    if (!selectedCategory || !amount || parseFloat(amount) <= 0) return;
    createExpense.mutate({
      data: {
        type: tab,
        amount: parseFloat(amount),
        category: selectedCategory,
        description,
        date,
      },
    });
  }

  const categories = tab === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-[#1a1a1a] rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <button onClick={handleClose} className="text-muted-foreground text-sm font-medium">Cancel</button>
          <span className="text-white font-semibold">Add</span>
          <button
            onClick={handleSave}
            disabled={!selectedCategory || !amount || parseFloat(amount || "0") <= 0 || createExpense.isPending}
            className="text-sm font-semibold text-primary disabled:opacity-40"
          >
            {createExpense.isPending ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mt-3 rounded-full bg-[#2a2a2a] p-1 gap-1">
          {(["expense", "income"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedCategory(null); }}
              className={`flex-1 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
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
                    selectedCategory === cat.name
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-[#1a1a1a] scale-110"
                      : "bg-[#2a2a2a]"
                  }`}
                  style={selectedCategory === cat.name ? { background: cat.color + "33", borderColor: cat.color } : {}}
                >
                  <span>{cat.emoji}</span>
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Amount display */}
          <div className="px-4 pb-2">
            <div className="bg-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Amount</span>
              <span className="flex-1 text-right text-2xl font-bold text-white">
                {amount || "0"}
              </span>
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
          <div className="px-4 pb-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Number pad */}
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
              <path d="M21 12H9m0 0l4-4m-4 4l4 4" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 5h6l-6 7 6 7H3" stroke="hsl(0 0% 55%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
