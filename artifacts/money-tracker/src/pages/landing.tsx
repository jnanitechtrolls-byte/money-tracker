import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💛</span>
          <span className="text-white font-bold text-lg">Money Tracker</span>
        </div>
        <button
          onClick={() => setLocation("/sign-in")}
          className="text-primary text-sm font-semibold"
        >
          Sign In
        </button>
      </header>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-6 pb-16">
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-5xl mb-2 shadow-lg shadow-primary/30">
          💰
        </div>

        <div>
          <h1 className="text-white text-4xl font-extrabold mb-3 leading-tight">
            Track Every<br />
            <span className="text-primary">Penny</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">
            Log expenses and income in seconds. Beautiful charts. Synced everywhere.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          {[
            { icon: "📊", text: "Beautiful spending charts" },
            { icon: "🔄", text: "Real-time sync across devices" },
            { icon: "📁", text: "Expense & income tracking" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 bg-[#222] rounded-xl px-4 py-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-white text-sm font-medium">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button
            onClick={() => setLocation("/sign-up")}
            className="w-full py-3.5 rounded-full bg-primary text-black font-bold text-base shadow-lg shadow-primary/30"
          >
            Get Started Free
          </button>
          <button
            onClick={() => setLocation("/sign-in")}
            className="w-full py-3.5 rounded-full bg-[#222] text-white font-semibold text-base"
          >
            I have an account
          </button>
        </div>
      </div>
    </div>
  );
}
