/**
 * StudentPreview.tsx — Pop-out student preview window
 *
 * A lightweight read-only view of what students see during a live session.
 * Designed to be opened in a separate browser window via window.open().
 * Polls the live session state to stay synced with the instructor's navigation.
 */

import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Star, Send, Eye } from "lucide-react";
import type { Question } from "@shared/types";

// ── Colour tokens (dark theme matching student view) ─────────────────────────
const INDIGO = "oklch(0.55 0.2 250)";
const INDIGO_LIGHT = "rgba(99,102,241,0.12)";
const INDIGO_BORDER = "rgba(99,102,241,0.35)";
const GREEN = "oklch(0.52 0.18 160)";
const TEXT_DARK = "#fff";
const TEXT_MID = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.4)";
const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.1)";
const BG_TOP = "oklch(0.18 0.04 264)";
const BG_BOT = "oklch(0.12 0.02 264)";

export default function StudentPreview() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

  const { data, isLoading, error } = trpc.session.liveState.useQuery(
    { id: sessionId },
    { refetchInterval: 1500, enabled: !!sessionId }
  );

  const session = data?.session;
  const questions = (session?.questions as Question[]) ?? [];
  const currentIdx = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? (currentIdx + 1) / questions.length : 0;

  // Set window title
  if (session?.name) {
    document.title = `Student Preview — ${session.name}`;
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={28} style={{ color: INDIGO, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12,
      }}>
        <p style={{ color: TEXT_MID, fontSize: 14 }}>Session not found.</p>
      </div>
    );
  }

  if (session.status !== "live") {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12,
      }}>
        <p style={{ color: TEXT_MID, fontSize: 14 }}>
          {session.status === "draft" ? "Session hasn't started yet." : "Session has ended."}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
      fontFamily: "'Geist', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div style={{
          height: "100%",
          width: `${Math.max(4, progress * 100)}%`,
          background: `linear-gradient(90deg, ${INDIGO}, oklch(0.65 0.2 290))`,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Preview badge */}
      <div style={{
        padding: "8px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={13} style={{ color: TEXT_MUTED }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.06em" }}>
            STUDENT PREVIEW
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "oklch(0.57 0.22 27)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "oklch(0.57 0.22 27)" }}>LIVE</span>
          </div>
          <span style={{ fontSize: 10, color: TEXT_MUTED }}>
            Q{currentIdx + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Question content */}
      {currentQ && (
        <div style={{ flex: 1, padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {/* Type badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 12,
            background: INDIGO_LIGHT, border: `1px solid ${INDIGO_BORDER}`,
            alignSelf: "flex-start",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: INDIGO, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {currentQ.type}
            </span>
          </div>

          {/* Media */}
          {currentQ.mediaUrl && (
            <div style={{
              background: "rgba(255,255,255,0.04)", borderRadius: 10,
              border: `1px solid ${CARD_BORDER}`, padding: 8,
            }}>
              <img
                src={currentQ.mediaUrl}
                alt="Question media"
                style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, display: "block" }}
              />
            </div>
          )}

          {/* Question text */}
          <h2 style={{
            margin: 0, fontWeight: 800, fontSize: 18, color: TEXT_DARK,
            lineHeight: 1.35, letterSpacing: "-0.02em",
          }}>
            {currentQ.text}
          </h2>

          {/* Answer area preview (non-interactive) */}
          {currentQ.type === "Text" && (
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              border: `1.5px solid ${CARD_BORDER}`, background: CARD_BG,
              color: TEXT_MUTED, fontSize: 13,
            }}>
              Type your answer here…
            </div>
          )}

          {currentQ.type === "Multiple Choice" && currentQ.options && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentQ.options.map((opt, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 10,
                  border: `1px solid ${CARD_BORDER}`, background: CARD_BG,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: `1px solid ${CARD_BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: TEXT_MUTED, flexShrink: 0,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: 13, color: TEXT_MID }}>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {currentQ.type === "True / False" && (
            <div style={{ display: "flex", gap: 10 }}>
              {["True", "False"].map((label) => (
                <div key={label} style={{
                  flex: 1, padding: "14px 0", borderRadius: 10,
                  border: `1px solid ${CARD_BORDER}`, background: CARD_BG,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 600, color: TEXT_MID,
                }}>
                  {label}
                </div>
              ))}
            </div>
          )}

          {currentQ.type === "Star Rating" && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "8px 0" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={28} style={{ color: "oklch(0.82 0.12 60)" }} />
              ))}
            </div>
          )}

          {currentQ.type === "Labeled Scale" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(currentQ.likertLabels ?? ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]).map(
                (label, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10,
                    border: `1px solid ${CARD_BORDER}`, background: CARD_BG,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                      background: "rgba(255,255,255,0.08)", color: TEXT_MUTED,
                      border: `1px solid ${CARD_BORDER}`,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 12, color: TEXT_MID }}>{label}</span>
                  </div>
                )
              )}
            </div>
          )}

          {currentQ.type === "Numeric Scale" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {Array.from(
                  { length: (currentQ.numericMax ?? 10) - (currentQ.numericMin ?? 1) + 1 },
                  (_, i) => (currentQ.numericMin ?? 1) + i
                ).map((n) => (
                  <div key={n} style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: `1px solid ${CARD_BORDER}`, background: CARD_BG,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: TEXT_MID,
                  }}>
                    {n}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT_MUTED }}>
                <span>{currentQ.numericLowLabel ?? "Not at all"}</span>
                <span>{currentQ.numericHighLabel ?? "Extremely"}</span>
              </div>
            </div>
          )}

          {currentQ.type === "File Upload" && (
            <div style={{
              padding: "20px 14px", borderRadius: 10,
              border: `1.5px dashed ${CARD_BORDER}`, background: CARD_BG,
              textAlign: "center",
            }}>
              <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Click to upload a file</p>
            </div>
          )}

          {/* Fake submit button */}
          <div style={{
            padding: "14px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.08)",
            color: TEXT_MUTED, fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginTop: 8,
          }}>
            <Send size={14} /> Submit Answer
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
