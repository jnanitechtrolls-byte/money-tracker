import { useLocation } from "wouter";

type Props = {
  onAddClick: () => void;
};

const TABS = [
  { path: "/records", label: "Records", icon: RecordsIcon },
  { path: "/charts", label: "Charts", icon: ChartsIcon },
  { path: "/reports", label: "Reports", icon: ReportsIcon },
  { path: "/me", label: "Me", icon: MeIcon },
];

export default function BottomNav({ onAddClick }: Props) {
  const [location, navigate] = useLocation();

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#2a2a2a] flex items-end justify-around h-16 pb-1">
      {left.map((tab) => {
        const active = location === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[60px]"
          >
            <tab.icon active={active} />
            <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Yellow + button in center */}
      <button
        onClick={onAddClick}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg mb-2 shrink-0"
        aria-label="Add transaction"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="hsl(0 0% 8%)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {right.map((tab) => {
        const active = location === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[60px]"
          >
            <tab.icon active={active} />
            <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function RecordsIcon({ active }: { active: boolean }) {
  const c = active ? "hsl(48 100% 52%)" : "hsl(0 0% 55%)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={c} strokeWidth="1.8" />
      <path d="M7 8h10M7 12h10M7 16h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartsIcon({ active }: { active: boolean }) {
  const c = active ? "hsl(48 100% 52%)" : "hsl(0 0% 55%)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <path d="M12 12L12 3" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12L19.5 16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ReportsIcon({ active }: { active: boolean }) {
  const c = active ? "hsl(48 100% 52%)" : "hsl(0 0% 55%)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H9z" stroke={c} strokeWidth="1.8" />
      <path d="M13 3v5h5M7 13h10M7 17h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MeIcon({ active }: { active: boolean }) {
  const c = active ? "hsl(48 100% 52%)" : "hsl(0 0% 55%)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
