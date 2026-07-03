import { useState } from "react";

type DayData = { expenses: number; income: number };

type Props = {
  open: boolean;
  onClose: () => void;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (m: string) => void;
  dayData: Map<string, DayData>;
  onDaySelect?: (date: string) => void;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function CalendarModal({ open, onClose, selectedMonth, onMonthChange, dayData, onDaySelect }: Props) {
  if (!open) return null;

  const [year, month] = selectedMonth.split("-").map(Number);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    const d = new Date(year, month - 2, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function nextMonth() {
    const d = new Date(year, month, 1);
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
        <button onClick={onClose} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l7-7m-7 7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-white font-bold text-base">Calendar</span>
        <button
          onClick={() => {
            const now = new Date();
            onMonthChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="flex items-center gap-1 text-white text-sm font-medium"
        >
          {MONTHS[month - 1]} {year}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="p-2 text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-white font-semibold">{MONTHS[month - 1]} {year}</span>
        <button onClick={nextMonth} className="p-2 text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-2 flex-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const data = dayData.get(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={i}
              onClick={() => { onDaySelect?.(dateStr); onClose(); }}
              className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                isToday ? "bg-[#2a3a2a]" : "hover:bg-[#222]"
              }`}
            >
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                isToday ? "bg-[#2d6a4f] text-white" : "text-white"
              }`}>
                {day}
              </span>
              {data && data.expenses > 0 && (
                <span className="text-[9px] text-red-400 mt-0.5 font-medium">{data.expenses.toFixed(0)}</span>
              )}
              {data && data.income > 0 && (
                <span className="text-[9px] text-green-400 font-medium">{data.income.toFixed(0)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* FAB */}
      <div className="p-4 pb-8 flex justify-end">
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
