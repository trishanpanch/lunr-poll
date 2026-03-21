/**
 * Sessions Dashboard — "My Sessions"
 * Design: Indigo primary, clean card grid, status-aware actions.
 * Shown after tapping "Launch Session" from the builder.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Plus, Rocket, ListChecks, Type, Paperclip, Star,
  Clock, CheckCircle2, XCircle, ChevronRight, Search,
  BarChart2, BookOpen, Trash2, MoreHorizontal,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type SessionStatus = "draft" | "live" | "closed";

interface StoredSession {
  id: string;
  name: string;
  code: string;
  questionCount: number;
  status: SessionStatus;
  createdAt: number; // timestamp
  questionTypes: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem("lunr_sessions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: StoredSession[]) {
  localStorage.setItem("lunr_sessions", JSON.stringify(sessions));
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SessionStatus }) {
  const config = {
    draft: {
      label: "Draft",
      bg: "oklch(0.97 0.06 80)",
      color: "oklch(0.52 0.18 70)",
      border: "oklch(0.88 0.08 80)",
      icon: <Clock size={10} />,
    },
    live: {
      label: "Live",
      bg: "oklch(0.94 0.08 160)",
      color: "oklch(0.38 0.14 160)",
      border: "oklch(0.82 0.1 160)",
      icon: <CheckCircle2 size={10} />,
    },
    closed: {
      label: "Closed",
      bg: "oklch(0.96 0 0)",
      color: "oklch(0.5 0 0)",
      border: "oklch(0.88 0 0)",
      icon: <XCircle size={10} />,
    },
  }[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 20,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ── Question type icon strip ───────────────────────────────────────────────────
function TypeIcons({ types }: { types: string[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    "Short Text": <Type size={11} />,
    "Multiple Choice": <ListChecks size={11} />,
    "File Upload": <Paperclip size={11} />,
    "Star Rating": <Star size={11} />,
  };
  const unique = Array.from(new Set(types));
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {unique.map((t) => (
        <span
          key={t}
          title={t}
          style={{
            width: 20, height: 20, borderRadius: 5,
            background: "oklch(0.96 0.03 264)",
            color: "oklch(0.48 0.18 264)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {iconMap[t] ?? <Type size={11} />}
        </span>
      ))}
    </div>
  );
}

// ── Session Card ───────────────────────────────────────────────────────────────
function SessionCard({
  session,
  onEdit,
  onDelete,
  onViewResults,
  onGoLive,
  onEndSession,
}: {
  session: StoredSession;
  onEdit: () => void;
  onDelete: () => void;
  onViewResults: () => void;
  onGoLive: () => void;
  onEndSession: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1.5px solid oklch(0.922 0 0)",
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s, border-color 0.15s",
        position: "relative",
      }}
      className="hover:shadow-md hover:border-[oklch(0.88_0.04_264)] transition-all"
    >
      {/* Top row: code + status + menu */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "'Geist Mono', monospace",
              color: "oklch(0.48 0.18 264)",
              background: "oklch(0.96 0.03 264)",
              border: "1px solid oklch(0.88 0.04 264)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {session.code}
          </span>
          <StatusBadge status={session.status} />
        </div>

        {/* Overflow menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "oklch(0.75 0 0)", padding: "4px 5px", borderRadius: 7,
              display: "flex", alignItems: "center",
            }}
            className="hover:bg-[oklch(0.96_0_0)] hover:text-[oklch(0.4_0_0)] transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 4px)",
                  background: "#fff", borderRadius: 10, border: "1.5px solid oklch(0.922 0 0)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 20,
                  minWidth: 148, overflow: "hidden",
                  fontFamily: "'Geist', system-ui, sans-serif",
                }}
              >
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "oklch(0.205 0 0)", cursor: "pointer", textAlign: "left" }}
                  className="hover:bg-[oklch(0.982_0.0107_271.3)] transition-colors"
                >
                  <BookOpen size={13} /> Edit Session
                </button>
                {session.status === "closed" && (
                  <button
                    onClick={() => { onViewResults(); setMenuOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "oklch(0.205 0 0)", cursor: "pointer", textAlign: "left" }}
                    className="hover:bg-[oklch(0.982_0.0107_271.3)] transition-colors"
                  >
                    <BarChart2 size={13} /> View Results
                  </button>
                )}
                <div style={{ height: 1, background: "oklch(0.94 0 0)", margin: "2px 0" }} />
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "oklch(0.577 0.245 27.325)", cursor: "pointer", textAlign: "left" }}
                  className="hover:bg-[oklch(0.97_0.02_27)] transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session name */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "oklch(0.145 0 0)",
          margin: "0 0 4px",
          fontFamily: "'Geist', system-ui, sans-serif",
          lineHeight: 1.35,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {session.name}
      </h3>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: "oklch(0.6 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>
          {session.questionCount} {session.questionCount === 1 ? "question" : "questions"}
        </span>
        <span style={{ fontSize: 11, color: "oklch(0.78 0 0)" }}>·</span>
        <span style={{ fontSize: 12, color: "oklch(0.7 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>
          {timeAgo(session.createdAt)}
        </span>
        {session.questionTypes.length > 0 && (
          <>
            <span style={{ fontSize: 11, color: "oklch(0.78 0 0)" }}>·</span>
            <TypeIcons types={session.questionTypes} />
          </>
        )}
      </div>

      {/* Action button(s) */}
      <div style={{ display: "flex", gap: 8 }}>
        {session.status === "draft" && (
          <>
            <button
              onClick={onEdit}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10,
                background: "oklch(0.982 0.0107 271.3)",
                border: "1.5px solid oklch(0.88 0.04 264)",
                color: "oklch(0.45 0.22 264)", fontSize: 13, fontWeight: 600,
                fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[oklch(0.96_0.04_264)] transition-colors"
            >
              Edit Session <ChevronRight size={14} />
            </button>
            {session.questionCount > 0 && (
              <button
                onClick={onGoLive}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 14px", borderRadius: 10,
                  background: "linear-gradient(135deg, oklch(0.514 0.2 13.9) 0%, oklch(0.44 0.2 13.9) 100%)",
                  border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                  boxShadow: "0 2px 8px oklch(0.514 0.2 13.9 / 0.28)",
                  transition: "opacity 0.15s",
                }}
                className="hover:opacity-90 transition-opacity"
                title="Go live with this session"
              >
                <Rocket size={13} />
              </button>
            )}
          </>
        )}
        {session.status === "live" && (
          <div style={{ display: "flex", gap: 8, flex: 1 }}>
            <button
              onClick={onViewResults}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10,
                background: "oklch(0.94 0.08 160)",
                border: "1.5px solid oklch(0.82 0.1 160)",
                color: "oklch(0.38 0.14 160)", fontSize: 13, fontWeight: 600,
                fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[oklch(0.9_0.1_160)] transition-colors"
            >
              <BarChart2 size={13} /> Live Results <ChevronRight size={14} />
            </button>
            <button
              onClick={onEndSession}
              title="End this session"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10,
                background: "oklch(0.97 0.02 10)",
                border: "1.5px solid oklch(0.88 0.06 10)",
                color: "oklch(0.5 0.18 10)", fontSize: 13, fontWeight: 600,
                fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              className="hover:bg-[oklch(0.94_0.04_10)] transition-colors"
            >
              End Session
            </button>
          </div>
        )}
        {session.status === "closed" && (
          <button
            onClick={onViewResults}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 14px", borderRadius: 10,
              background: "oklch(0.96 0 0)",
              border: "1.5px solid oklch(0.88 0 0)",
              color: "oklch(0.45 0 0)", fontSize: 13, fontWeight: 600,
              fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
              transition: "all 0.15s",
            }}
            className="hover:bg-[oklch(0.93_0_0)] transition-colors"
          >
            <BarChart2 size={13} /> View Results <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 24px", textAlign: "center", gap: 12,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 4 }}>📋</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "oklch(0.205 0 0)", margin: 0, fontFamily: "'Geist', system-ui, sans-serif" }}>
        No sessions yet
      </h3>
      <p style={{ fontSize: 14, color: "oklch(0.6 0 0)", margin: 0, maxWidth: 280, lineHeight: 1.6, fontFamily: "'Geist', system-ui, sans-serif" }}>
        Build your first session and it'll appear here. Launch it when you're ready to teach.
      </p>
      <button
        onClick={onNew}
        style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 7,
          padding: "10px 22px", borderRadius: 10,
          background: "oklch(0.45 0.22 264)", color: "#fff",
          fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
          fontFamily: "'Geist', system-ui, sans-serif",
          boxShadow: "0 2px 10px oklch(0.45 0.22 264 / 0.3)",
        }}
        className="hover:opacity-90 transition-opacity"
      >
        <Plus size={15} /> New Session
      </button>
    </div>
  );
}

