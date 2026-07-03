import { useState } from "react";
import { useListExpenses } from "@workspace/api-client-react";
import { getCategoryInfo } from "@/lib/categories";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  return { day, month, weekday };
}

export default function RecordsPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { data: expenses = [], isLoading } = useListExpenses({ month });

  const totalExpenses = expenses.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalIncome = expenses.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Group by date
  const byDate = new Map<string, typeof expenses>();
  expenses.forEach((e) => {
    const arr = byDate.get(e.date) || [];
    arr.push(e);
    byDate.set(e.date, arr);
  });
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  // Generate last 24 months for picker
  const months: string[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button className="p-2 -ml-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-white font-bold text-base">Money Tracker</span>
          <button className="p-2 -mr-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="1.8"/>
              <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Month selector */}
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="flex items-center gap-1 text-white font-semibold text-lg mb-3"
        >
          {getMonthLabel(month)}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showMonthPicker && (
          <div className="bg-[#2a2a2a] rounded-xl p-2 mb-3 grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => { setMonth(m); setShowMonthPicker(false); }}
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
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <p className="text-muted-foreground text-xs">Expenses</p>
            <p className="text-white font-semibold text-sm">{totalExpenses.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Income</p>
            <p className="text-white font-semibold text-sm">{totalIncome.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className={`font-semibold text-sm ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
              {balance >= 0 ? "+" : ""}{balance.toFixed(0)}
            </p>
          </div>
        </div>
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
            <p className="text-sm">No transactions this month</p>
          </div>
        )}

        {sortedDates.map((date) => {
          const items = byDate.get(date)!;
          const { day, month: mon, weekday } = formatDate(date);
          const dayExpenses = items.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
          const dayIncome = items.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);

          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#111]">
                <span className="text-muted-foreground text-xs">{day} {mon}  {weekday}</span>
                <div className="flex gap-3 text-xs">
                  {dayExpenses > 0 && <span className="text-red-400">Expenses: {dayExpenses.toFixed(0)}</span>}
                  {dayIncome > 0 && <span className="text-green-400">Income: {dayIncome.toFixed(0)}</span>}
                </div>
              </div>

              {/* Items */}
              {items.map((expense) => {
                const cat = getCategoryInfo(expense.category, expense.type);
                return (
                  <div key={expense.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#222] active:bg-[#222]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: cat.color + "33" }}
                    >
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{expense.description || expense.category}</p>
                      <p className="text-muted-foreground text-xs">{expense.category}</p>
                    </div>
                    <span className={`font-semibold text-sm ${expense.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {expense.type === "income" ? "+" : "-"}{expense.amount.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
