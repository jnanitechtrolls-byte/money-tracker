import { useState } from "react";
import { useLocation } from "wouter";

type ToggleItem = { icon: string; label: string; key: string };
type LinkItem = { icon: string; label: string; vip?: boolean };

const SETTINGS_SECTIONS: Array<{ title?: string; items: Array<{ icon: string; label: string; vip?: boolean; toggle?: string }> }> = [
  {
    items: [
      { icon: "🎵", label: "Sound Effect", toggle: "sound" },
      { icon: "9️⃣", label: "Thousands separator", toggle: "thousands" },
      { icon: "🌐", label: "Language" },
    ],
  },
];

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notif: true,
    sound: true,
    thousands: true,
    ai: true,
  });

  function toggle(key: string) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2a2a2a]">
        <button onClick={() => navigate("/me")} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l7-7m-7 7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-white font-bold text-base">Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {SETTINGS_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-2" : ""}>
            {section.items.map((item, ii) => {
              const isFirst = ii === 0;
              const isLast = ii === section.items.length - 1;
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 bg-[#1a1a1a] border-b border-[#2a2a2a] ${
                    isFirst ? "border-t border-t-[#2a2a2a]" : ""
                  } active:bg-[#222] transition-colors`}
                  onClick={() => item.toggle ? toggle(item.toggle) : undefined}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: "hsl(48 100% 52% / 0.15)" }}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left text-white text-sm">{item.label}</span>
                  {item.vip && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1"
                      style={{ background: "hsl(48 100% 52% / 0.2)", color: "hsl(48 100% 52%)" }}>
                      VIP
                    </span>
                  )}
                  {item.toggle ? (
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                        toggles[item.toggle] ? "bg-primary" : "bg-[#333]"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        toggles[item.toggle] ? "translate-x-5" : "translate-x-1"
                      }`} />
                    </div>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 40%)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
