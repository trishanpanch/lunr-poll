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
  Star,
  Type,
  ListChecks,
  ToggleLeft,
  Paperclip,
  Cloud,
  BarChart2,
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

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Text": <Type size={15} />,
  "Multiple Choice": <ListChecks size={15} />,
  "File Upload": <Paperclip size={15} />,
  "Star Rating": <Star size={15} />,
  "True / False": <ToggleLeft size={15} />,
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
}: {
  type: string;
  tally: Record<string, number>;
  total: number;
  options?: string[];
  correctIndex?: number;
  tfAnswer?: string;
  rawAnswers?: string[];
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
export default function SessionResults() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();

  const { data, isLoading, error } = trpc.session.results.useQuery(
    { id: sessionId },
    { enabled: !!sessionId }
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
          onClick={handleDownloadCsv}
          disabled={csvExport.isFetching}
          style={{ background: INDIGO, color: "#fff", fontWeight: 600, fontSize: 13 }}
        >
          {csvExport.isFetching ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export CSV
        </Button>
      </header>

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
            ...(closedDate
              ? [{
                  icon: <Calendar size={18} style={{ color: "oklch(0.62 0.18 60)" }} />,
                  label: "Closed",
                  value: closedDate,
                  small: true,
                }]
              : []),
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

        {/* Per-question results */}
        {questionResults.length === 0 ? (
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
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