// ── Filter Tabs ────────────────────────────────────────────────────────────────
type Filter = "all" | SessionStatus;

function FilterTabs({ active, counts, onChange }: {
  active: Filter;
  counts: Record<Filter, number>;
  onChange: (f: Filter) => void;
}) {
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Drafts" },
    { key: "live", label: "Live" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div style={{ display: "flex", gap: 4, background: "oklch(0.96 0.005 264)", borderRadius: 10, padding: 3 }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 8,
              background: isActive ? "#fff" : "transparent",
              color: isActive ? "oklch(0.45 0.22 264)" : "oklch(0.6 0 0)",
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              border: "none", cursor: "pointer",
              fontFamily: "'Geist', system-ui, sans-serif",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span style={{
                fontSize: 10.5, fontWeight: 700,
                background: isActive ? "oklch(0.96 0.04 264)" : "oklch(0.9 0 0)",
                color: isActive ? "oklch(0.45 0.22 264)" : "oklch(0.6 0 0)",
                padding: "1px 6px", borderRadius: 20,
              }}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Sessions() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<StoredSession[]>(() => loadSessions());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  // On mount, pick up any just-launched session from Home
  useEffect(() => {
    const pending = localStorage.getItem("lunr_pending_session");
    if (pending) {
      try {
        const s: StoredSession = JSON.parse(pending);
        setSessions((prev) => {
          // Replace if same id, else prepend
          const exists = prev.find((p) => p.id === s.id);
          const updated = exists ? prev.map((p) => p.id === s.id ? s : p) : [s, ...prev];
          saveSessions(updated);
          return updated;
        });
      } catch {}
      localStorage.removeItem("lunr_pending_session");
    }
  }, []);

  const handleDelete = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
  };

  const handleGoLive = (id: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, status: "live" as SessionStatus } : s);
      saveSessions(updated);
      return updated;
    });
  };

  const handleEndSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, status: "closed" as SessionStatus } : s);
      saveSessions(updated);
      return updated;
    });
  };

  const counts: Record<Filter, number> = {
    all: sessions.length,
    draft: sessions.filter((s) => s.status === "draft").length,
    live: sessions.filter((s) => s.status === "live").length,
    closed: sessions.filter((s) => s.status === "closed").length,
  };

  const filtered = sessions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.982 0.0107 271.3)",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.922 0 0)",
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "oklch(0.145 0 0)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            My Sessions
          </h1>
          <p style={{ fontSize: 12, color: "oklch(0.6 0 0)", margin: 0 }}>
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"} total
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: "oklch(0.65 0 0)", pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search sessions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: 36, paddingLeft: 30, paddingRight: 12,
                borderRadius: 9, border: "1.5px solid oklch(0.922 0 0)",
                fontSize: 13, color: "oklch(0.205 0 0)",
                background: "oklch(0.982 0.0107 271.3)",
                outline: "none", width: 200,
                fontFamily: "'Geist', system-ui, sans-serif",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.45 0.22 264)";
                e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.45 0.22 264 / 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.922 0 0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* New Session */}
          <button
            onClick={() => { localStorage.setItem("lunr_new_session", "true"); navigate("/session"); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 18px", borderRadius: 10,
              background: "linear-gradient(135deg, oklch(0.514 0.2 13.9) 0%, oklch(0.44 0.2 13.9) 100%)",
              color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              boxShadow: "0 2px 10px oklch(0.514 0.2 13.9 / 0.28)",
              transition: "opacity 0.15s",
            }}
            className="hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> New Session
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>
        {sessions.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <FilterTabs active={filter} counts={counts} onChange={setFilter} />
          </div>
        )}

        {filtered.length === 0 && sessions.length === 0 ? (
          <EmptyState onNew={() => { localStorage.setItem("lunr_new_session", "true"); navigate("/session"); }} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "oklch(0.6 0 0)", fontSize: 14 }}>
            No sessions match your search.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={() => { localStorage.setItem("lunr_edit_session", session.id); navigate("/session"); }}
                onDelete={() => handleDelete(session.id)}
                onViewResults={() => {}}
                onGoLive={() => handleGoLive(session.id)}
                onEndSession={() => handleEndSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
