/**
 * Sessions Dashboard — "My Sessions"
 * DB-backed via tRPC. No login required for testing.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Rocket, ListChecks, Type, Paperclip, Star,
  Clock, CheckCircle2, XCircle, ChevronRight, Search,
  BarChart2, BookOpen, Trash2, MoreHorizontal, Loader2,
  ToggleLeft, QrCode, Copy, Link2, History, LayoutGrid, Settings,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import QRCode from "qrcode";

// ── Types ──────────────────────────────────────────────────────────────────────
type SessionStatus = "draft" | "live" | "closed";
type DashboardTab = "active" | "past";

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(ts: Date | string | number): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(ts: Date | string | number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SessionStatus }) {
  const config = {
    draft: {
      label: "Draft",
      bg: "var(--amber-light)",
      color: "var(--amber)",
      border: "var(--amber-border)",
      icon: <Clock size={10} />,
    },
    live: {
      label: "Live",
      bg: "var(--green-light)",
      color: "var(--green)",
      border: "var(--green-border)",
      icon: <CheckCircle2 size={10} />,
    },
    closed: {
      label: "Closed",
      bg: "var(--muted)",
      color: "var(--muted-foreground)",
      border: "var(--border)",
      icon: <XCircle size={10} />,
    },
  }[status];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: 20,
      background: config.bg, color: config.color, border: `1px solid ${config.border}`,
      fontFamily: "'Geist', system-ui, sans-serif",
    }}>
      {config.icon} {config.label}
    </span>
  );
}

// ── Question type icon strip ───────────────────────────────────────────────────
function TypeIcons({ questions }: { questions: { type: string }[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    "Text": <Type size={11} />,
    "Multiple Choice": <ListChecks size={11} />,
    "File Upload": <Paperclip size={11} />,
    "Star Rating": <Star size={11} />,
    "True / False": <ToggleLeft size={11} />,
  };
  const types = Array.from(new Set(questions.map((q) => q.type)));
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {types.map((t) => (
        <span key={t} title={t} style={{
          width: 20, height: 20, borderRadius: 5,
          background: "var(--indigo-light)", color: "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {iconMap[t] ?? <Type size={11} />}
        </span>
      ))}
    </div>
  );
}

// ── QR Popover ─────────────────────────────────────────────────────────────────
function QRPopover({ code, onClose }: { code: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState("");
  const joinUrl = `${window.location.origin}/join?code=${code}`;
  useState(() => {
    QRCode.toDataURL(joinUrl, { width: 180, margin: 2 }).then(setDataUrl);
  });
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--card)", borderRadius: 16, padding: "24px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxWidth: 280, width: "100%" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>Scan to Join</p>
        {dataUrl ? <img src={dataUrl} alt="QR" style={{ width: 160, height: 160, borderRadius: 8 }} /> : <Loader2 size={24} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />}
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 20, fontWeight: 800, letterSpacing: "0.15em", color: "var(--primary)" }}>{code}</span>
        <button onClick={onClose} style={{ fontSize: 12, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>Close</button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Session Card (active: draft/live) ─────────────────────────────────────────
function SessionCard({
  session,
  onEdit,
  onDelete,
  onGoLive,
  onViewLive,
}: {
  session: {
    id: number;
    name: string;
    code: string;
    status: SessionStatus;
    questions: { type: string }[];
    updatedAt: Date;
  };
  onEdit: () => void;
  onDelete: () => void;
  onGoLive: () => void;
  onViewLive: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}/join?code=${session.code}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success("Join link copied!");
  };

  return (
    <>
      <div style={{
        background: "var(--card)", borderRadius: 16, border: "1.5px solid var(--border)",
        padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 0,
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)", transition: "box-shadow 0.15s, border-color 0.15s",
        position: "relative",
      }}
        className="hover:shadow-md hover:border-[var(--primary)] transition-all"
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              fontFamily: "'Geist Mono', monospace", color: "var(--primary)",
              background: "var(--indigo-light)", border: "1px solid var(--border)",
              padding: "2px 8px", borderRadius: 6,
            }}>
              {session.code}
            </span>
            <StatusBadge status={session.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setShowQR(true)}
              title="Show QR code"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px 5px", borderRadius: 7, display: "flex", alignItems: "center" }}
              className="hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              <QrCode size={15} />
            </button>
            <button
              onClick={handleCopyLink}
              title="Copy join link"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px 5px", borderRadius: 7, display: "flex", alignItems: "center" }}
              className="hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              <Link2 size={15} />
            </button>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px 5px", borderRadius: 7, display: "flex", alignItems: "center" }}
                className="hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 4px)",
                    background: "var(--card)", borderRadius: 10, border: "1.5px solid var(--border)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 148, overflow: "hidden",
                    fontFamily: "'Geist', system-ui, sans-serif",
                  }}>
                    <button onClick={() => { onEdit(); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "var(--foreground)", cursor: "pointer", textAlign: "left" }} className="hover:bg-[oklch(0.982_0.0107_271.3)] transition-colors">
                      <BookOpen size={13} /> Edit Session
                    </button>
                    <div style={{ height: 1, background: "var(--muted)", margin: "2px 0" }} />
                    <button onClick={() => { onDelete(); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "var(--destructive)", cursor: "pointer", textAlign: "left" }} className="hover:bg-[var(--destructive-light)] transition-colors">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <h3 style={{
          fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px",
          fontFamily: "'Geist', system-ui, sans-serif", lineHeight: 1.35,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {session.name}
        </h3>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>
            {session.questions.length} {session.questions.length === 1 ? "question" : "questions"}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>
            {timeAgo(session.updatedAt)}
          </span>
          {session.questions.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
              <TypeIcons questions={session.questions} />
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {session.status === "draft" && (
            <>
              <button
                onClick={onEdit}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 14px", borderRadius: 10, background: "var(--background)",
                  border: "1.5px solid var(--border)", color: "var(--primary)",
                  fontSize: 13, fontWeight: 600, fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                className="hover:bg-[var(--indigo-light)] transition-colors"
              >
                Edit Session <ChevronRight size={14} />
              </button>
              {session.questions.length > 0 && (
                <button
                  onClick={onGoLive}
                  title="Go live"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 14px", borderRadius: 10,
                    background: "linear-gradient(135deg, var(--crimson) 0%, var(--crimson-hover) 100%)",
                    border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                    fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                    boxShadow: "0 2px 8px oklch(0.514 0.2 13.9 / 0.28)", transition: "opacity 0.15s",
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <Rocket size={13} />
                </button>
              )}
            </>
          )}
          {session.status === "live" && (
            <button
              onClick={onViewLive}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10, background: "var(--green-light)",
                border: "1.5px solid var(--green-border)", color: "var(--green)",
                fontSize: 13, fontWeight: 600, fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[var(--green-light)] transition-colors"
            >
              <BarChart2 size={13} /> Live Results <ChevronRight size={14} />
            </button>
          )}
          {session.status === "closed" && (
            <button
              onClick={onViewLive}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 14px", borderRadius: 10, background: "var(--muted)",
                border: "1.5px solid var(--border)", color: "var(--muted-foreground)",
                fontSize: 13, fontWeight: 600, fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[var(--muted)] transition-colors"
            >
              <BarChart2 size={13} /> View Results <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {showQR && <QRPopover code={session.code} onClose={() => setShowQR(false)} />}
    </>
  );
}

// ── Past Session Row ───────────────────────────────────────────────────────────
function PastSessionRow({
  session,
  onViewResults,
  onDelete,
}: {
  session: {
    id: number;
    name: string;
    code: string;
    status: SessionStatus;
    questions: { type: string }[];
    updatedAt: Date;
    closedAt?: Date | null;
    launchedAt?: Date | null;
  };
  onViewResults: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}/join?code=${session.code}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success("Join link copied!");
  };

  return (
    <div style={{
      background: "var(--card)", borderRadius: 12, border: "1.5px solid var(--border)",
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)", transition: "box-shadow 0.15s, border-color 0.15s",
    }}
      className="hover:shadow-md hover:border-[var(--border)] transition-all"
    >
      {/* Left: name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "var(--foreground)",
          fontFamily: "'Geist', system-ui, sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {session.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            fontFamily: "'Geist Mono', monospace", color: "var(--muted-foreground)",
          }}>
            {session.code}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            {session.questions.length} {session.questions.length === 1 ? "question" : "questions"}
          </span>
          {session.questions.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
              <TypeIcons questions={session.questions} />
            </>
          )}
        </div>
      </div>

      {/* Dates */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>
          Closed {formatDate(session.closedAt ?? session.updatedAt)}
        </p>
        {session.launchedAt && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted-foreground)" }}>
            Launched {formatDate(session.launchedAt)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleCopyLink}
          title="Copy join link"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "5px 6px", borderRadius: 7, display: "flex", alignItems: "center" }}
          className="hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={onViewResults}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 9,
            background: "var(--indigo-light)", border: "1.5px solid var(--border)",
            color: "var(--primary)", fontSize: 13, fontWeight: 600,
            fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
            transition: "all 0.15s",
          }}
          className="hover:bg-[var(--indigo-light)] transition-colors"
        >
          <BarChart2 size={13} /> View Results
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "5px 6px", borderRadius: 7, display: "flex", alignItems: "center" }}
            className="hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 4px)",
                background: "var(--card)", borderRadius: 10, border: "1.5px solid var(--border)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 140, overflow: "hidden",
                fontFamily: "'Geist', system-ui, sans-serif",
              }}>
                <button onClick={() => { onDelete(); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "var(--destructive)", cursor: "pointer", textAlign: "left" }} className="hover:bg-[var(--destructive-light)] transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", gap: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 4 }}>📋</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: 0, fontFamily: "'Geist', system-ui, sans-serif" }}>
        No sessions yet
      </h3>
      <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0, maxWidth: 280, lineHeight: 1.6, fontFamily: "'Geist', system-ui, sans-serif" }}>
        Build your first session and it'll appear here. Launch it when you're ready to teach.
      </p>
      <button
        onClick={onNew}
        style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 7,
          padding: "10px 22px", borderRadius: 10, background: "var(--primary)",
          color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
          fontFamily: "'Geist', system-ui, sans-serif", boxShadow: "0 2px 10px oklch(0.45 0.22 264 / 0.3)",
        }}
        className="hover:opacity-90 transition-opacity"
      >
        <Plus size={15} /> New Session
      </button>
    </div>
  );
}

