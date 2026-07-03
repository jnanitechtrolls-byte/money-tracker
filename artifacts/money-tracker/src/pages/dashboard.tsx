import { useState } from "react";
import { useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetExpenseSummary,
  useCreateExpense,
  useDeleteExpense,
  getGetExpenseSummaryQueryKey,
  getListExpensesQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AddExpenseDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const createExpense = useCreateExpense();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !category || !date) return;
    createExpense.mutate(
      { data: { amount: parseFloat(amount), category, description, date } },
      {
        onSuccess: () => {
          setOpen(false);
          setAmount("");
          setCategory("");
          setDescription("");
          setDate(new Date().toISOString().split("T")[0]);
          onSuccess();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-expense" className="gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              data-testid="input-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              data-testid="input-description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              data-testid="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              data-testid="button-submit-expense"
              disabled={createExpense.isPending}
            >
              {createExpense.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: summary, isLoading } = useGetExpenseSummary(
    { month: currentMonth },
    { query: { refetchInterval: 30000, queryKey: getGetExpenseSummaryQueryKey({ month: currentMonth }) } }
  );

  const deleteExpense = useDeleteExpense();

  function handleInvalidate() {
    queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey({ month: currentMonth }) });
  }

  function handleDelete(id: number) {
    deleteExpense.mutate({ id }, { onSuccess: handleInvalidate });
  }

  const monthLabel = new Date(now.getFullYear(), now.getMonth()).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary"
          >
            Dashboard
          </button>
          <button
            data-testid="nav-expenses"
            onClick={() => setLocation("/expenses")}
            className="text-sm font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.firstName ? `Hi, ${user.firstName}` : "Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{monthLabel}</p>
          </div>
          <AddExpenseDialog onSuccess={handleInvalidate} />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">This month</div>
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-month">
                  {formatCurrency(summary?.totalThisMonth ?? 0)}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">All time</div>
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-all">
                  {formatCurrency(summary?.totalAllTime ?? 0)}
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            {summary && summary.byCategory.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-foreground mb-4">Spending by category</h2>
                <div className="space-y-3">
                  {summary.byCategory.map((item) => {
                    const pct = summary.totalThisMonth > 0
                      ? Math.round((item.total / summary.totalThisMonth) * 100)
                      : 0;
                    return (
                      <div key={item.category} data-testid={`row-category-${item.category}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] ?? "bg-muted text-muted-foreground"}`}>
                            {item.category}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(item.total)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent expenses */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Recent expenses</h2>
                <button
                  data-testid="link-all-expenses"
                  onClick={() => setLocation("/expenses")}
                  className="text-sm text-primary hover:opacity-80 transition-opacity font-medium"
                >
                  View all
                </button>
              </div>
              {!summary?.recentExpenses?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No expenses yet. Add your first one above.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      data-testid={`card-expense-${expense.id}`}
                      className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0"
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
                          data-testid={`button-delete-${expense.id}`}
                          onClick={() => handleDelete(expense.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
