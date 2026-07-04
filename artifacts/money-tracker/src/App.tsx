import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';

import { dark } from '@clerk/themes';
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import LandingPage from "./pages/landing";
import RecordsPage from "./pages/records";
import ChartsPage from "./pages/charts";
import ReportsPage from "./pages/reports";
import MePage from "./pages/me";
import SettingsPage from "./pages/settings";
import BottomNav from "./components/bottom-nav";
import AddTransactionModal from "./components/add-transaction-modal";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "hsl(48 100% 52%)",
    colorBackground: "#1a1a1a",
    colorInputBackground: "#2a2a2a",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "bg-[#1a1a1a] shadow-xl",
  }
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/records" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

/** Main app layout with bottom nav + add modal */
function AppLayout({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#1a1a1a]">
      <div className="flex-1 overflow-hidden">{children}</div>
      <BottomNav onAddClick={() => setAddOpen(true)} />
      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

/** Full-screen layout (no bottom nav) for sub-pages like Settings */
function FullLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#111]">
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function AuthedRoute({ component: Comp, fullScreen }: { component: React.ComponentType; fullScreen?: boolean }) {
  const Layout = fullScreen ? FullLayout : AppLayout;
  return (
    <>
      <Show when="signed-in">
        <Layout><Comp /></Layout>
      </Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/records" component={() => <AuthedRoute component={RecordsPage} />} />
          <Route path="/charts" component={() => <AuthedRoute component={ChartsPage} />} />
          <Route path="/reports" component={() => <AuthedRoute component={ReportsPage} />} />
          <Route path="/me" component={() => <AuthedRoute component={MePage} />} />
          <Route path="/settings" component={() => <AuthedRoute component={SettingsPage} fullScreen />} />
          <Route path="/dashboard" component={() => <Redirect to="/records" />} />
          <Route path="/expenses" component={() => <Redirect to="/records" />} />
        </Switch>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
