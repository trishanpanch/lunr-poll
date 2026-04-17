/**
 * SessionResults.tsx — Past Session Results View
 *
 * Displays the full results for a closed (or any) session:
 * - Session metadata (name, code, date, participant count, total responses)
 * - Per-question breakdown with bar charts, T/F cards, star rating bars, word clouds
 * - CSV download button
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChevronLeft,
  Users,
  MessageSquare,
  Calendar,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Minus,
  Star,
  Type,
  ListChecks,
  ToggleLeft,
  Paperclip,
  Cloud,
  BarChart2,
  Link2,
  X,
  GraduationCap,
  AlignJustify,
  Sliders,
  ChevronDown,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WordCloud from "@/components/WordCloud";
import type { Question } from "@shared/types";

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
const RED = "oklch(0.55 0.22 27)";
const RED_LIGHT = "oklch(0.95 0.05 27)";
const AMBER = "oklch(0.62 0.18 60)";
const AMBER_LIGHT = "oklch(0.96 0.06 60)";

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Text": <Type size={15} />,
  "Multiple Choice": <ListChecks size={15} />,
  "File Upload": <Paperclip size={15} />,
  "Star Rating": <Star size={15} />,
  "True / False": <ToggleLeft size={15} />,
  "Labeled Scale": <AlignJustify size={15} />,
  "Numeric Scale": <Sliders size={15} />,
};

// ── Response chart (reused from LiveSession) ──────────────────────────────────
function ResponseChart({
  type,
  tally,
  total,
  options,
  correctIndex,
  tfAnswer,
  rawAnswers,
  likertLabels,
  numericMin,
  numericMax,
  numericLowLabel,
  numericHighLabel,
}: {
  type: string;
  tally: Record<string, number>;
  total: number;
  options?: string[];
  correctIndex?: number;
  tfAnswer?: string;
  rawAnswers?: string[];
  likertLabels?: string[];
  numericMin?: number;
  numericMax?: number;
  numericLowLabel?: string;
  numericHighLabel?: string;
}) {
  const [showWordCloud, setShowWordCloud] = useState(false);

  if (total === 0) {
    return (
      <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0, fontStyle: "italic" }}>
        No responses received.
      </p>
    );
  }

  if (type === "Multiple Choice" && options) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt, i) => {
          const count = tally[String(i)] ?? tally[opt] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isCorrect = correctIndex === i;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT_DARK }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isCorrect && <CheckCircle2 size={13} style={{ color: GREEN }} />}
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
                <span style={{ fontWeight: 700, color: isCorrect ? GREEN : TEXT_MID }}>
                  {count} <span style={{ fontWeight: 400, color: TEXT_MUTED, fontSize: 12 }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: "var(--muted)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 5,
                  width: `${pct}%`,
                  background: isCorrect ? GREEN : INDIGO,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "True / False") {
    return (
      <div style={{ display: "flex", gap: 16 }}>
        {["True", "False"].map((label) => {
          const count = tally[label] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isCorrect = tfAnswer === label;
          return (
            <div key={label} style={{
              flex: 1, background: isCorrect ? GREEN_LIGHT : BG,
              border: `1.5px solid ${isCorrect ? GREEN : BORDER}`,
              borderRadius: 14, padding: "18px 20px", textAlign: "center",
            }}>
              {isCorrect && <CheckCircle2 size={14} style={{ color: GREEN, marginBottom: 4 }} />}
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: isCorrect ? GREEN : TEXT_DARK }}>{label}</p>
              <p style={{ margin: "6px 0 2px", fontSize: 28, fontWeight: 800, color: isCorrect ? GREEN : TEXT_DARK }}>{count}</p>
              <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED }}>{pct}% of responses</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "Star Rating") {
    const totalStars = Object.entries(tally).reduce((sum, [star, cnt]) => sum + parseInt(star) * cnt, 0);
    const avg = total > 0 ? (totalStars / total).toFixed(1) : "—";
    return (
      <div>
        <p style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: TEXT_DARK }}>
          {avg} <span style={{ fontSize: 14, fontWeight: 400, color: TEXT_MUTED }}>avg rating</span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = tally[String(star)] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_MID, width: 24, textAlign: "right" }}>{star}★</span>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: "var(--muted)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 5,
                    width: `${pct}%`,
                    background: "oklch(0.62 0.18 60)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <span style={{ fontSize: 12, color: TEXT_MUTED, width: 36, textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "Labeled Scale") {
    const effectiveLabels = (likertLabels && likertLabels.length === 5)
      ? likertLabels
      : ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
    const totalWeighted = effectiveLabels.reduce((sum, _, i) => sum + (i + 1) * (tally[String(i + 1)] ?? 0), 0);
    const avg = total > 0 ? (totalWeighted / total).toFixed(2) : "—";
    return (
      <div>
        <p style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 800, color: TEXT_DARK }}>
          {avg} <span style={{ fontSize: 14, fontWeight: 400, color: TEXT_MUTED }}>avg score</span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {effectiveLabels.map((label, i) => {
            const count = tally[String(i + 1)] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT_DARK }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{i + 1}</span>
                    {label}
                  </span>
                  <span style={{ fontWeight: 700, color: TEXT_MID }}>
                    {count} <span style={{ fontWeight: 400, color: TEXT_MUTED, fontSize: 12 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: "var(--muted)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 5, width: `${pct}%`, background: INDIGO, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "Numeric Scale") {
    const min = numericMin ?? 1;
    const max = numericMax ?? 10;
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const totalWeighted = nums.reduce((sum, n) => sum + n * (tally[String(n)] ?? 0), 0);
    const avg = total > 0 ? (totalWeighted / total).toFixed(1) : "—";
    const maxCount = Math.max(...nums.map((n) => tally[String(n)] ?? 0), 1);
    return (
      <div>
        <p style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 800, color: TEXT_DARK }}>
          {avg} <span style={{ fontSize: 14, fontWeight: 400, color: TEXT_MUTED }}>avg score</span>
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {nums.map((n) => {
            const count = tally[String(n)] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const intensity = count / maxCount;
            return (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 36 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                  background: `oklch(0.55 0.2 250 / ${0.08 + intensity * 0.65})`,
                  color: intensity > 0.5 ? TEXT_DARK : TEXT_MID,
                  border: `1.5px solid oklch(0.55 0.2 250 / ${0.15 + intensity * 0.5})`,
                  transition: "all 0.3s",
                }}>{n}</div>
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>{count}</span>
                <span style={{ fontSize: 10, color: TEXT_MUTED }}>{pct}%</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>{numericLowLabel ?? "Not at all"}</span>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>{numericHighLabel ?? "Extremely"}</span>
        </div>
      </div>
    );
  }

  // Text — list + word cloud toggle
  const answers = rawAnswers && rawAnswers.length > 0 ? rawAnswers : Object.keys(tally);
  return (
    <div>
      {answers.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button
            onClick={() => setShowWordCloud(false)}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${!showWordCloud ? INDIGO : BORDER}`,
              background: !showWordCloud ? INDIGO_LIGHT : "#fff",
              color: !showWordCloud ? INDIGO : TEXT_MUTED,
              cursor: "pointer",
            }}
          >
            <BarChart2 size={12} style={{ display: "inline", marginRight: 4 }} />
            List
          </button>
          <button
            onClick={() => setShowWordCloud(true)}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${showWordCloud ? INDIGO : BORDER}`,
              background: showWordCloud ? INDIGO_LIGHT : "#fff",
              color: showWordCloud ? INDIGO : TEXT_MUTED,
              cursor: "pointer",
            }}
          >
            <Cloud size={12} style={{ display: "inline", marginRight: 4 }} />
            Word Cloud
          </button>
        </div>
      )}

      {showWordCloud ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
          <WordCloud responses={answers} width={520} height={260} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
          {answers.map((answer, i) => (
            <div key={i} style={{
              padding: "9px 14px", borderRadius: 8,
              background: BG, border: `1px solid ${BORDER}`,
              fontSize: 13, color: TEXT_DARK, lineHeight: 1.5,
            }}>
              {answer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
// ── Sync to LMS Modal ────────────────────────────────────────────────────────
function SyncLmsModal({
  sessionId,
  sessionName,
  onClose,
}: {
  sessionId: number;
  sessionName: string;
  onClose: () => void;
}) {
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [assignmentName, setAssignmentName] = useState(`AlicePoll — ${sessionName}`);
  const [synced, setSynced] = useState(false);

  const { data: connections, isLoading: loadingConns } = trpc.lms.listConnections.useQuery();
  const { data: courses, isLoading: loadingCourses } = trpc.lms.listCourses.useQuery(
    { connectionId: selectedConnectionId! },
    { enabled: !!selectedConnectionId }
  );

  const syncMutation = trpc.lms.syncToCanvas.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Synced ${result.synced} student${result.synced !== 1 ? "s" : ""} to Canvas`);
        setSynced(true);
      } else {
        toast.error(`Sync partially failed: ${result.errorMessage}`);
      }
    },
    onError: (err) => toast.error(`Sync failed: ${err.message}`),
  });

  const canvasConnections = (connections ?? []).filter((c) => c.provider === "canvas");

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: 16,
          padding: "24px 24px 20px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={18} style={{ color: INDIGO }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: TEXT_DARK }}>Sync to Canvas</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED }}>
            <X size={18} />
          </button>
        </div>

        {synced ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
            <CheckCircle2 size={40} style={{ color: GREEN }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: TEXT_DARK }}>Grades synced successfully</p>
            <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, textAlign: "center" }}>Participation scores have been pushed to your Canvas gradebook.</p>
            <Button onClick={onClose} style={{ background: INDIGO, color: "#fff", marginTop: 4 }}>Done</Button>
          </div>
        ) : (
          <>
            {loadingConns ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT_MUTED, fontSize: 13 }}>
                <Loader2 size={14} className="animate-spin" /> Loading connections…
              </div>
            ) : canvasConnections.length === 0 ? (
              <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
                No Canvas connections found.{" "}
                <a href="/integrations" style={{ color: INDIGO, fontWeight: 600 }}>Set up an integration</a>{" "}
                in Settings → LMS Integrations.
              </div>
            ) : (
              <>
                {/* Connection picker */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: "block", marginBottom: 6 }}>Canvas Connection</label>
                  <select
                    value={selectedConnectionId ?? ""}
                    onChange={(e) => { setSelectedConnectionId(Number(e.target.value)); setSelectedCourseId(null); }}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--background)", color: TEXT_DARK }}
                  >
                    <option value="">Select connection…</option>
                    {canvasConnections.map((c) => (
                      <option key={c.id} value={c.id}>{c.label ?? c.instanceUrl}</option>
                    ))}
                  </select>
                </div>

                {/* Course picker */}
                {selectedConnectionId && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: "block", marginBottom: 6 }}>Course</label>
                    {loadingCourses ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MUTED }}>
                        <Loader2 size={13} className="animate-spin" /> Loading courses…
                      </div>
                    ) : (
                      <select
                        value={selectedCourseId ?? ""}
                        onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--background)", color: TEXT_DARK }}
                      >
                        <option value="">Select course…</option>
                        {(courses ?? []).map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Assignment name */}
                {selectedCourseId && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: "block", marginBottom: 6 }}>Assignment Name in Canvas</label>
                    <input
                      value={assignmentName}
                      onChange={(e) => setAssignmentName(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--background)", color: TEXT_DARK, boxSizing: "border-box" }}
                    />
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: TEXT_MUTED }}>This will be the column name in your Canvas gradebook.</p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <Button variant="outline" onClick={onClose} style={{ fontSize: 13 }}>Cancel</Button>
                  <Button
                    onClick={() => syncMutation.mutate({
                      sessionId,
                      connectionId: selectedConnectionId!,
                      lmsCourseId: selectedCourseId!,
                      assignmentName,
                    })}
                    disabled={!selectedConnectionId || !selectedCourseId || !assignmentName || syncMutation.isPending}
                    style={{ background: INDIGO, color: "#fff", fontSize: 13 }}
                  >
                    {syncMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    {syncMutation.isPending ? "Syncing…" : "Sync Grades"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SessionResults() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "students">("questions");

  const { data, isLoading, error } = trpc.session.results.useQuery(
    { id: sessionId },
    { enabled: !!sessionId }
  );

  const { data: gradesData, isLoading: gradesLoading } = trpc.session.studentGrades.useQuery(
    { sessionId },
    { enabled: !!sessionId && activeTab === "students" }
  );

  const csvExport = trpc.session.exportCsv.useQuery(
    { id: sessionId },
    { enabled: false }
  );

  const handleDownloadCsv = async () => {
    const result = await csvExport.refetch();
    if (!result.data) {
      toast.error("Failed to export CSV");
      return;
    }
    const { csv, sessionName, totalResponses } = result.data;
    if (totalResponses === 0) {
      toast.info("No responses to export yet.");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionName.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${totalResponses} response${totalResponses !== 1 ? "s" : ""}`);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        <Loader2 size={32} style={{ color: INDIGO, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, flexDirection: "column", gap: 16 }}>
        <p style={{ color: "oklch(0.514 0.2 13.9)", fontWeight: 600 }}>Session not found or access denied.</p>
        <Button variant="outline" onClick={() => navigate("/sessions")}>Back to Sessions</Button>
      </div>
    );
  }

  const { session, questionResults, totalResponses, participantCount } = data;
  const questions = (session.questions as Question[]) ?? [];

  const launchedDate = session.launchedAt
    ? new Date(session.launchedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;
  const closedDate = session.closedAt
    ? new Date(session.closedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`,
        height: 60, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <button
          onClick={() => navigate("/sessions")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: TEXT_MUTED, display: "flex", alignItems: "center",
            gap: 4, fontSize: 13, padding: "4px 8px", borderRadius: 8,
          }}
          className="hover:bg-[oklch(0.96_0_0)] transition-colors"
        >
          <ChevronLeft size={16} /> Sessions
        </button>

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: TEXT_DARK }}>{session.name}</p>
        </div>

        {/* Status badge */}
        <div style={{
          padding: "4px 12px", borderRadius: 20,
          background: "var(--muted)", border: `1px solid ${BORDER}`,
          fontSize: 12, fontWeight: 700, color: TEXT_MUTED,
        }}>
          CLOSED
        </div>

        <Button
          variant="outline"
          onClick={() => setShowSyncModal(true)}
          style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Link2 size={14} />
          Sync to LMS
        </Button>

        <Button
          onClick={handleDownloadCsv}
          disabled={csvExport.isFetching}
          style={{ background: INDIGO, color: "#fff", fontWeight: 600, fontSize: 13 }}
        >
          {csvExport.isFetching ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export CSV
        </Button>
      </header>

      {showSyncModal && (
        <SyncLmsModal
          sessionId={sessionId}
          sessionName={data?.session?.name ?? "Session"}
          onClose={() => setShowSyncModal(false)}
        />
      )}

      {/* Main content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            {
              icon: <Users size={18} style={{ color: INDIGO }} />,
              label: "Participants",
              value: participantCount,
            },
            {
              icon: <MessageSquare size={18} style={{ color: GREEN }} />,
              label: "Total Responses",
              value: totalResponses,
            },
            {
              icon: <BarChart2 size={18} style={{ color: "oklch(0.52 0.18 290)" }} />,
              label: "Questions",
              value: questions.length,
            },

          ].map((card, i) => (
            <div key={i} style={{
              background: "var(--card)", borderRadius: 14, border: `1px solid ${BORDER}`,
              padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {card.icon}
                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {card.label}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: (card as { small?: boolean }).small ? 14 : 28,
                fontWeight: 800,
                color: TEXT_DARK,
                lineHeight: 1.2,
              }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Session metadata row */}
        {launchedDate && (
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "12px 18px", borderRadius: 12,
            background: "var(--card)", border: `1px solid ${BORDER}`,
            marginBottom: 24, fontSize: 13, color: TEXT_MID,
          }}>
            <span>
              <strong style={{ color: TEXT_DARK }}>Code:</strong>{" "}
              <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, color: INDIGO, letterSpacing: "0.1em" }}>
                {session.code}
              </span>
            </span>
            <span style={{ color: BORDER }}>|</span>
            <span><strong style={{ color: TEXT_DARK }}>Launched:</strong> {launchedDate}</span>
            {closedDate && (
              <>
                <span style={{ color: BORDER }}>|</span>
                <span><strong style={{ color: TEXT_DARK }}>Closed:</strong> {closedDate}</span>
              </>
            )}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--muted)", borderRadius: 12, padding: 4 }}>
          {([
            { key: "questions", label: "By Question", icon: <BarChart2 size={15} /> },
            { key: "students",  label: "By Student",  icon: <UserCheck size={15} /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: activeTab === tab.key ? "var(--card)" : "transparent",
                color: activeTab === tab.key ? TEXT_DARK : TEXT_MUTED,
                boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Per-question results */}
        {activeTab === "questions" && (questionResults.length === 0 ? (
          <div style={{
            background: "var(--card)", borderRadius: 16, border: `2px dashed ${BORDER}`,
            padding: "48px 32px", textAlign: "center",
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: TEXT_MUTED, margin: 0 }}>
              No questions in this session.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {questionResults.map((qr, i) => {
              const q = qr.question as Question;
              return (
                <div key={q.id} style={{
                  background: "var(--card)", borderRadius: 16, border: `1px solid ${BORDER}`,
                  padding: "24px 28px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}>
                  {/* Question header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: INDIGO_LIGHT, color: INDIGO,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                    }}>
                      Q{i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ color: INDIGO }}>{TYPE_ICON[q.type]}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED }}>
                          {q.type}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 12, color: TEXT_MUTED }}>
                          {qr.total} response{qr.total !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: TEXT_DARK, lineHeight: 1.4 }}>
                        {q.text}
                      </h3>
                      {q.modelAnswer && (
                        <div style={{
                          marginTop: 8, padding: "6px 10px", borderRadius: 7,
                          background: GREEN_LIGHT, border: `1px solid ${GREEN}`,
                          fontSize: 12, color: GREEN, fontWeight: 500,
                        }}>
                          <strong>Model answer:</strong> {q.modelAnswer}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart */}
                  <ResponseChart
                    type={q.type}
                    tally={qr.tally}
                    total={qr.total}
                    options={q.options}
                    correctIndex={q.correctIndex}
                    tfAnswer={q.tfAnswer}
                    rawAnswers={qr.rawAnswers}
                    likertLabels={q.likertLabels}
                    numericMin={q.numericMin}
                    numericMax={q.numericMax}
                    numericLowLabel={q.numericLowLabel}
                    numericHighLabel={q.numericHighLabel}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* By-Student grading panel */}
        {activeTab === "students" && (
          <StudentGradingPanel
            sessionId={sessionId}
            data={gradesData}
            isLoading={gradesLoading}
          />
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── StudentGradingPanel ───────────────────────────────────────────────────────

type GradesData = {
  sessionName: string;
  questions: Array<{
    id: string;
    index: number;
    type: string;
    text: string;
    options?: string[];
    correctIndex?: number;
    tfAnswer?: string;
    modelAnswer?: string;
  }>;
  roster: Array<{
    studentId: string;
    studentName: string | null;
    answeredCount: number;
    correctCount: number;
    gradedCount: number;
    questionAnswers: Array<{
      questionId: string;
      answer: string | null;
      isCorrect: boolean | null;
    }>;
  }>;
  totalStudents: number;
  totalQuestions: number;
};

function exportStudentsCsv(data: GradesData) {
  const { sessionName, questions, roster } = data;

  // Helper: turn a raw stored answer into a readable label
  const readableAnswer = (answer: string | null, q: GradesData["questions"][0]): string => {
    if (answer === null || answer === undefined) return "";
    if (q.type === "Multiple Choice" && q.options) {
      const idx = parseInt(answer, 10);
      return isNaN(idx) ? answer : (q.options[idx] ?? answer);
    }
    return answer;
  };

  // Build header row
  const headers = [
    "Student Name",
    "Student ID",
    "Answered",
    "Total Questions",
    "Score (%)",
    ...questions.map((q, i) => `Q${i + 1}: ${q.text.replace(/"/g, "'")}`.slice(0, 80)),
  ];

  // Build one row per student
  const rows = roster.map((student) => {
    const scorePercent = student.gradedCount > 0
      ? Math.round((student.correctCount / student.gradedCount) * 100)
      : "";
    const answerCells = questions.map((q) => {
      const qa = student.questionAnswers.find((a) => a.questionId === q.id);
      return qa ? readableAnswer(qa.answer, q) : "";
    });
    return [
      student.studentName ?? "Anonymous",
      student.studentId,
      student.answeredCount,
      questions.length,
      scorePercent,
      ...answerCells,
    ];
  });

  // Escape a CSV cell
  const cell = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = sessionName.replace(/[^a-z0-9]/gi, "_");
  const date = new Date().toISOString().slice(0, 10);
  a.download = `${safeName}_by_student_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StudentGradingPanel({
  sessionId,
  data,
  isLoading,
}: {
  sessionId: number;
  data: GradesData | undefined;
  isLoading: boolean;
}) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  void sessionId;

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
        <Loader2 size={28} style={{ color: INDIGO, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!data || data.roster.length === 0) {
    return (
      <div style={{
        background: "var(--card)", borderRadius: 16, border: `2px dashed ${BORDER}`,
        padding: "48px 32px", textAlign: "center",
      }}>
        <Users size={32} style={{ color: TEXT_MUTED, marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: TEXT_MUTED, margin: 0 }}>
          No student responses yet.
        </p>
      </div>
    );
  }

  const { questions, roster } = data;
  const gradedQuestions = questions.filter(
    (q) => q.type === "Multiple Choice" || q.type === "True / False"
  );

  // Class-wide stats for graded questions
  const classAvg = gradedQuestions.length > 0
    ? roster.reduce((sum, s) => sum + (s.gradedCount > 0 ? s.correctCount / s.gradedCount : 0), 0) / roster.length
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Class summary bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderRadius: 12,
        background: INDIGO_LIGHT, border: `1px solid ${INDIGO}22`,
        marginBottom: 16, fontSize: 13, color: TEXT_MID,
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GraduationCap size={18} style={{ color: INDIGO, flexShrink: 0 }} />
          <span>
            <strong style={{ color: TEXT_DARK }}>{roster.length}</strong> students &nbsp;·&nbsp;
            <strong style={{ color: TEXT_DARK }}>{questions.length}</strong> questions
            {classAvg !== null && (
              <>
                &nbsp;·&nbsp; Class avg on graded:{" "}
                <strong style={{ color: classAvg >= 0.7 ? GREEN : classAvg >= 0.4 ? AMBER : RED }}>
                  {Math.round(classAvg * 100)}%
                </strong>
              </>
            )}
          </span>
        </div>
        <button
          onClick={() => exportStudentsCsv(data)}
          title="Export gradebook as CSV"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8,
            border: `1.5px solid ${INDIGO}44`,
            background: "#fff", color: INDIGO,
            fontSize: 12, fontWeight: 600,
            cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = INDIGO_LIGHT; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 8,
        padding: "8px 16px",
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.07em", color: TEXT_MUTED,
        borderBottom: `1px solid ${BORDER}`,
        marginBottom: 4,
      }}>
        <span>Student</span>
        <span style={{ textAlign: "center" }}>Answered</span>
        <span style={{ textAlign: "center" }}>Score</span>
        <span style={{ textAlign: "right" }}>Details</span>
      </div>

      {/* Student rows */}
      {roster.map((student) => {
        const isExpanded = expandedStudent === student.studentId;
        const scorePercent = student.gradedCount > 0
          ? Math.round((student.correctCount / student.gradedCount) * 100)
          : null;
        const scoreColor = scorePercent === null ? TEXT_MUTED
          : scorePercent >= 70 ? GREEN
          : scorePercent >= 40 ? AMBER
          : RED;
        const scoreBg = scorePercent === null ? "transparent"
          : scorePercent >= 70 ? GREEN_LIGHT
          : scorePercent >= 40 ? AMBER_LIGHT
          : RED_LIGHT;

        return (
          <div key={student.studentId}>
            {/* Row */}
            <div
              onClick={() => setExpandedStudent(isExpanded ? null : student.studentId)}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: 8,
                padding: "14px 16px",
                borderRadius: isExpanded ? "12px 12px 0 0" : 12,
                background: isExpanded ? INDIGO_LIGHT : "var(--card)",
                border: `1px solid ${isExpanded ? INDIGO + "44" : BORDER}`,
                borderBottom: isExpanded ? `1px solid ${INDIGO}22` : `1px solid ${BORDER}`,
                marginBottom: isExpanded ? 0 : 6,
                cursor: "pointer",
                alignItems: "center",
                transition: "background 0.15s",
              }}
            >
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: INDIGO_LIGHT, color: INDIGO,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                }}>
                  {(student.studentName ?? "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: TEXT_DARK }}>
                    {student.studentName ?? <span style={{ color: TEXT_MUTED, fontStyle: "italic" }}>Anonymous</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: TEXT_MUTED }}>
                    {student.studentId.startsWith("stu-") ? "" : student.studentId.substring(0, 8) + "…"}
                  </p>
                </div>
              </div>

              {/* Answered */}
              {(() => {
                const belowHalf = student.answeredCount < questions.length / 2;
                const fracColor = belowHalf ? "oklch(0.55 0.22 25)" : TEXT_MUTED;
                return (
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: fracColor }}>
                      {student.answeredCount}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: fracColor }}>/{questions.length}</span>
                  </div>
                );
              })()}

              {/* Score */}
              <div style={{ textAlign: "center" }}>
                {scorePercent !== null ? (
                  <span style={{
                    display: "inline-block",
                    padding: "3px 10px", borderRadius: 20,
                    background: scoreBg, color: scoreColor,
                    fontSize: 13, fontWeight: 700,
                    border: `1px solid ${scoreColor}33`,
                  }}>
                    {scorePercent}%
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: TEXT_MUTED }}>—</span>
                )}
              </div>

              {/* Expand toggle */}
              <div style={{ textAlign: "right", color: INDIGO }}>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>

            {/* Expanded answer detail */}
            {isExpanded && (
              <div style={{
                background: "var(--card)",
                border: `1px solid ${INDIGO}44`,
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: "16px 20px",
                marginBottom: 6,
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {questions.map((q, qi) => {
                    const qa = student.questionAnswers[qi];
                    const answered = qa?.answer !== null && qa?.answer !== undefined;
                    const isGraded = q.type === "Multiple Choice" || q.type === "True / False";

                    // Resolve display text for MC answers
                    let displayAnswer = qa?.answer ?? null;
                    if (answered && q.type === "Multiple Choice" && q.options) {
                      const idx = parseInt(qa!.answer!, 10);
                      displayAnswer = !isNaN(idx) && q.options[idx] ? q.options[idx] : qa!.answer;
                    }

                    // Correct answer text
                    let correctAnswerText: string | null = null;
                    if (isGraded) {
                      if (q.type === "Multiple Choice" && q.correctIndex !== undefined && q.options) {
                        correctAnswerText = q.options[q.correctIndex] ?? null;
                      } else if (q.type === "True / False" && q.tfAnswer) {
                        correctAnswerText = q.tfAnswer;
                      }
                    }

                    return (
                      <div key={q.id} style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "10px 14px", borderRadius: 10,
                        background: !answered ? "var(--muted)"
                          : qa?.isCorrect === true ? GREEN_LIGHT
                          : qa?.isCorrect === false ? RED_LIGHT
                          : "var(--muted)",
                        border: `1px solid ${
                          !answered ? BORDER
                          : qa?.isCorrect === true ? GREEN + "44"
                          : qa?.isCorrect === false ? RED + "44"
                          : BORDER
                        }`,
                      }}>
                        {/* Q number */}
                        <div style={{
                          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                          background: INDIGO_LIGHT, color: INDIGO,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800,
                        }}>
                          Q{qi + 1}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: TEXT_MID }}>
                            {q.text.length > 80 ? q.text.substring(0, 80) + "…" : q.text}
                          </p>
                          {!answered ? (
                            <span style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>No answer</span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{
                                fontSize: 13, fontWeight: 600,
                                color: qa?.isCorrect === true ? GREEN
                                  : qa?.isCorrect === false ? RED
                                  : TEXT_DARK,
                              }}>
                                {displayAnswer}
                              </span>
                              {isGraded && qa?.isCorrect === false && correctAnswerText && (
                                <span style={{ fontSize: 11, color: GREEN, fontWeight: 500 }}>
                                  ✓ {correctAnswerText}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Correctness icon */}
                        <div style={{ flexShrink: 0 }}>
                          {!answered ? (
                            <Minus size={15} style={{ color: TEXT_MUTED }} />
                          ) : qa?.isCorrect === true ? (
                            <CheckCircle2 size={15} style={{ color: GREEN }} />
                          ) : qa?.isCorrect === false ? (
                            <XCircle size={15} style={{ color: RED }} />
                          ) : (
                            <MessageSquare size={15} style={{ color: INDIGO }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
