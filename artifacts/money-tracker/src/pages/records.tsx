import { useState } from "react";
import { useListExpenses } from "@workspace/api-client-react";
import { getCategoryInfo } from "@/lib/categories";
import CalendarModal from "@/components/calendar-modal";
import TransactionDetailsModal from "@/components/transaction-details-modal";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.getDate(),
    month: MONTHS[d.getMonth()],
    weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],
  };
}

type FilterType = "all" | "expense" | "income";

type Expense = {
  id: number;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
};

export default function RecordsPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data: allExpenses = [], isLoading } = useListExpenses({ month });

  const totalExpenses = allExpenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalIncome = allExpenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Build per-day data for calendar
  const dayDataMap = new Map<string, { expenses: number; income: number }>();
  allExpenses.forEach((e) => {
    const prev = dayDataMap.get(e.date) || { expenses: 0, income: 0 };
    if (e.type === "income") dayDataMap.set(e.date, { ...prev, income: prev.income + e.amount });
    else dayDataMap.set(e.date, { ...prev, expenses: prev.expenses + e.amount });
  });

  // Apply filters
  let expenses = allExpenses as Expense[];
  if (filterDate) expenses = expenses.filter(e => e.date === filterDate);
  if (filterType !== "all") expenses = expenses.filter(e => e.type === filterType);

  const byDate = new Map<string, Expense[]>();
  expenses.forEach((e) => {
    const arr = byDate.get(e.date) || [];
    arr.push(e);
    byDate.set(e.date, arr);
  });
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  const months: string[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const hasActiveFilter = filterDate !== null || filterType !== "all";

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Side drawer overlay */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDrawer(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#1e1e1e] flex flex-col shadow-2xl">
            <div className="px-4 py-5 border-b border-[#2a2a2a]">
              <p className="text-white font-bold text-base">Filter</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Transaction Type</p>
              {(["all", "expense", "income"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setFilterType(t); setShowDrawer(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    filterType === t ? "bg-primary text-black" : "text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  <span>{t === "all" ? "📋" : t === "expense" ? "💸" : "💰"}</span>
                  <span className="capitalize">{t === "all" ? "All Transactions" : t}</span>
                </button>
              ))}
            </div>
            {hasActiveFilter && (
              <div className="px-4 mt-auto pb-8">
                <button
                  onClick={() => { setFilterDate(null); setFilterType("all"); setShowDrawer(false); }}
                  className="w-full py-3 rounded-xl bg-[#2a2a2a] text-muted-foreground text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button className="p-2 -ml-2" onClick={() => setShowDrawer(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-white font-bold text-base">Money Tracker</span>
          <div className="flex items-center gap-1">
            {hasActiveFilter && (
              <button
                onClick={() => { setFilterDate(null); setFilterType("all"); }}
                className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 mr-1"
              >
                CLEAR
              </button>
            )}
            <button onClick={() => setShowCalendar(true)} className="p-2 -mr-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="1.8"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Month selector */}
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="flex items-center gap-1 text-white font-semibold text-lg mb-3"
        >
          {filterDate
            ? `${formatDate(filterDate).day} ${formatDate(filterDate).month} ${filterDate.slice(0,4)}`
            : getMonthLabel(month)}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {showMonthPicker && !filterDate && (
          <div className="bg-[#2a2a2a] rounded-xl p-2 mb-3 grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => { setMonth(m); setShowMonthPicker(false); setFilterDate(null); }}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  m === month ? "bg-primary text-black" : "text-muted-foreground hover:bg-[#333]"
                }`}
              >
                {getMonthLabel(m)}
              </button>
            ))}
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2 mb-2 border-b border-[#222] pb-3">
          <div>
            <p className="text-muted-foreground text-xs">Expenses</p>
            <p className="text-red-400 font-semibold text-sm">{totalExpenses.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Income</p>
            <p className="text-green-400 font-semibold text-sm">{totalIncome.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className={`font-semibold text-sm ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
              {balance >= 0 ? "+" : ""}{balance.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Active filter badge */}
        {filterType !== "all" && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary capitalize font-medium">
              {filterType} only
            </span>
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <span className="text-3xl">📋</span>
            <p className="text-sm">No transactions found</p>
          </div>
        )}
        {sortedDates.map((date) => {
          const items = byDate.get(date)!;
          const { day, month: mon, weekday } = formatDate(date);
          const dayExp = items.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
          const dayInc = items.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#111]">
                <span className="text-muted-foreground text-xs">{day} {mon}  {weekday}</span>
                <div className="flex gap-3 text-xs">
                  {dayExp > 0 && <span className="text-red-400">-{dayExp.toFixed(0)}</span>}
                  {dayInc > 0 && <span className="text-green-400">+{dayInc.toFixed(0)}</span>}
                </div>
              </div>
              {items.map((expense) => {
                const cat = getCategoryInfo(expense.category, expense.type);
                return (
                  <button
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#222] active:bg-[#222] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat.color + "33" }}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{expense.description || expense.category}</p>
                      <p className="text-muted-foreground text-xs">{expense.category}</p>
                    </div>
                    <span className={`font-semibold text-sm shrink-0 ${expense.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {expense.type === "income" ? "+" : "-"}{expense.amount.toFixed(0)}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <CalendarModal
        open={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedMonth={month}
        onMonthChange={(m) => { setMonth(m); setFilterDate(null); }}
        dayData={dayDataMap}
        onDaySelect={(d) => { setFilterDate(d); setShowMonthPicker(false); }}
      />

      <TransactionDetailsModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
}
