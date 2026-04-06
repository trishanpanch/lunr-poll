/**
 * StudentReview.tsx — Student Past Submissions Review
 *
 * After a session ends, students can review all their answers.
 * Shows correct/incorrect indicators for graded question types (MC, T/F).
 * Mobile-first, dark-themed to match the student session experience.
 */

import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Minus,
  ArrowRight,
  ChevronLeft,
  Star,
  Type,
  ListChecks,
  ToggleLeft,
  Paperclip,
  AlignJustify,
  Sliders,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";

// ── Colour tokens (matching StudentSession) ──────────────────────────────────
const INDIGO = "oklch(0.55 0.2 250)";
const INDIGO_DARK = "oklch(0.45 0.22 264)";
const INDIGO_LIGHT = "rgba(99,102,241,0.12)";
const INDIGO_BORDER = "rgba(99,102,241,0.35)";
const GREEN = "oklch(0.52 0.18 160)";
const GREEN_LIGHT = "rgba(34,197,94,0.12)";
const GREEN_BORDER = "rgba(34,197,94,0.35)";
const RED = "oklch(0.55 0.22 27)";
const RED_LIGHT = "rgba(239,68,68,0.12)";
const RED_BORDER = "rgba(239,68,68,0.35)";
const TEXT_DARK = "#fff";
const TEXT_MID = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.4)";
const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.1)";
const BG_TOP = "oklch(0.18 0.04 264)";
const BG_BOT = "oklch(0.12 0.02 264)";

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Text": <Type size={14} />,
  "Multiple Choice": <ListChecks size={14} />,
  "File Upload": <Paperclip size={14} />,
  "Star Rating": <Star size={14} />,
  "True / False": <ToggleLeft size={14} />,
  "Labeled Scale": <AlignJustify size={14} />,
  "Numeric Scale": <Sliders size={14} />,
};

// ── Shell ────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100svh",
      background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
      fontFamily: "'Geist', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",
    }}>
      {children}
    </div>
  );
}

// ── Correctness badge ────────────────────────────────────────────────────────
function CorrectnessBadge({ isCorrect }: { isCorrect: boolean | null }) {
  if (isCorrect === true) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20,
        background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
        fontSize: 12, fontWeight: 700, color: GREEN,
      }}>
        <CheckCircle2 size={13} /> Correct
      </div>
    );
  }
  if (isCorrect === false) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20,
        background: RED_LIGHT, border: `1px solid ${RED_BORDER}`,
        fontSize: 12, fontWeight: 700, color: RED,
      }}>
        <XCircle size={13} /> Incorrect
      </div>
    );
  }
  return null;
}

// ── Star display ─────────────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={20}
          fill={i <= rating ? "oklch(0.72 0.19 75)" : "transparent"}
          style={{ color: i <= rating ? "oklch(0.72 0.19 75)" : TEXT_MUTED }}
        />
      ))}
    </div>
  );
}

