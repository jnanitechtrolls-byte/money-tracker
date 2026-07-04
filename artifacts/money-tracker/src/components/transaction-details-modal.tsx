import { useState, useEffect } from "react";
import { useUpdateExpense, useDeleteExpense } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryInfo } from "@/lib/categories";

type Expense = {
  id: number;
  type: string;
  amount: number;
  category: string;
  description: string;
  authorName?: string;
  userId: string;
  date: string;
  createdAt: string;
};

type Props = {
  expense: Expense | null;
  initialMode?: "view" | "edit";
  onClose: () => void;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCreatedAt(isoStr: string) {
  const d = new Date(isoStr);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const time = d.toTimeString().slice(0, 8);
  return `Add ${date} ${time}`;
}

export default function TransactionDetailsModal({ expense, initialMode = "view", onClose }: Props) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [editType, setEditType] = useState<"expense" | "income">("expense");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { user } = useUser();
  const queryClient = useQueryClient();

  const updateExpense = useUpdateExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
        onClose();
      },
    },
  });

  const deleteExpense = useDeleteExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
        onClose();
      },
    },
  });

  useEffect(() => {
    if (expense && initialMode === "edit") {
      setEditType(expense.type as "expense" | "income");
      setEditCategory(expense.category);
      setEditAmount(String(expense.amount));
      setEditDescription(expense.description);
      setEditDate(expense.date);
      setMode("edit");
    } else {
      setMode(initialMode);
    }
  }, [initialMode, expense]);

  if (!expense) return null;

  function openEdit() {
    setEditType(expense!.type as "expense" | "income");
    setEditCategory(expense!.category);
    setEditAmount(String(expense!.amount));
    setEditDescription(expense!.description);
    setEditDate(expense!.date);
    setMode("edit");
  }

  function handleSaveEdit() {
    if (!editCategory || !editAmount || parseFloat(editAmount) <= 0) return;
    updateExpense.mutate({
      id: expense!.id,
      data: {
        type: editType,
        amount: parseFloat(editAmount),
        category: editCategory,
        description: editDescription,
        date: editDate,
      },
    });
  }

  function handleDelete() {
    deleteExpense.mutate({ id: expense!.id });
  }

  function handleNumKey(key: string) {
    if (key === "." && editAmount.includes(".")) return;
    if (key === "." && editAmount === "") { setEditAmount("0."); return; }
    if (editAmount === "0" && key !== ".") { setEditAmount(key); return; }
    if (editAmount.includes(".") && editAmount.split(".")[1].length >= 2) return;
    setEditAmount((prev) => prev + key);
  }

  const cat = getCategoryInfo(expense.category, expense.type);
  const categories = editType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Delete confirm overlay
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
        <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
          <p className="text-white font-semibold text-center mb-2">Delete Transaction?</p>
          <p className="text-muted-foreground text-sm text-center mb-6">This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-[#333] text-white font-semibold text-sm">Cancel</button>
            <button onClick={handleDelete} disabled={deleteExpense.isPending} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm">
              {deleteExpense.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  if (mode === "edit") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/60" onClick={() => setMode("view")} />
        <div className="relative bg-[#1a1a1a] rounded-t-2xl max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
            <button onClick={() => setMode("view")} className="text-muted-foreground text-sm">Cancel</button>
            <span className="text-white font-semibold">Edit</span>
            <button
              onClick={handleSaveEdit}
              disabled={!editCategory || !editAmount || parseFloat(editAmount) <= 0 || updateExpense.isPending}
              className="text-primary text-sm font-semibold disabled:opacity-40"
            >
              {updateExpense.isPending ? "Saving…" : "✓"}
            </button>
          </div>

          {/* Type tabs */}
          <div className="flex mx-4 mt-3 rounded-full bg-[#2a2a2a] p-1 gap-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setEditType(t); setEditCategory(""); }}
                className={`flex-1 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                  editType === t ? "bg-white text-black" : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Category grid */}
            <div className="grid grid-cols-4 gap-3 px-4 py-4">
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setEditCategory(c.name)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                      editCategory === c.name ? "scale-110" : "bg-[#2a2a2a]"
                    }`}
                    style={editCategory === c.name ? { background: c.color + "33", boxShadow: `0 0 0 2px ${c.color}` } : {}}
                  >
                    {c.emoji}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="px-4 pb-2">
              <div className="bg-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="flex-1 text-right text-2xl font-bold text-white">{editAmount || "0"}</span>
              </div>
            </div>
            <div className="px-4 pb-2">
              <input
                type="text"
                placeholder="Description (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground outline-none"
              />
            </div>
            <div className="px-4 pb-4">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-4 gap-px bg-[#2a2a2a] border-t border-[#2a2a2a]">
            {["1","2","3","4","5","6","7","8","9",".","0"].map((k) => (
              <button key={k} onClick={() => handleNumKey(k)} className="bg-[#1a1a1a] py-3 text-lg font-semibold text-white active:bg-[#2a2a2a]">{k}</button>
            ))}
            <button onClick={() => setEditAmount((p) => p.slice(0,-1))} className="bg-[#1a1a1a] py-3 flex items-center justify-center active:bg-[#2a2a2a]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-7.59 7.59c-.39.39-.39 1.02 0 1.41l7.59 7.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H20c.55 0 1-.45 1-1s-.45-1-1-1z" fill="hsl(0 0% 55%)"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2a2a2a]">
        <button onClick={onClose} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l7-7m-7 7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <span className="text-white font-bold text-base flex-1 text-center">Details</span>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
        {/* Category icon + name */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: cat.color + "33" }}>
            {cat.emoji}
          </div>
          <span className="text-white text-xl font-semibold">{expense.category}</span>
        </div>

        {/* Details rows */}
        <div className="flex flex-col gap-0 bg-[#222] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
            <span className="text-muted-foreground text-sm">Type</span>
            <span className="text-white text-sm capitalize">{expense.type}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
            <span className="text-muted-foreground text-sm">Amount</span>
            <span className={`text-base font-bold ${expense.type === "income" ? "text-green-400" : "text-red-400"}`}>
              {expense.type === "income" ? "+" : "-"}{expense.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-start justify-between px-4 py-4 border-b border-[#2a2a2a]">
            <span className="text-muted-foreground text-sm">Date</span>
            <div className="text-right">
              <p className="text-white text-sm">{formatDisplayDate(expense.date)}</p>
              <p className="text-muted-foreground text-xs mt-0.5">( {formatCreatedAt(expense.createdAt)} )</p>
            </div>
          </div>
          {expense.description ? (
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-muted-foreground text-sm">Note</span>
              <span className="text-white text-sm">{expense.description}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom actions */}
      {user?.id === expense.userId && (
        <div className="flex border-t border-[#2a2a2a]">
          <button
            onClick={openEdit}
            className="flex-1 py-5 text-white font-semibold text-base active:bg-[#222] transition-colors border-r border-[#2a2a2a]"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 py-5 text-red-400 font-semibold text-base active:bg-[#222] transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
