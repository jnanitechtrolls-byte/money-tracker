import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useListExpenses } from "@workspace/api-client-react";
import { getCategoryInfo, CHART_COLORS } from "@/lib/categories";

type Period = "week" | "month" | "year";
type TxType = "expense" | "income";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getMonthOptions() {
  const now = new Date();
  const opts: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return opts;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  if (ym === cur) return "This Month";
  if (ym === prevStr) return "Last Month";
  return `${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
}

export default function ChartsPage() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = String(now.getFullYear());

  const [period, setPeriod] = useState<Period>("month");
  const [txType, setTxType] = useState<TxType>("expense");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showDateRange, setShowDateRange] = useState(false);
  const [customStart, setCustomStart] = useState(now.toISOString().slice(0, 10).slice(0, 8) + "01");
  const [customEnd, setCustomEnd] = useState(now.toISOString().slice(0, 10));

  // Fetch current month data for month/week views
  const { data: monthTx = [] } = useListExpenses({ month: selectedMonth });
  // Fetch all data for year view (no month filter means all)
  const { data: yearTx = [] } = useListExpenses({});

  // Filter by period
  let filtered = monthTx;
  if (period === "week") {
    const { start, end } = getWeekRange();
    filtered = monthTx.filter((e) => e.date >= start && e.date <= end);
  } else if (period === "year") {
    filtered = yearTx.filter((e) => e.date.startsWith(currentYear));
  }

  // Filter by type
  const typeFiltered = filtered.filter((e) => e.type === txType);

  // Group by category
  const catMap = new Map<string, number>();
  typeFiltered.forEach((e) => {
    catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
  });
  const total = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
  const chartData = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, value], i) => ({
      category,
      total: value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }));

  const monthOpts = getMonthOptions();

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header row: type toggle + calendar icon */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8" />
          <button
            onClick={() => setTxType(txType === "expense" ? "income" : "expense")}
            className="flex items-center gap-1 text-white font-bold text-base"
          >
            {txType === "expense" ? "Expenses" : "Income"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button onClick={() => setShowDateRange(true)} className="p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="1.8"/>
              <path d="M3 9h18M8 2v4M16 2v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Week / Month / Year tabs */}
        <div className="flex rounded-full bg-[#2a2a2a] p-1 gap-1 mb-3">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                period === p ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Month selector tabs (only for month mode) */}
        {period === "month" && (
          <div className="flex gap-0 overflow-x-auto pb-1 no-scrollbar border-b border-[#2a2a2a]">
            {monthOpts.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`shrink-0 py-1.5 px-3 text-sm font-medium transition-colors ${
                  m === selectedMonth
                    ? "text-white border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>
        )}

        {period === "week" && (
          <div className="text-center text-muted-foreground text-xs py-1">
            Week of {getWeekRange().start} – {getWeekRange().end}
          </div>
        )}

        {period === "year" && (
          <div className="text-center text-muted-foreground text-xs py-1">
            {currentYear}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Donut chart */}
        <div className="px-4 py-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <span className="text-3xl">📊</span>
              <p className="text-sm">No {txType} data for this period</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} dataKey="total" strokeWidth={0}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{total.toFixed(0)}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {chartData.slice(0, 6).map((c) => (
                  <div key={c.category} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-muted-foreground text-xs truncate">{c.category}</span>
                    </div>
                    <span className="text-white text-xs font-medium shrink-0">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category bars */}
        {chartData.length > 0 && (
          <div className="px-4 flex flex-col gap-3">
            {chartData.map((c) => {
              const cat = getCategoryInfo(c.category, txType);
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: c.color + "33" }}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">{c.category} <span className="text-muted-foreground text-xs">{c.pct}%</span></span>
                      <span className="text-white text-sm font-semibold">{c.total.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date range picker modal */}
      {showDateRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-[#333]">
                <span className="text-white font-medium">Start Time</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none [color-scheme:dark]"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#333]">
                <span className="text-white font-medium">End Time</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none [color-scheme:dark]"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDateRange(false)}
                className="flex-1 py-3 rounded-xl bg-[#333] text-white font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDateRange(false)}
                className="flex-1 py-3 rounded-xl bg-primary text-black font-semibold text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
