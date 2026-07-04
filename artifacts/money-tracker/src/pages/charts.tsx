import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useListExpenses } from "@workspace/api-client-react";
import { getCategoryInfo, CHART_COLORS } from "@/lib/categories";

type Period = "week" | "month" | "year";
type TxType = "expense" | "income";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getWeekRange(date = new Date()) {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) };
}

function getMonthOptions() {
  const now = new Date();
  const opts: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  return opts;
}

function getYearOptions() {
  const now = new Date();
  const opts: string[] = [];
  for (let i = 3; i >= 0; i--) opts.push(String(now.getFullYear() - i));
  opts.push("This Year");
  return opts;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevStr = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}`;
  if (ym === cur) return "This Month";
  if (ym === prevStr) return "Last Month";
  return `${MONTHS_SHORT[parseInt(m)-1]} ${y}`;
}

export default function ChartsPage() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const currentYear = now.getFullYear();

  const [period, setPeriod] = useState<Period>("month");
  const [txType, setTxType] = useState<TxType>("expense");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartPage, setChartPage] = useState(0); // 0=donut, 1=line
  const [showDateRange, setShowDateRange] = useState(false);
  const [customStart, setCustomStart] = useState(`${currentMonth}-01`);
  const [customEnd, setCustomEnd] = useState(now.toISOString().slice(0,10));

  // Fetch monthly data
  const { data: monthTx = [] } = useListExpenses({ month: selectedMonth });
  // Fetch all for year view
  const { data: allTx = [] } = useListExpenses({});

  // Determine filtered set
  let filtered = monthTx;
  if (period === "week") {
    const { start, end } = getWeekRange();
    filtered = monthTx.filter(e => e.date >= start && e.date <= end);
  } else if (period === "year") {
    filtered = allTx.filter(e => e.date.startsWith(String(selectedYear)));
  }

  const typeFiltered = filtered.filter(e => e.type === txType);
  const total = typeFiltered.reduce((s, e) => s + e.amount, 0);

  // Category breakdown for donut
  const catMap = new Map<string, number>();
  typeFiltered.forEach(e => catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount));
  const chartData = Array.from(catMap.entries())
    .sort((a,b) => b[1]-a[1])
    .map(([category, value], i) => ({
      category, total: value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      pct: total > 0 ? Math.round((value/total)*100) : 0,
    }));

  // Line chart data
  function buildLineData() {
    if (period === "week") {
      const { start } = getWeekRange();
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      return days.map((label, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0,10);
        const val = typeFiltered.filter(e => e.date === dateStr).reduce((s,e) => s+e.amount, 0);
        return { label, value: val };
      });
    }
    if (period === "month") {
      const [yr, mn] = selectedMonth.split("-").map(Number);
      const daysInMonth = new Date(yr, mn, 0).getDate();
      const points: number[] = [1, 8, 15, 22, daysInMonth];
      return points.map(day => {
        const dateStr = `${selectedMonth}-${String(day).padStart(2,"0")}`;
        const weekTotal = typeFiltered.filter(e => {
          const d = parseInt(e.date.slice(8));
          return d >= day && d < day + 7;
        }).reduce((s,e) => s+e.amount, 0);
        return { label: `${MONTHS_SHORT[mn-1]} ${day}`, value: weekTotal };
      });
    }
    // year
    return MONTHS_SHORT.map((label, i) => {
      const mn = String(i+1).padStart(2,"0");
      const val = typeFiltered.filter(e => e.date.slice(5,7) === mn).reduce((s,e) => s+e.amount, 0);
      return { label, value: val };
    });
  }

  const lineData = buildLineData();
  const nonZeroCount = lineData.filter(d => d.value > 0).length || 1;
  const average = total / nonZeroCount;

  const monthOpts = getMonthOptions();
  const yearOpts = [2022, 2023, 2024, currentYear - 1, currentYear];

  // Touch swipe support
  let touchStartX = 0;

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8"/>
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

        {/* Week / Month / Year */}
        <div className="flex rounded-lg border border-[#333] overflow-hidden mb-3">
          {(["week","month","year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setChartPage(0); }}
              className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${
                period === p ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>

        {/* Period sub-tabs */}
        {period === "month" && (
          <div className="flex gap-0 overflow-x-auto pb-1 no-scrollbar border-b border-[#2a2a2a] -mx-4 px-4">
            {monthOpts.map((m) => (
              <button key={m} onClick={() => setSelectedMonth(m)}
                className={`shrink-0 py-1.5 px-3 text-sm font-medium transition-colors ${
                  m === selectedMonth ? "text-white border-b-2 border-primary" : "text-muted-foreground"
                }`}>
                {monthLabel(m)}
              </button>
            ))}
          </div>
        )}
        {period === "week" && (
          <div className="text-center text-muted-foreground text-xs pb-1">
            {getWeekRange().start} – {getWeekRange().end}
          </div>
        )}
        {period === "year" && (
          <div className="flex gap-0 overflow-x-auto pb-1 no-scrollbar border-b border-[#2a2a2a] -mx-4 px-4">
            {yearOpts.map((y) => (
              <button key={y} onClick={() => setSelectedYear(typeof y === "number" ? y : currentYear)}
                className={`shrink-0 py-1.5 px-3 text-sm font-medium transition-colors ${
                  selectedYear === (typeof y === "number" ? y : currentYear)
                    ? "text-white border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}>
                {y === currentYear ? "This Year" : y === currentYear - 1 ? "Last Year" : y}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Chart area — swipeable between donut (page 0) and line (page 1) */}
        <div
          className="px-4 py-4"
          onTouchStart={(e) => { touchStartX = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (dx < -40) setChartPage(1);
            else if (dx > 40) setChartPage(0);
          }}
        >
          {/* Total / Average (shown on line chart page) */}
          {chartPage === 1 && (
            <div className="mb-2">
              <p className="text-white text-sm">Total: {total.toFixed(0)}</p>
              <p className="text-white text-sm">Average: {average.toFixed(2)}</p>
            </div>
          )}

          {/* Donut page */}
          {chartPage === 0 && (
            <>
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
                          {chartData.map((_, i) => <Cell key={i} fill={chartData[i].color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{total.toFixed(0)}</span>
                    </div>
                  </div>
                  {/* Date + amount legend on right */}
                  <div className="flex-1 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {chartData.slice(0,8).map((c) => (
                      <div key={c.category} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }}/>
                          <span className="text-muted-foreground text-xs truncate">{c.category}</span>
                        </div>
                        <span className="text-white text-xs font-medium shrink-0">{c.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Line chart page */}
          {chartPage === 1 && (
            <div className="h-44">
              {typeFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <p className="text-sm">No {txType} data for this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 55%)", fontSize: 10 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: "hsl(0 0% 55%)", fontSize: 10 }} axisLine={false} tickLine={false}/>
                    <Tooltip
                      contentStyle={{ background: "#222", border: "none", borderRadius: 8, color: "white", fontSize: 12 }}
                      formatter={(v: number) => [v.toFixed(0), txType]}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(0 72% 60%)" strokeWidth={2} dot={{ fill: "hsl(0 72% 60%)", r: 4 }} activeDot={{ r: 6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Page dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <button onClick={() => setChartPage(0)} className={`w-2 h-2 rounded-full transition-colors ${chartPage === 0 ? "bg-primary" : "bg-[#444]"}`}/>
            <button onClick={() => setChartPage(1)} className={`w-2 h-2 rounded-full transition-colors ${chartPage === 1 ? "bg-primary" : "bg-[#444]"}`}/>
          </div>
        </div>

        {/* Category bars */}
        {chartData.length > 0 && (
          <div className="px-4 flex flex-col gap-3 mt-2">
            {chartData.map((c) => {
              const cat = getCategoryInfo(c.category, txType);
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0" style={{ backgroundColor: c.color + "33" }}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">{c.category} <span className="text-muted-foreground text-xs">{c.pct}%</span></span>
                      <span className="text-white text-sm font-semibold">{c.total.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date range picker */}
      {showDateRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-[#333]">
                <span className="text-white font-medium">Start Time</span>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none [color-scheme:dark]"/>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#333]">
                <span className="text-white font-medium">End Time</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none [color-scheme:dark]"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDateRange(false)} className="flex-1 py-3 rounded-xl bg-[#333] text-white font-semibold text-sm">Cancel</button>
              <button onClick={() => setShowDateRange(false)} className="flex-1 py-3 rounded-xl bg-primary text-black font-semibold text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
