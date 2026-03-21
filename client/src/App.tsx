import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Join from "./pages/Join";
import Sessions from "./pages/Sessions";
import DesignSystemPage from "./pages/DesignSystem";
import Changelog from "./pages/Changelog";
import { Layers, LayoutDashboard, Home as HomeIcon, GraduationCap, BookOpen, ScrollText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// ── Bottom Tab Nav ────────────────────────────────────────────────────────────
function BottomNav() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const tabs = [
    { href: "/", label: "Home", icon: <HomeIcon size={16} /> },
    { href: "/session", label: "Session Builder", icon: <LayoutDashboard size={16} /> },
    { href: "/sessions", label: "My Sessions", icon: <BookOpen size={16} /> },
    { href: "/join", label: "Join Session", icon: <GraduationCap size={16} /> },
    { href: "/design-system", label: "Design System", icon: <Layers size={16} /> },
    { href: "/changelog", label: "Changelog", icon: <ScrollText size={16} /> },
  ];

  // make sure to consider if you need authentication for certain routes
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Pull tab */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Show navigation" : "Hide navigation"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 20,
          borderRadius: "8px 8px 0 0",
          border: "1px solid oklch(0.91 0.005 264)",
          borderBottom: "none",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          cursor: "pointer",
          color: "oklch(0.65 0 0)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
          transition: "color 0.15s",
          padding: 0,
          marginBottom: -1,
        }}
      >
        {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Nav bar */}
      <nav
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid oklch(0.91 0.005 264)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: collapsed ? "0 16px" : "8px 16px 10px",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
          overflow: "hidden",
          maxHeight: collapsed ? 0 : 64,
          transition: "max-height 0.25s ease, padding 0.25s ease",
        }}
      >
        {/* Dev mode label */}
        <span
          style={{
            fontSize: 11,
            fontFamily: "'Geist Mono', 'Fira Mono', monospace",
            color: "oklch(0.65 0 0)",
            whiteSpace: "nowrap",
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          (dev mode)
        </span>

        {/* Tabs — centered */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 4 }}>
          {tabs.map((tab) => {
            const active = location === tab.href || (tab.href !== "/" && location.startsWith(tab.href + "/"));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "7px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: active ? 700 : 400,
                  fontFamily: "'Geist Mono', 'Fira Mono', monospace",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  background: active ? "oklch(0.982 0.0107 271.3)" : "transparent",
                  color: active ? "oklch(0.55 0.2 250)" : "oklch(0.556 0 0)",
                  border: active ? "1px solid oklch(0.88 0.04 250)" : "1px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  return (
    <>
      <div style={{ paddingBottom: 64 }}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/session" component={Home} />
          <Route path="/sessions" component={Sessions} />
          <Route path="/join" component={Join} />
          <Route path="/design-system" component={DesignSystemPage} />
          <Route path="/changelog" component={Changelog} />
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
