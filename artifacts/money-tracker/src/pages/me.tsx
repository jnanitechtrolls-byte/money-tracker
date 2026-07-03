import { useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";

export default function MePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();

  const menuItems = [
    { icon: "⚙️", label: "Settings", action: () => navigate("/settings") },
    { icon: "🔁", label: "Regular Payments", action: () => navigate("/settings") },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-white font-bold text-base text-center mb-4">Me</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 flex flex-col gap-4">
        {/* Profile card */}
        <div className="flex items-center gap-4 bg-[#222] rounded-2xl p-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#333] shrink-0 flex items-center justify-center">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-muted-foreground">👤</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-base">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}
            </p>
            <p className="text-muted-foreground text-sm">
              {user?.primaryEmailAddress?.emailAddress || "Sign in to sync"}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Menu items */}
        <div className="bg-[#222] rounded-2xl overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-4 active:bg-[#2a2a2a] transition-colors ${
                i < menuItems.length - 1 ? "border-b border-[#2a2a2a]" : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-left text-white text-sm">{item.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut().then(() => navigate("/"))}
          className="bg-[#222] rounded-2xl py-4 px-4 flex items-center gap-3 active:bg-[#2a2a2a] transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="flex-1 text-left text-red-400 text-sm font-medium">Sign Out</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="hsl(0 0% 55%)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
