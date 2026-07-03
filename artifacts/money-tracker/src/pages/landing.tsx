import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const features = [
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Track every penny",
    desc: "Log expenses in seconds with categories that make sense.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Live on any device",
    desc: "Open on your phone, laptop, or a friend's browser — always up to date.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Spending at a glance",
    desc: "See where your money goes with clear category breakdowns.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Private and secure",
    desc: "Your data lives in your account — nobody else sees it.",
  },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Nav */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <img src={`${basePath}/logo.svg`} alt="Logo" className="h-8 w-8" />
          <span className="font-semibold text-lg tracking-tight">Spendly</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="button-sign-in"
            onClick={() => setLocation("/sign-in")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </button>
          <button
            data-testid="button-get-started"
            onClick={() => setLocation("/sign-up")}
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started free
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-8">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          Free forever, no credit card needed
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
          Know where your<br />
          <span className="text-primary">money actually goes</span>
        </h1>

        <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md">
          A simple, honest expense tracker. Add expenses in seconds, see your spending by category, and sync across every device in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            data-testid="button-hero-signup"
            onClick={() => setLocation("/sign-up")}
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity shadow-sm"
          >
            Start tracking for free
          </button>
          <button
            data-testid="button-hero-signin"
            onClick={() => setLocation("/sign-in")}
            className="bg-muted text-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-muted/80 transition-colors"
          >
            I have an account
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-20 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">{f.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        Your expenses, your data. Simple as that.
      </footer>
    </div>
  );
}