// ── MC option display ────────────────────────────────────────────────────────
function MCOptions({ options, studentAnswer, correctIndex }: {
  options: string[];
  studentAnswer: string | null;
  correctIndex?: number;
}) {
  // studentAnswer is stored as the option index (e.g. "1"), not the text
  const studentIndex = studentAnswer !== null ? parseInt(studentAnswer, 10) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((opt, i) => {
        const isStudentChoice = studentIndex !== null && !isNaN(studentIndex) ? i === studentIndex : studentAnswer === opt;
        const isCorrectOption = correctIndex !== undefined && i === correctIndex;
        let bg = CARD_BG;
        let border = CARD_BORDER;
        let textColor = TEXT_MID;

        if (isStudentChoice && isCorrectOption) {
          bg = GREEN_LIGHT;
          border = GREEN_BORDER;
          textColor = GREEN;
        } else if (isStudentChoice && !isCorrectOption && correctIndex !== undefined) {
          bg = RED_LIGHT;
          border = RED_BORDER;
          textColor = RED;
        } else if (isCorrectOption) {
          bg = GREEN_LIGHT;
          border = GREEN_BORDER;
          textColor = GREEN;
        }

        const letter = String.fromCharCode(65 + i);

        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            background: bg, border: `1.5px solid ${border}`,
            transition: "all 0.15s",
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
              background: isStudentChoice ? (isCorrectOption || correctIndex === undefined ? INDIGO_LIGHT : RED_LIGHT) : "rgba(255,255,255,0.08)",
              color: isStudentChoice ? (isCorrectOption || correctIndex === undefined ? INDIGO : RED) : TEXT_MUTED,
              border: `1px solid ${isStudentChoice ? (isCorrectOption || correctIndex === undefined ? INDIGO_BORDER : RED_BORDER) : "rgba(255,255,255,0.1)"}`,
              flexShrink: 0,
            }}>
              {letter}
            </span>
            <span style={{ fontSize: 14, fontWeight: isStudentChoice ? 600 : 400, color: textColor, flex: 1 }}>
              {opt}
            </span>
            {isStudentChoice && (
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Your answer
              </span>
            )}
            {isCorrectOption && !isStudentChoice && (
              <CheckCircle2 size={16} style={{ color: GREEN, flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── T/F option display ───────────────────────────────────────────────────────
function TFOptions({ studentAnswer, tfAnswer }: {
  studentAnswer: string | null;
  tfAnswer?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {["True", "False"].map((opt) => {
        const isStudentChoice = studentAnswer === opt;
        const isCorrectOption = tfAnswer === opt;
        let bg = CARD_BG;
        let border = CARD_BORDER;
        let textColor = TEXT_MID;

        if (isStudentChoice && isCorrectOption) {
          bg = GREEN_LIGHT;
          border = GREEN_BORDER;
          textColor = GREEN;
        } else if (isStudentChoice && !isCorrectOption && tfAnswer) {
          bg = RED_LIGHT;
          border = RED_BORDER;
          textColor = RED;
        } else if (isCorrectOption) {
          bg = GREEN_LIGHT;
          border = GREEN_BORDER;
          textColor = GREEN;
        }

        return (
          <div key={opt} style={{
            flex: 1, padding: "14px", borderRadius: 12, textAlign: "center",
            background: bg, border: `1.5px solid ${border}`,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: textColor }}>{opt}</span>
            {isStudentChoice && (
              <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Your answer
              </div>
            )}
            {isCorrectOption && !isStudentChoice && (
              <div style={{ marginTop: 4 }}>
                <CheckCircle2 size={14} style={{ color: GREEN }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Labeled Scale display ────────────────────────────────────────────────────
function LabeledScaleDisplay({ labels, studentAnswer }: { labels: string[]; studentAnswer: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {labels.map((label, i) => {
        const isSelected = studentAnswer === label;
        return (
          <div key={i} style={{
            padding: "10px 14px", borderRadius: 10,
            background: isSelected ? INDIGO_LIGHT : CARD_BG,
            border: `1.5px solid ${isSelected ? INDIGO_BORDER : CARD_BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? INDIGO : TEXT_MID }}>
              {label}
            </span>
            {isSelected && (
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Your answer
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Numeric Scale display ────────────────────────────────────────────────────
function NumericScaleDisplay({ min, max, lowLabel, highLabel, studentAnswer }: {
  min: number; max: number; lowLabel: string; highLabel: string; studentAnswer: string | null;
}) {
  const selected = studentAnswer ? parseInt(studentAnswer, 10) : null;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {values.map((v) => {
          const isSelected = selected === v;
          return (
            <div key={v} style={{
              width: 40, height: 40, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isSelected ? INDIGO_LIGHT : CARD_BG,
              border: `1.5px solid ${isSelected ? INDIGO_BORDER : CARD_BORDER}`,
              fontSize: 15, fontWeight: isSelected ? 700 : 400,
              color: isSelected ? INDIGO : TEXT_MID,
            }}>
              {v}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{lowLabel}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{highLabel}</span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StudentReview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const sessionId = parseInt(id ?? "0", 10);
  const studentId = useRef(
    typeof window !== "undefined" ? sessionStorage.getItem("studentId") ?? "" : ""
  );
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.session.studentReview.useQuery(
    { sessionId, studentId: studentId.current },
    { enabled: !!sessionId && !!studentId.current }
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Shell>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={36} style={{ color: INDIGO, margin: "0 auto 16px" }} className="animate-spin" />
            <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Loading your submissions…</p>
          </div>
        </div>
      </Shell>
    );
  }

  // ── No student ID ──────────────────────────────────────────────────────────
  if (!studentId.current) {
    return (
      <Shell>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 320 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ color: TEXT_DARK, fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>
              No student session found
            </h2>
            <p style={{ color: TEXT_MID, fontSize: 14, margin: "0 0 28px", lineHeight: 1.55 }}>
              Your review is tied to the device you used during the session. Please use the same browser.
            </p>
            <button onClick={() => navigate("/join")} style={{
              padding: "14px 28px", borderRadius: 12,
              background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
              color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
            }}>
              Join a Session
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <Shell>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 320 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ color: TEXT_DARK, fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>
              Session not found
            </h2>
            <p style={{ color: TEXT_MID, fontSize: 14, margin: "0 0 28px", lineHeight: 1.55 }}>
              This session may have been removed or the link is incorrect.
            </p>
            <button onClick={() => navigate("/join")} style={{
              padding: "14px 28px", borderRadius: 12,
              background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
              color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
            }}>
              Join a Session
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Score summary ──────────────────────────────────────────────────────────
  const gradedItems = data.reviewItems.filter((item) => item.isCorrect !== null);
  const correctCount = gradedItems.filter((item) => item.isCorrect === true).length;
  const hasGradedQuestions = gradedItems.length > 0;

  return (
    <Shell>
      {/* Header */}
      <header style={{
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button
          onClick={() => navigate(`/student/session/${sessionId}`)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: TEXT_MID,
            cursor: "pointer", fontSize: 14, fontWeight: 500,
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: INDIGO, letterSpacing: "0.06em" }}>
          YOUR SUBMISSIONS
        </span>
      </header>

      {/* Session info + score */}
      <div style={{
        padding: "24px 20px 0",
        maxWidth: 560,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {/* Session name */}
        <h1 style={{
          color: TEXT_DARK, fontWeight: 800,
          fontSize: "clamp(22px, 5vw, 28px)",
          margin: "0 0 6px", letterSpacing: "-0.02em",
        }}>
          {data.sessionName}
        </h1>
        <p style={{ color: TEXT_MUTED, fontSize: 13, margin: "0 0 20px" }}>
          {data.answeredCount} of {data.questionCount} question{data.questionCount !== 1 ? "s" : ""} answered
        </p>

        {/* Score card (only if there are graded questions) */}
        {hasGradedQuestions && (
          <div style={{
            background: CARD_BG,
            border: `1.5px solid ${CARD_BORDER}`,
            borderRadius: 16,
            padding: "20px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}>
            {/* Score circle */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: correctCount === gradedItems.length ? GREEN_LIGHT : INDIGO_LIGHT,
              border: `2px solid ${correctCount === gradedItems.length ? GREEN_BORDER : INDIGO_BORDER}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 24, fontWeight: 800, lineHeight: 1,
                color: correctCount === gradedItems.length ? GREEN : INDIGO,
              }}>
                {correctCount}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: correctCount === gradedItems.length ? GREEN : INDIGO,
                opacity: 0.7,
              }}>
                / {gradedItems.length}
              </span>
            </div>
            <div>
              <p style={{ color: TEXT_DARK, fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>
                {correctCount === gradedItems.length
                  ? "Perfect score!"
                  : correctCount >= gradedItems.length * 0.7
                    ? "Great job!"
                    : "Keep learning!"}
              </p>
              <p style={{ color: TEXT_MID, fontSize: 13, margin: 0, lineHeight: 1.45 }}>
                You got {correctCount} out of {gradedItems.length} graded question{gradedItems.length !== 1 ? "s" : ""} correct.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Question cards */}
      <div style={{
        padding: "0 20px 100px",
        maxWidth: 560,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {data.reviewItems.map((item) => (
          <div key={item.question.id} style={{
            background: CARD_BG,
            border: `1.5px solid ${CARD_BORDER}`,
            borderRadius: 16,
            padding: "20px",
            transition: "border-color 0.15s",
          }}>
            {/* Question header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20,
                  background: INDIGO_LIGHT, border: `1px solid ${INDIGO_BORDER}`,
                  fontSize: 11, fontWeight: 700, color: INDIGO,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {TYPE_ICON[item.question.type]} {item.question.type}
                </span>
                <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>
                  Q{item.questionIndex + 1}
                </span>
              </div>
              <CorrectnessBadge isCorrect={item.isCorrect} />
            </div>

            {/* Question media */}
            {item.question.mediaUrl && (
              <div
                style={{
                  marginBottom: 14, background: "rgba(255,255,255,0.04)",
                  borderRadius: 12, border: `1px solid ${CARD_BORDER}`, padding: 8,
                  cursor: "zoom-in",
                }}
                onClick={() => setLightboxUrl(item.question.mediaUrl!)}
              >
                <img
                  src={item.question.mediaUrl}
                  alt="Question media"
                  style={{
                    width: "100%", maxHeight: 200, objectFit: "contain",
                    borderRadius: 8, display: "block",
                  }}
                />
              </div>
            )}

            {/* Question text */}
            <h3 style={{
              color: TEXT_DARK, fontWeight: 700, fontSize: 16,
              margin: "0 0 16px", lineHeight: 1.4,
            }}>
              {item.question.text}
            </h3>

            {/* Answer display */}
            {item.studentAnswer === null ? (
              <div style={{
                padding: "14px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: `1.5px dashed ${CARD_BORDER}`,
                textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Minus size={14} style={{ color: TEXT_MUTED }} />
                  <span style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 500 }}>
                    Not answered
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Multiple Choice */}
                {item.question.type === "Multiple Choice" && item.question.options && (
                  <MCOptions
                    options={item.question.options}
                    studentAnswer={item.studentAnswer}
                    correctIndex={item.question.correctIndex}
                  />
                )}

                {/* True / False */}
                {item.question.type === "True / False" && (
                  <TFOptions
                    studentAnswer={item.studentAnswer}
                    tfAnswer={item.question.tfAnswer}
                  />
                )}

                {/* Star Rating */}
                {item.question.type === "Star Rating" && (
                  <div style={{
                    padding: "14px", borderRadius: 10,
                    background: CARD_BG, border: `1.5px solid ${CARD_BORDER}`,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <StarDisplay rating={parseInt(item.studentAnswer, 10)} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_MID }}>
                      {item.studentAnswer} / 5
                    </span>
                  </div>
                )}

                {/* Text */}
                {item.question.type === "Text" && (
                  <div style={{
                    padding: "14px", borderRadius: 10,
                    background: CARD_BG, border: `1.5px solid ${CARD_BORDER}`,
                  }}>
                    <p style={{
                      color: TEXT_DARK, fontSize: 14, margin: 0,
                      lineHeight: 1.55, whiteSpace: "pre-wrap",
                    }}>
                      {item.studentAnswer}
                    </p>
                  </div>
                )}

                {/* Labeled Scale */}
                {item.question.type === "Labeled Scale" && item.question.likertLabels && (
                  <LabeledScaleDisplay
                    labels={item.question.likertLabels}
                    studentAnswer={item.studentAnswer}
                  />
                )}

                {/* Numeric Scale */}
                {item.question.type === "Numeric Scale" && (
                  <NumericScaleDisplay
                    min={item.question.numericMin ?? 1}
                    max={item.question.numericMax ?? 10}
                    lowLabel={item.question.numericLowLabel ?? "Not at all"}
                    highLabel={item.question.numericHighLabel ?? "Extremely"}
                    studentAnswer={item.studentAnswer}
                  />
                )}

                {/* File Upload */}
                {item.question.type === "File Upload" && (
                  <div style={{
                    padding: "14px", borderRadius: 10,
                    background: CARD_BG, border: `1.5px solid ${CARD_BORDER}`,
                    textAlign: "center",
                  }}>
                    <p style={{ color: TEXT_MID, fontSize: 13, margin: 0 }}>
                      File submitted
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Model answer (for Text questions) */}
            {item.question.type === "Text" && item.question.modelAnswer && (
              <div style={{
                marginTop: 12, padding: "12px 14px", borderRadius: 10,
                background: "rgba(99,102,241,0.06)",
                border: `1px solid ${INDIGO_BORDER}`,
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: INDIGO,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  margin: "0 0 6px",
                }}>
                  Model Answer
                </p>
                <p style={{
                  color: TEXT_MID, fontSize: 13, margin: 0,
                  lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {item.question.modelAnswer}
                </p>
              </div>
            )}

            {/* Correct answer reveal for MC (when student got it wrong) */}
            {item.question.type === "Multiple Choice" && item.isCorrect === false && item.question.correctIndex !== undefined && item.question.options && (
              <div style={{
                marginTop: 10, padding: "10px 14px", borderRadius: 10,
                background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: GREEN, margin: "0 0 2px" }}>
                  Correct answer: {item.question.options[item.question.correctIndex]}
                </p>
              </div>
            )}

            {/* Correct answer reveal for T/F (when student got it wrong) */}
            {item.question.type === "True / False" && item.isCorrect === false && item.question.tfAnswer && (
              <div style={{
                marginTop: 10, padding: "10px 14px", borderRadius: 10,
                background: GREEN_LIGHT, border: `1px solid ${GREEN_BORDER}`,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: GREEN, margin: 0 }}>
                  Correct answer: {item.question.tfAnswer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && createPortal(
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.12)", border: "none",
              borderRadius: 8, color: "#fff", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Expanded"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain",
              borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              cursor: "default",
            }}
          />
        </div>,
        document.body
      )}

      {/* Bottom action bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 20px",
        background: `linear-gradient(to top, ${BG_BOT} 60%, transparent)`,
        display: "flex", justifyContent: "center",
      }}>
        <button
          onClick={() => navigate("/join")}
          style={{
            padding: "14px 28px", borderRadius: 12,
            background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
            color: "#fff", fontWeight: 700, fontSize: 15, border: "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 4px 20px oklch(0.55 0.2 250 / 0.35)",
          }}
        >
          Join Another Session <ArrowRight size={18} />
        </button>
      </div>
    </Shell>
  );
}
