/**
 * StudentSession.tsx — Student live view
 *
 * Polls every 2s for the current question. No login required.
 * Stores studentId in sessionStorage for deduplication.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Send, Star, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question } from "@shared/types";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const INDIGO = "oklch(0.55 0.2 250)";
const INDIGO_LIGHT = "oklch(0.96 0.04 250)";
const BORDER = "oklch(0.922 0 0)";
const TEXT_DARK = "oklch(0.145 0 0)";
const TEXT_MID = "oklch(0.4 0 0)";
const TEXT_MUTED = "oklch(0.556 0 0)";
const BG = "oklch(0.982 0.0107 271.3)";
const GREEN = "oklch(0.52 0.18 160)";
const GREEN_LIGHT = "oklch(0.92 0.08 160)";
const CRIMSON = "oklch(0.514 0.2 13.9)";

// ── Answer inputs by question type ───────────────────────────────────────────

function ShortTextInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (answer: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your answer here…"
        rows={4}
        disabled={disabled}
        style={{
          width: "100%", borderRadius: 10,
          border: `1.5px solid ${BORDER}`, padding: "12px 14px",
          fontSize: 14, color: TEXT_DARK, resize: "none",
          fontFamily: "'Inter', system-ui, sans-serif",
          outline: "none", transition: "border-color 0.15s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = INDIGO; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
      />
      <Button
        onClick={() => text.trim() && onSubmit(text.trim())}
        disabled={disabled || !text.trim()}
        style={{ background: INDIGO, color: "#fff", fontWeight: 600, alignSelf: "flex-end" }}
      >
        <Send size={14} /> Submit
      </Button>
    </div>
  );
}

function MultipleChoiceInput({
  options,
  onSubmit,
  disabled,
}: {
  options: string[];
  onSubmit: (answer: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => !disabled && setSelected(i)}
          disabled={disabled}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderRadius: 10, textAlign: "left",
            border: `1.5px solid ${selected === i ? INDIGO : BORDER}`,
            background: selected === i ? INDIGO_LIGHT : "#fff",
            color: TEXT_DARK, fontSize: 14, fontWeight: selected === i ? 600 : 400,
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{
            width: 26, height: 26, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontFamily: "'Geist Mono', monospace",
            fontSize: 11, fontWeight: 700,
            background: selected === i ? INDIGO : "oklch(0.93 0 0)",
            color: selected === i ? "#fff" : TEXT_MUTED,
          }}>
            {String.fromCharCode(65 + i)}
          </span>
          {opt}
        </button>
      ))}
      <Button
        onClick={() => selected !== null && onSubmit(String(selected))}
        disabled={disabled || selected === null}
        style={{ background: INDIGO, color: "#fff", fontWeight: 600, marginTop: 4, alignSelf: "flex-end" }}
      >
        <Send size={14} /> Submit
      </Button>
    </div>
  );
}

function StarRatingInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (answer: string) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => !disabled && setSelected(n)}
            onMouseEnter={() => !disabled && setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            disabled={disabled}
            style={{
              background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer",
              padding: 4, transition: "transform 0.1s",
              transform: hovered >= n || selected >= n ? "scale(1.15)" : "scale(1)",
            }}
          >
            <Star
              size={36}
              fill={hovered >= n || selected >= n ? "oklch(0.62 0.18 60)" : "none"}
              stroke={hovered >= n || selected >= n ? "oklch(0.62 0.18 60)" : TEXT_MUTED}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <p style={{ margin: 0, fontSize: 14, color: TEXT_MID, fontWeight: 500 }}>
          You selected {selected} star{selected !== 1 ? "s" : ""}
        </p>
      )}
      <Button
        onClick={() => selected > 0 && onSubmit(String(selected))}
        disabled={disabled || selected === 0}
        style={{ background: INDIGO, color: "#fff", fontWeight: 600 }}
      >
        <Send size={14} /> Submit
      </Button>
    </div>
  );
}

function TrueFalseInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (answer: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<"True" | "False" | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {(["True", "False"] as const).map((label) => (
          <button
            key={label}
            onClick={() => !disabled && setSelected(label)}
            disabled={disabled}
            style={{
              flex: 1, padding: "18px 0", borderRadius: 12,
              border: `1.5px solid ${selected === label ? INDIGO : BORDER}`,
              background: selected === label ? INDIGO_LIGHT : "#fff",
              color: selected === label ? INDIGO : TEXT_DARK,
              fontSize: 16, fontWeight: 700,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Button
        onClick={() => selected && onSubmit(selected)}
        disabled={disabled || !selected}
        style={{ background: INDIGO, color: "#fff", fontWeight: 600, alignSelf: "flex-end" }}
      >
        <Send size={14} /> Submit
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentSession() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();

  // Stable student identity
  const studentId = useRef<string>("");
  useEffect(() => {
    let id = sessionStorage.getItem("studentId");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("studentId", id);
    }
    studentId.current = id;
  }, []);

  // Track which questionIds this student has already answered
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Poll for current question every 2s
  const { data, isLoading, error } = trpc.session.studentPoll.useQuery(
    { sessionId },
    {
      refetchInterval: 2000,
      enabled: !!sessionId,
    }
  );

  const submitMut = trpc.session.submitResponse.useMutation({
    onSuccess: () => {
      toast.success("Response submitted!");
      if (data?.currentQuestion) {
        setAnswered((prev) => new Set(Array.from(prev).concat(data.currentQuestion!.id)));
      }
      setSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSubmitting(false);
    },
  });

  const handleSubmit = (answer: string) => {
    if (!data?.currentQuestion || !studentId.current) return;
    setSubmitting(true);
    submitMut.mutate({
      sessionId,
      questionId: data.currentQuestion.id,
      studentId: studentId.current,
      answer,
    });
  };

  const currentQ = data?.currentQuestion as Question | null | undefined;
  const hasAnswered = currentQ ? answered.has(currentQ.id) : false;

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
        <p style={{ color: CRIMSON, fontWeight: 600 }}>Session not found.</p>
        <Button variant="outline" onClick={() => navigate("/join")}>Try another code</Button>
      </div>
    );
  }

  // Session ended
  if (data.status === "closed") {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 36px",
          textAlign: "center", maxWidth: 380, width: "100%",
          border: `1px solid ${BORDER}`, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22, color: TEXT_DARK }}>Session Complete!</h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: TEXT_MID }}>
            The professor has ended this session. Thanks for participating!
          </p>
          <Button variant="outline" onClick={() => navigate("/join")}>Join Another Session</Button>
        </div>
      </div>
    );
  }

  // Waiting room (session not yet live)
  if (data.status === "draft") {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 36px",
          textAlign: "center", maxWidth: 380, width: "100%",
          border: `1px solid ${BORDER}`, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
          <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22, color: TEXT_DARK }}>Waiting Room</h2>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: TEXT_MID }}>
            The professor hasn't started the session yet. Hang tight!
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: TEXT_MUTED, fontSize: 13 }}>
            <Clock size={14} style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
            Checking for updates…
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    );
  }

  // Live — no question yet
  if (!currentQ) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 36px",
          textAlign: "center", maxWidth: 380, width: "100%",
          border: `1px solid ${BORDER}`,
        }}>
          <Loader2 size={28} style={{ color: INDIGO, animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ margin: 0, fontSize: 15, color: TEXT_MID }}>Waiting for the first question…</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`,
        height: 56, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 12,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: GREEN,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: GREEN }}>LIVE</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: TEXT_MUTED }}>
          Question {(data.currentQuestionIndex ?? 0) + 1} of {data.questionCount}
        </span>
      </header>

      {/* Progress */}
      <div style={{ height: 4, background: "oklch(0.93 0 0)" }}>
        <div style={{
          height: "100%", background: INDIGO,
          width: `${(((data.currentQuestionIndex ?? 0) + 1) / (data.questionCount || 1)) * 100}%`,
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Question card */}
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{
          background: "#fff", borderRadius: 18,
          border: `1px solid ${BORDER}`,
          padding: "28px 28px 24px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        }}>
          {/* Type badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20,
            background: INDIGO_LIGHT, marginBottom: 16,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: INDIGO, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {currentQ.type}
            </span>
          </div>

          {/* Question text */}
          <h2 style={{
            margin: "0 0 24px",
            fontFamily: "'Geist', system-ui, sans-serif",
            fontWeight: 700, fontSize: 20,
            color: TEXT_DARK, lineHeight: 1.4,
          }}>
            {currentQ.text}
          </h2>

          {/* Already answered */}
          {hasAnswered ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 12, padding: "24px 0",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: GREEN_LIGHT, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle2 size={26} style={{ color: GREEN }} />
              </div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: GREEN }}>Response submitted!</p>
              <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED }}>
                Waiting for the next question…
              </p>
            </div>
          ) : (
            /* Answer inputs */
            <>
              {currentQ.type === "Short Text" && (
                <ShortTextInput onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "Multiple Choice" && currentQ.options && (
                <MultipleChoiceInput
                  options={currentQ.options}
                  onSubmit={handleSubmit}
                  disabled={submitting}
                />
              )}
              {currentQ.type === "Star Rating" && (
                <StarRatingInput onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "True / False" && (
                <TrueFalseInput onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "File Upload" && (
                <div style={{
                  padding: "20px", borderRadius: 10,
                  border: `1.5px dashed ${BORDER}`,
                  textAlign: "center", color: TEXT_MUTED, fontSize: 13,
                }}>
                  File upload is not supported in this demo.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
