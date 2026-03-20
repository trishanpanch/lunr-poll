import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DesignSystemPage from "./pages/DesignSystem";
import { Layers, LayoutDashboard } from "lucide-react";

// ── Bottom Tab Nav ────────────────────────────────────────────────────────────
function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    {
      href: "/",
      label: "Session Builder",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: "/design-system",
      label: "Design System",
      icon: <Layers size={18} />,
    },
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
              padding: "7px 20px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              fontFamily: "'Inter', sans-serif",
              textDecoration: "none",
              transition: "all 0.15s",
              background: active ? "oklch(0.95 0.04 264)" : "transparent",
              color: active ? "oklch(0.48 0.18 264)" : "oklch(0.56 0.014 264)",
              border: active ? "1px solid oklch(0.88 0.06 264)" : "1px solid transparent",
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
  return (
    <>
      {/* Add bottom padding so content isn't hidden behind the nav */}
      <div style={{ paddingBottom: 64 }}>
        <Switch>
          <Route path="/" component={Home} />
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
