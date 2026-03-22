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
import LiveSession from "./pages/LiveSession";
import StudentSession from "./pages/StudentSession";
import SessionResults from "./pages/SessionResults";
import DesignSystemPage from "./pages/DesignSystem";
import Changelog from "./pages/Changelog";
import Settings from "./pages/Settings";
import { Layers, LayoutDashboard, Home as HomeIcon, GraduationCap, BookOpen, ScrollText, Settings as SettingsIcon, ChevronDown, ChevronUp, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./contexts/ThemeContext";

// ── Bottom Tab Nav ────────────────────────────────────────────────────────────
function BottomNav() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const { theme, toggleTheme } = useTheme();

  // Hide bottom nav on live/student session pages to avoid clutter
  const isFullscreen =
    location.startsWith("/live/") || location.startsWith("/student/session/") || location.startsWith("/results/");
  if (isFullscreen) return null;

  const tabs = [
    { href: "/", label: "Home", icon: <HomeIcon size={16} /> },
    { href: "/session", label: "Session Builder", icon: <LayoutDashboard size={16} /> },
    { href: "/sessions", label: "My Sessions", icon: <BookOpen size={16} /> },
    { href: "/join", label: "Join Session", icon: <GraduationCap size={16} /> },
    { href: "/design-system", label: "Design System", icon: <Layers size={16} /> },
    { href: "/changelog", label: "Changelog", icon: <ScrollText size={16} /> },
    { href: "/settings", label: "Settings", icon: <SettingsIcon size={16} /> },
  ];

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
          border: "1px solid var(--border)",
          borderBottom: "none",
          background: "var(--card)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          cursor: "pointer",
          color: "var(--muted-foreground)",
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
          background: "var(--card)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
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
            color: "var(--muted-foreground)",
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
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Theme toggle */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        )}
      </nav>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  const [location] = useLocation();
  const isFullscreen =
    location.startsWith("/live/") || location.startsWith("/student/session/") || location.startsWith("/results/");

  return (
    <>
      <div style={{ paddingBottom: isFullscreen ? 0 : 64 }}>
        <Switch>
          <Route path="/" component={Landing} />
          {/* Professor routes */}
          <Route path="/session" component={Home} />
          <Route path="/session/:id" component={Home} />
          <Route path="/sessions" component={Sessions} />
          <Route path="/live/:id" component={LiveSession} />
          <Route path="/results/:id" component={SessionResults} />
          {/* Student routes */}
          <Route path="/join" component={Join} />
          <Route path="/join/:code" component={Join} />
          <Route path="/student/session/:id" component={StudentSession} />
          {/* Utility */}
          <Route path="/design-system" component={DesignSystemPage} />
          <Route path="/changelog" component={Changelog} />
          <Route path="/settings" component={Settings} />
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
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
