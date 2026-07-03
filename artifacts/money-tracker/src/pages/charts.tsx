import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useGetExpenseSummary } from "@workspace/api-client-react";
import { getCategoryInfo, CHART_COLORS } from "@/lib/categories";

type Period = "week" | "month" | "year";

function getMonthOptions() {
  const now = new Date();
  const opts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return opts;
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth()-1,1);
  const prevStr = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}`;
  if (ym === cur) return "This Month";
  if (ym === prevStr) return "Last Month";
  return `${MONTHS_SHORT[parseInt(m)-1]} ${y}`;
}

export default function ChartsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [txType, setTxType] = useState<"expense" | "income">("expense");

  const { data: summary } = useGetExpenseSummary({ month: selectedMonth });

  const byCategory = (summary?.byCategory || []).filter((c) => c.total > 0);
  const total = byCategory.reduce((s, c) => s + c.total, 0);

  const chartData = byCategory.map((c, i) => ({
    ...c,
    color: CHART_COLORS[i % CHART_COLORS.length],
    pct: total > 0 ? Math.round((c.total / total) * 100) : 0,
  }));

  const monthOpts = getMonthOptions();

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={() => setTxType(txType === "expense" ? "income" : "expense")}
            className="flex items-center gap-1 text-white font-bold text-base"
          >
            {txType === "expense" ? "Expenses" : "Income"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Month tabs (scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {monthOpts.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`shrink-0 py-1.5 px-3 text-sm font-medium rounded-full transition-colors ${
                m === selectedMonth
                  ? "text-white border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Donut chart */}
        <div className="px-4 py-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <span className="text-3xl">📊</span>
              <p className="text-sm">No data for this period</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Donut */}
              <div className="relative w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      dataKey="total"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{total.toFixed(0)}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 flex flex-col gap-2">
                {chartData.slice(0, 6).map((c) => {
                  const cat = getCategoryInfo(c.category, "expense");
                  return (
                    <div key={c.category} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="text-muted-foreground text-xs truncate">{c.category}</span>
                      </div>
                      <span className="text-white text-xs font-medium shrink-0">{c.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Category bars */}
        {chartData.length > 0 && (
          <div className="px-4 flex flex-col gap-3">
            {chartData.map((c) => {
              const cat = getCategoryInfo(c.category, "expense");
              return (
                <div key={c.category}>
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: c.color + "33" }}
                    >
                      {cat.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-sm">{c.category} <span className="text-muted-foreground text-xs">{c.pct}%</span></span>
                        <span className="text-white text-sm font-semibold">{c.total.toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
