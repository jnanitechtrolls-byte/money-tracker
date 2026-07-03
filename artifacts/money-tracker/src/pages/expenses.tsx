import { useState } from "react";
import { useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  getListExpensesQueryKey,
  getGetExpenseSummaryQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Housing", "Utilities", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-chart-1/20 text-chart-1",
  Transport: "bg-chart-2/20 text-chart-2",
  Shopping: "bg-chart-3/20 text-chart-3",
  Entertainment: "bg-chart-4/20 text-chart-4",
  Health: "bg-chart-5/20 text-chart-5",
  Housing: "bg-primary/20 text-primary",
  Utilities: "bg-accent/20 text-accent",
  Other: "bg-muted text-muted-foreground",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ExpenseFormData = {
  amount: string;
  category: string;
  description: string;
  date: string;
};

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  userId: string;
  createdAt: string;
}

function ExpenseDialog({
  open,
  onClose,
  expense,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormData>({
    amount: expense ? String(expense.amount) : "",
    category: expense?.category ?? "",
    description: expense?.description ?? "",
    date: expense?.date ?? new Date().toISOString().split("T")[0],
  });

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const isEditing = !!expense;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    };
    if (isEditing) {
      updateExpense.mutate({ id: expense.id, data }, { onSuccess: () => { onClose(); onSuccess(); } });
    } else {
      createExpense.mutate({ data }, { onSuccess: () => { onClose(); onSuccess(); } });
    }
  }

  const isPending = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">Amount</Label>
            <Input
              id="exp-amount"
              data-testid="input-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))} required>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-description">Description</Label>
            <Input
              id="exp-description"
              data-testid="input-description"
              placeholder="What was this for?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-date">Date</Label>
            <Input
              id="exp-date"
              data-testid="input-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" data-testid="button-submit-expense" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [addOpen, setAddOpen] = useState(false);

  const params: { month?: string; category?: string } = {};
  if (selectedMonth) params.month = selectedMonth;
  if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory;

  const { data: expenses = [], isLoading } = useListExpenses(params, {
    query: { refetchInterval: 30000, queryKey: getListExpensesQueryKey(params) },
  });

  const deleteExpense = useDeleteExpense();

  function handleInvalidate() {
    queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
  }

  function handleDelete(id: number) {
    deleteExpense.mutate({ id }, { onSuccess: handleInvalidate });
  }

  // Build last 6 months for the month filter
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { value, label };
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={`${basePath}/logo.svg`} alt="Logo" className="h-7 w-7" />
          <span className="font-semibold tracking-tight">Spendly</span>
        </div>
        <nav className="flex items-center gap-1">
          <button
            data-testid="nav-dashboard"
            onClick={() => setLocation("/dashboard")}
            className="text-sm font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Dashboard
          </button>
          <button
            data-testid="nav-expenses"
            onClick={() => setLocation("/expenses")}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary"
          >
            All Expenses
          </button>
          <button
            data-testid="button-signout"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="text-sm font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
          >
            Sign out
          </button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title + Add */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <Button data-testid="button-add-expense" onClick={() => setAddOpen(true)} className="gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48" data-testid="filter-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40" data-testid="filter-category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border pb-3">
          <span>{expenses.length} {expenses.length === 1 ? "expense" : "expenses"}</span>
          <span className="font-semibold text-foreground text-base" data-testid="text-filtered-total">
            Total: {formatCurrency(total)}
          </span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3 opacity-30">
              <svg className="mx-auto w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <p className="font-medium">No expenses found</p>
            <p className="text-sm mt-1">Try a different month or add a new expense.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                data-testid={`card-expense-${expense.id}`}
                className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[expense.category] ?? "bg-muted text-muted-foreground"}`}>
                    {expense.category}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {expense.description || expense.category}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(expense.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(expense.amount)}</span>
                  <button
                    data-testid={`button-edit-${expense.id}`}
                    onClick={() => setEditingExpense(expense as Expense)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    data-testid={`button-delete-${expense.id}`}
                    onClick={() => handleDelete(expense.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add dialog */}
      <ExpenseDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleInvalidate}
      />

      {/* Edit dialog */}
      {editingExpense && (
        <ExpenseDialog
          open={true}
          onClose={() => setEditingExpense(undefined)}
          expense={editingExpense}
          onSuccess={handleInvalidate}
        />
      )}
    </div>
  );
}
