/**
 * LmsIntegrations.tsx — LMS Integrations Settings Page
 *
 * Allows professors to:
 * 1. Connect their Canvas instance (URL + personal API token)
 * 2. View and disconnect existing connections
 * 3. Learn about LTI 1.3 for institutional-level sync
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Link2,
  BookOpen,
  GraduationCap,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const INDIGO = "oklch(0.55 0.2 250)";
const INDIGO_LIGHT = "oklch(0.96 0.04 250)";
const BORDER = "var(--border)";
const TEXT_DARK = "oklch(0.145 0 0)";
const TEXT_MID = "oklch(0.4 0 0)";
const TEXT_MUTED = "oklch(0.556 0 0)";
const BG = "var(--background)";
const GREEN = "oklch(0.52 0.18 160)";
const GREEN_LIGHT = "oklch(0.92 0.08 160)";
const RED = "oklch(0.514 0.2 13.9)";
const RED_LIGHT = "oklch(0.96 0.04 13.9)";

// ── Add Canvas Connection Form ────────────────────────────────────────────────
function AddCanvasForm({ onSuccess }: { onSuccess: () => void }) {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState(false);

  const connectMutation = trpc.lms.connectCanvas.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected to ${data.label}`);
      setInstanceUrl("");
      setApiToken("");
      setLabel("");
      setOpen(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(`Connection failed: ${err.message}`);
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 10,
          border: `1.5px dashed ${BORDER}`,
          background: "transparent",
          color: TEXT_MUTED,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          width: "100%",
          transition: "all 0.15s",
        }}
        className="hover:border-[oklch(0.55_0.2_250)] hover:text-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.96_0.04_250)] transition-all"
      >
        <Plus size={15} />
        Connect Canvas Instance
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1.5px solid ${INDIGO}`,
        borderRadius: 14,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <GraduationCap size={18} style={{ color: INDIGO }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: TEXT_DARK }}>
          Connect Canvas
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, marginBottom: 4, display: "block" }}>
            Canvas Instance URL
          </Label>
          <Input
            placeholder="https://canvas.youruniversity.edu"
            value={instanceUrl}
            onChange={(e) => setInstanceUrl(e.target.value)}
            style={{ fontSize: 13 }}
          />
          <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
            The base URL of your institution's Canvas installation.
          </p>
        </div>

        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, marginBottom: 4, display: "block" }}>
            Personal API Token
          </Label>
          <Input
            type="password"
            placeholder="••••••••••••••••••••"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            style={{ fontSize: 13 }}
          />
          <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
            Generate in Canvas: <strong>Account → Settings → Approved Integrations → New Access Token</strong>
          </p>
        </div>

        <div>
          <Label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, marginBottom: 4, display: "block" }}>
            Label <span style={{ fontWeight: 400, color: TEXT_MUTED }}>(optional)</span>
          </Label>
          <Input
            placeholder="e.g. Harvard Canvas"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          style={{ fontSize: 13 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() =>
            connectMutation.mutate({ instanceUrl, apiToken, label: label || undefined })
          }
          disabled={!instanceUrl || !apiToken || connectMutation.isPending}
          style={{ background: INDIGO, color: "#fff", fontSize: 13 }}
        >
          {connectMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          {connectMutation.isPending ? "Testing connection…" : "Connect"}
        </Button>
      </div>
    </div>
  );
}

// ── Connection Card ───────────────────────────────────────────────────────────
function ConnectionCard({
  connection,
  onDisconnect,
}: {
  connection: {
    id: number;
    provider: string;
    instanceUrl: string;
    apiToken: string;
    label: string | null;
    createdAt: Date;
  };
  onDisconnect: () => void;
}) {
  const disconnectMutation = trpc.lms.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Connection removed");
      onDisconnect();
    },
    onError: (err) => {
      toast.error(`Failed to disconnect: ${err.message}`);
    },
  });

  const providerLabel =
    connection.provider === "canvas" ? "Canvas" : connection.provider;
  const providerColor =
    connection.provider === "canvas" ? "oklch(0.52 0.22 290)" : INDIGO;

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Provider badge */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${providerColor}1a`,
          border: `1.5px solid ${providerColor}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BookOpen size={16} style={{ color: providerColor }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: TEXT_DARK }}>
          {connection.label ?? providerLabel}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: TEXT_MUTED,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {connection.instanceUrl}
        </p>
      </div>

      {/* Token preview */}
      <span
        style={{
          fontSize: 11,
          fontFamily: "'Geist Mono', monospace",
          color: TEXT_MUTED,
          background: "var(--muted)",
          padding: "2px 8px",
          borderRadius: 6,
          flexShrink: 0,
        }}
      >
        {connection.apiToken}
      </span>

      {/* Connected badge */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: GREEN,
          background: GREEN_LIGHT,
          padding: "3px 10px",
          borderRadius: 20,
          flexShrink: 0,
        }}
      >
        <CheckCircle2 size={11} />
        Connected
      </span>

      {/* Disconnect */}
      <button
        onClick={() => disconnectMutation.mutate({ connectionId: connection.id })}
        disabled={disconnectMutation.isPending}
        title="Disconnect"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          background: "transparent",
          color: TEXT_MUTED,
          cursor: "pointer",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
        className="hover:bg-[oklch(0.96_0.04_13.9)] hover:border-[oklch(0.514_0.2_13.9)] hover:text-[oklch(0.514_0.2_13.9)] transition-all"
      >
        {disconnectMutation.isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Trash2 size={13} />
        )}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LmsIntegrations() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: connections, isLoading } = trpc.lms.listConnections.useQuery();

  const refresh = () => utils.lms.listConnections.invalidate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${BORDER}`,
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <button
          onClick={() => navigate("/settings")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: TEXT_MUTED,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 8,
          }}
          className="hover:bg-[oklch(0.96_0_0)] transition-colors"
        >
          <ChevronLeft size={16} /> Settings
        </button>

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: TEXT_DARK }}>
            LMS Integrations
          </p>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Canvas Section ─────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <GraduationCap size={20} style={{ color: INDIGO }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>
              Canvas
            </h2>
          </div>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: TEXT_MID, lineHeight: 1.6 }}>
            Connect your Canvas instance to push participation scores directly to your
            gradebook after each session. Each sync creates a new assignment column
            with per-student scores based on question participation.
          </p>

          {/* How-to callout */}
          <div
            style={{
              background: INDIGO_LIGHT,
              border: `1px solid oklch(0.88 0.06 250)`,
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
            }}
          >
            <Info size={15} style={{ color: INDIGO, flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: "oklch(0.38 0.14 250)", lineHeight: 1.6 }}>
              <strong>How to get your API token:</strong> In Canvas, go to{" "}
              <strong>Account → Settings → Approved Integrations</strong> and click{" "}
              <strong>+ New Access Token</strong>. Give it a name like "AlicePoll" and
              copy the token shown — it will only be displayed once.
            </div>
          </div>

          {/* Existing connections */}
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT_MUTED, fontSize: 13, padding: "8px 0" }}>
              <Loader2 size={14} className="animate-spin" /> Loading connections…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(connections ?? [])
                .filter((c) => c.provider === "canvas")
                .map((conn) => (
                  <ConnectionCard
                    key={conn.id}
                    connection={conn}
                    onDisconnect={refresh}
                  />
                ))}
            </div>
          )}

          <AddCanvasForm onSuccess={refresh} />
        </section>

        {/* ── Blackboard Section ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BookOpen size={20} style={{ color: "oklch(0.45 0.14 30)" }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>
              Blackboard
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "oklch(0.62 0.18 60)",
                background: "oklch(0.96 0.06 60)",
                padding: "2px 8px",
                borderRadius: 20,
                border: "1px solid oklch(0.88 0.08 60)",
              }}
            >
              Coming Soon
            </span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: TEXT_MID, lineHeight: 1.6 }}>
            Blackboard REST API integration is in development. It will support the same
            participation-based grade sync as Canvas.
          </p>
          <div
            style={{
              background: "oklch(0.97 0.02 60)",
              border: `1px solid oklch(0.88 0.06 60)`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              gap: 10,
            }}
          >
            <AlertCircle size={15} style={{ color: "oklch(0.62 0.18 60)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: "oklch(0.45 0.12 60)", lineHeight: 1.6 }}>
              Blackboard requires an institution-level REST API key. When this feature
              launches, your IT administrator will need to register AlicePoll as an
              authorised application in Blackboard's developer portal.
            </p>
          </div>
        </section>

        {/* ── LTI 1.3 Section ───────────────────────────────────────────────── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link2 size={20} style={{ color: "oklch(0.52 0.18 160)" }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>
              LTI 1.3 — Institutional Grade Sync
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "oklch(0.52 0.18 160)",
                background: GREEN_LIGHT,
                padding: "2px 8px",
                borderRadius: 20,
                border: "1px solid oklch(0.82 0.1 160)",
              }}
            >
              Enterprise
            </span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: TEXT_MID, lineHeight: 1.6 }}>
            LTI 1.3 (Learning Tools Interoperability) is the industry standard for deep
            LMS integration. It supports automatic roster sync, per-session grade
            passback, and single sign-on — without professors needing to manage API
            tokens manually.
          </p>
          <div
            style={{
              background: GREEN_LIGHT,
              border: `1px solid oklch(0.82 0.1 160)`,
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "oklch(0.35 0.14 160)" }}>
              How to enable LTI 1.3 for your institution
            </p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "oklch(0.4 0.1 160)", lineHeight: 1.7 }}>
              <li>Your LMS administrator registers AlicePoll as an LTI tool in Canvas, Blackboard, Brightspace, or Moodle.</li>
              <li>Students and professors access AlicePoll directly from within their LMS course.</li>
              <li>Grades sync automatically after each session — no token management required.</li>
            </ol>
            <p style={{ margin: 0, fontSize: 12, color: "oklch(0.45 0.1 160)" }}>
              Contact your institution's IT or LMS administrator and ask them to reach
              out to AlicePoll support to begin the LTI 1.3 registration process.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
