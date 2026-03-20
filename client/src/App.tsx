import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Join from "./pages/Join";
import DesignSystemPage from "./pages/DesignSystem";
import { Layers, LayoutDashboard, Home as HomeIcon, GraduationCap } from "lucide-react";

// Pages that should NOT show the bottom nav (they have their own nav)
const STANDALONE_ROUTES = ["/", "/join"];

// ── Bottom Tab Nav ────────────────────────────────────────────────────────────
function BottomNav() {
  const [location] = useLocation();

  // Hide on standalone pages
  if (STANDALONE_ROUTES.includes(location)) return null;

  const tabs = [
    { href: "/", label: "Home", icon: <HomeIcon size={16} /> },
    { href: "/session", label: "Session Builder", icon: <LayoutDashboard size={16} /> },
    { href: "/join", label: "Join Session", icon: <GraduationCap size={16} /> },
    { href: "/design-system", label: "Design System", icon: <Layers size={16} /> },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid oklch(0.91 0.005 264)",
        display: "flex",
        justifyContent: "center",
        gap: 4,
        padding: "8px 16px 10px",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
      }}
    >
      {tabs.map((tab) => {
        const active = location === tab.href || (tab.href !== "/" && location.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              fontFamily: "'Inter', sans-serif",
              textDecoration: "none",
              transition: "all 0.15s",
              background: active ? "oklch(0.982 0.0107 271.3)" : "transparent",
              color: active ? "oklch(0.55 0.2 250)" : "oklch(0.556 0 0)",
              border: active ? "1px solid oklch(0.88 0.04 250)" : "1px solid transparent",
            }}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  const [location] = useLocation();
  const isStandalone = STANDALONE_ROUTES.includes(location);

  return (
    <>
      <div style={{ paddingBottom: isStandalone ? 0 : 64 }}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/session" component={Home} />
          <Route path="/join" component={Join} />
          <Route path="/design-system" component={DesignSystemPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