function EmptyPastState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", gap: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 4 }}>📊</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", margin: 0, fontFamily: "'Geist', system-ui, sans-serif" }}>
        No past sessions yet
      </h3>
      <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0, maxWidth: 300, lineHeight: 1.6, fontFamily: "'Geist', system-ui, sans-serif" }}>
        Closed sessions will appear here with their full response history and analytics.
      </p>
    </div>
  );
}

// ── Filter Tabs (for active tab) ───────────────────────────────────────────────
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
    <div style={{ display: "flex", gap: 4, background: "var(--muted)", borderRadius: 10, padding: 3 }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 8,
              background: isActive ? "var(--card)" : "transparent",
              color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              fontSize: 13, fontWeight: isActive ? 600 : 500, border: "none", cursor: "pointer",
              fontFamily: "'Geist', system-ui, sans-serif",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span style={{
                fontSize: 10.5, fontWeight: 700,
                background: isActive ? "var(--indigo-light)" : "var(--border)",
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
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
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [dashTab, setDashTab] = useState<DashboardTab>("active");
  const { loading: authLoading } = useAuth();

  const utils = trpc.useUtils();
  const { data: sessions, isLoading } = trpc.session.list.useQuery(undefined, {
    enabled: !authLoading,
  });

  const deleteMut = trpc.session.delete.useMutation({
    onSuccess: () => {
      utils.session.list.invalidate();
      toast.success("Session deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const launchMut = trpc.session.launch.useMutation({
    onSuccess: (data) => {
      utils.session.list.invalidate();
      if (data) navigate(`/live/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading || isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <Loader2 size={28} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const allSessions = (sessions ?? []) as {
    id: number;
    name: string;
    code: string;
    status: "draft" | "live" | "closed";
    questions: { type: string }[];
    updatedAt: Date;
    closedAt?: Date | null;
    launchedAt?: Date | null;
  }[];

  // Active = draft + live; Past = closed
  const activeSessions = allSessions.filter((s) => s.status !== "closed");
  const pastSessions = allSessions.filter((s) => s.status === "closed");

  const counts: Record<Filter, number> = {
    all: activeSessions.length,
    draft: activeSessions.filter((s) => s.status === "draft").length,
    live: activeSessions.filter((s) => s.status === "live").length,
    closed: activeSessions.filter((s) => s.status === "closed").length,
  };

  const filteredActive = activeSessions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPast = pastSessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "color-mix(in oklch, var(--card) 88%, transparent)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)", padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            My Sessions
          </h1>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>
            {activeSessions.length} active · {pastSessions.length} past
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search sessions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: 36, paddingLeft: 30, paddingRight: 12, borderRadius: 9,
                border: "1.5px solid var(--border)", fontSize: 13, color: "var(--foreground)",
                background: "var(--background)", outline: "none", width: 200,
                fontFamily: "'Geist', system-ui, sans-serif", transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>
          <button
            onClick={() => navigate("/settings")}
            title="Settings"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 9,
              background: "none", border: "1.5px solid var(--border)",
              color: "var(--muted-foreground)", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => navigate("/session")}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 10,
              background: "linear-gradient(135deg, var(--crimson) 0%, var(--crimson-hover) 100%)",
              color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              boxShadow: "0 2px 10px oklch(0.514 0.2 13.9 / 0.28)", transition: "opacity 0.15s",
            }}
            className="hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> New Session
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>

        {/* Dashboard Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: 24 }}>
          {([
            { key: "active" as DashboardTab, label: "Active Sessions", icon: <LayoutGrid size={14} />, count: activeSessions.length },
            { key: "past" as DashboardTab, label: "Past Sessions", icon: <History size={14} />, count: pastSessions.length },
          ]).map((tab) => {
            const isActive = dashTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setDashTab(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "10px 20px", background: "none", border: "none",
                  borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                  marginBottom: -2,
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  fontSize: 14, fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                    background: isActive ? "var(--indigo-light)" : "var(--muted)",
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Sessions Tab */}
        {dashTab === "active" && (
          <>
            {activeSessions.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <FilterTabs active={filter} counts={counts} onChange={setFilter} />
              </div>
            )}

            {filteredActive.length === 0 && activeSessions.length === 0 ? (
              <EmptyState onNew={() => navigate("/session")} />
            ) : filteredActive.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--muted-foreground)", fontSize: 14 }}>
                No sessions match your search.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {filteredActive.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEdit={() => navigate(`/session/${session.id}`)}
                    onDelete={() => deleteMut.mutate({ id: session.id })}
                    onGoLive={() => launchMut.mutate({ id: session.id })}
                    onViewLive={() => navigate(`/live/${session.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Past Sessions Tab */}
        {dashTab === "past" && (
          <>
            {pastSessions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>
                  {pastSessions.length} closed session{pastSessions.length !== 1 ? "s" : ""} — click "View Results" to see the full response breakdown.
                </p>
              </div>
            )}

            {filteredPast.length === 0 && pastSessions.length === 0 ? (
              <EmptyPastState />
            ) : filteredPast.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--muted-foreground)", fontSize: 14 }}>
                No past sessions match your search.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredPast.map((session) => (
                  <PastSessionRow
                    key={session.id}
                    session={session}
                    onViewResults={() => navigate(`/results/${session.id}`)}
                    onDelete={() => deleteMut.mutate({ id: session.id })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
