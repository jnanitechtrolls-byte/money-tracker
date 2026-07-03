import { useState } from "react";
import { useGetExpenseSummary } from "@workspace/api-client-react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTHS_SHORT[parseInt(m)-1]}`;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"analytics" | "accounts">("analytics");
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: summary } = useGetExpenseSummary({ month: currentMonth });

  const monthlyStats = summary?.monthlyStats || [];
  const totalExpenses = summary?.totalExpenses || 0;
  const totalIncome = summary?.totalIncome || 0;
  const balance = summary?.balance || 0;

  // Budget is 0 for now (no budget feature)
  const budget = 0;
  const remaining = budget - totalExpenses;
  const budgetPct = budget > 0 ? Math.min(totalExpenses / budget, 1) : 0;

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-white font-bold text-base text-center mb-4">Reports</h1>

        {/* Tab switch */}
        <div className="flex mx-0 rounded-full bg-[#2a2a2a] p-1 gap-1 mb-4">
          {(["analytics", "accounts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 flex flex-col gap-4">
        {tab === "analytics" && (
          <>
            {/* Monthly Statistics */}
            <div className="bg-[#222] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">Monthly Statistics</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground mb-2 border-b border-[#333] pb-2">
                <span>Month</span>
                <span className="text-right">Expenses</span>
                <span className="text-right">Income</span>
                <span className="text-right">Balance</span>
              </div>

              {/* Year group */}
              {monthlyStats.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
              ) : (
                <>
                  <p className="text-muted-foreground text-xs mb-1">{now.getFullYear()}</p>
                  {monthlyStats
                    .filter((s) => s.month.startsWith(String(now.getFullYear())))
                    .map((s) => (
                      <div key={s.month} className="grid grid-cols-4 gap-1 text-sm py-1.5 border-b border-[#2a2a2a] last:border-0">
                        <span className="text-white font-medium">{monthLabel(s.month)}</span>
                        <span className="text-right text-red-400">{s.expenses.toFixed(0)}</span>
                        <span className="text-right text-green-400">{s.income.toFixed(0)}</span>
                        <span className={`text-right font-medium ${s.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {s.balance.toFixed(0)}
                        </span>
                      </div>
                    ))}
                </>
              )}
            </div>

            {/* Monthly Budget */}
            <div className="bg-[#222] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Monthly Budget</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              <div className="flex items-center gap-6">
                {/* Ring chart */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#333" strokeWidth="10" />
                    {budget > 0 && (
                      <circle
                        cx="40" cy="40" r="32"
                        fill="none"
                        stroke="hsl(48 100% 52%)"
                        strokeWidth="10"
                        strokeDasharray={`${budgetPct * 201} 201`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">--</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm border-b border-[#2a2a2a] pb-2">
                    <span className="text-muted-foreground">Remaining :</span>
                    <span className={remaining >= 0 ? "text-white" : "text-red-400"}>{remaining.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-[#2a2a2a] pb-2">
                    <span className="text-muted-foreground">Budget :</span>
                    <span className="text-white">{budget.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expenses :</span>
                    <span className="text-white">{totalExpenses.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "accounts" && (
          <>
            {/* Net Worth card */}
            <div className="bg-[#222] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Net Worth</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? "text-white" : "text-red-400"}`}>
                      {balance.toFixed(0)}
                    </p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Assets</p>
                      <p className="text-white font-semibold">{totalIncome.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Liabilities</p>
                      <p className="text-white font-semibold">{totalExpenses.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
                <span className="text-4xl">💰</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#222] rounded-2xl py-4 text-white font-semibold text-sm">
                Add Account
              </button>
              <button className="bg-[#222] rounded-2xl py-4 text-white font-semibold text-sm">
                Manage Accounts
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
