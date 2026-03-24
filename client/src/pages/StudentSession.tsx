/**
 * StudentSession.tsx — Student live view (mobile-first rebuild)
 *
 * Full-screen, touch-native design. One question at a time with large tap
 * targets. Animated submission confirmation. Works on desktop too.
 * No login required.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Star, CheckCircle2, Send, ArrowRight } from "lucide-react";
import type { Question } from "@shared/types";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const INDIGO = "oklch(0.55 0.2 250)";
const INDIGO_DARK = "oklch(0.45 0.22 264)";
const INDIGO_LIGHT = "rgba(99,102,241,0.12)";
const INDIGO_BORDER = "rgba(99,102,241,0.35)";
const GREEN = "oklch(0.52 0.18 160)";
const GREEN_LIGHT = "rgba(34,197,94,0.12)";
const CRIMSON = "oklch(0.514 0.2 13.9)";
const TEXT_DARK = "#fff";
const TEXT_MID = "rgba(255,255,255,0.7)";
const TEXT_MUTED = "rgba(255,255,255,0.4)";
const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(255,255,255,0.1)";
const BG_TOP = "oklch(0.18 0.04 264)";
const BG_BOT = "oklch(0.12 0.02 264)";

// ── Shared full-screen shell ──────────────────────────────────────────────────
function Shell({ children, progress }: { children: React.ReactNode; progress?: number }) {
  return (
    <div style={{
      minHeight: "100svh",
      background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
      fontFamily: "'Geist', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",
    }}>
      {/* Progress bar */}
      {progress !== undefined && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{
            height: "100%",
            width: `${Math.max(4, progress * 100)}%`,
            background: `linear-gradient(90deg, ${INDIGO}, oklch(0.65 0.2 290))`,
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      )}
      {children}
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} style={{ color: INDIGO, margin: "0 auto 16px" }} className="animate-spin" />
          <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Connecting…</p>
        </div>
      </div>
    </Shell>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ color: TEXT_DARK, fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>Session not found</h2>
          <p style={{ color: TEXT_MID, fontSize: 14, margin: "0 0 28px", lineHeight: 1.55 }}>
            This session may have ended or the code was incorrect.
          </p>
          <button onClick={onRetry} style={{
            padding: "14px 28px", borderRadius: 12,
            background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
            color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
          }}>
            Try another code
          </button>
        </div>
      </div>
    </Shell>
  );
}

// ── Waiting room ──────────────────────────────────────────────────────────────
function WaitingRoom({ participantCount }: { participantCount: number }) {
  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        {/* Animated pulse rings */}
        <div style={{ position: "relative", width: 96, height: 96, marginBottom: 32 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${INDIGO}`,
            animation: "ring 2s ease-out infinite",
            opacity: 0,
          }} />
          <div style={{
            position: "absolute", inset: 8, borderRadius: "50%",
            border: `2px solid ${INDIGO}`,
            animation: "ring 2s ease-out 0.5s infinite",
            opacity: 0,
          }} />
          <div style={{
            position: "absolute", inset: 16, borderRadius: "50%",
            background: INDIGO_LIGHT,
            border: `2px solid ${INDIGO_BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}>
            ⏳
          </div>
        </div>

        <h2 style={{ color: TEXT_DARK, fontWeight: 800, fontSize: 26, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Waiting Room
        </h2>
        <p style={{ color: TEXT_MID, fontSize: 15, margin: "0 0 32px", textAlign: "center", lineHeight: 1.55, maxWidth: 280 }}>
          The professor hasn't started the session yet. Hang tight!
        </p>

        {/* Participant count pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: INDIGO_LIGHT,
          border: `1.5px solid ${INDIGO_BORDER}`,
          borderRadius: 40, padding: "12px 24px",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: INDIGO,
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{participantCount}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_MID }}>
            student{participantCount !== 1 ? "s" : ""} joined
          </span>
        </div>

        <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 20, animation: "pulse 2s ease-in-out infinite" }}>
          Checking for updates every few seconds…
        </p>
      </div>

      <style>{`
        @keyframes ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </Shell>
  );
}

// ── Session ended ─────────────────────────────────────────────────────────────
function SessionEnded({ onJoinAnother }: { onJoinAnother: () => void }) {
  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(34,197,94,0.15)",
          border: "2px solid rgba(34,197,94,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24, fontSize: 36,
        }}>
          🎉
        </div>
        <h2 style={{ color: TEXT_DARK, fontWeight: 800, fontSize: 26, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Session Complete!
        </h2>
        <p style={{ color: TEXT_MID, fontSize: 15, margin: "0 0 36px", textAlign: "center", lineHeight: 1.55, maxWidth: 280 }}>
          The professor has ended this session. Thanks for participating!
        </p>
        <button onClick={onJoinAnother} style={{
          padding: "16px 32px", borderRadius: 14,
          background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`,
          color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 4px 20px oklch(0.55 0.2 250 / 0.35)",
        }}>
          Join Another Session <ArrowRight size={18} />
        </button>
      </div>
    </Shell>
  );
}

// ── Submission confirmation overlay ──────────────────────────────────────────
function SubmittedOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOT} 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        background: GREEN_LIGHT,
        border: "2px solid rgba(34,197,94,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
        animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <CheckCircle2 size={44} style={{ color: GREEN }} />
      </div>
      <h2 style={{
        color: TEXT_DARK, fontWeight: 800, fontSize: 28,
        margin: "0 0 10px", letterSpacing: "-0.02em",
        animation: "slideUp 0.3s ease 0.1s both",
      }}>
        Answer received!
      </h2>
      <p style={{
        color: TEXT_MID, fontSize: 15, margin: 0,
        animation: "slideUp 0.3s ease 0.2s both",
      }}>
        Waiting for the next question…
      </p>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Answer input components ───────────────────────────────────────────────────

function ShortTextInput({ onSubmit, disabled }: { onSubmit: (a: string) => void; disabled: boolean }) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
        placeholder="Type your answer here…"
        disabled={disabled}
        style={{
          flex: 1,
          width: "100%",
          minHeight: 120,
          borderRadius: 14,
          border: `1.5px solid ${text ? INDIGO_BORDER : CARD_BORDER}`,
          background: text ? INDIGO_LIGHT : CARD_BG,
          padding: "16px 18px",
          fontSize: 16,
          color: TEXT_DARK,
          resize: "none",
          fontFamily: "'Geist', system-ui, sans-serif",
          outline: "none",
          transition: "border-color 0.15s, background 0.15s",
          boxSizing: "border-box",
          lineHeight: 1.55,
          overflowY: "hidden",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = INDIGO_BORDER; autoResize(e.currentTarget); }}
        onBlur={(e) => { e.currentTarget.style.borderColor = text ? INDIGO_BORDER : CARD_BORDER; }}
      />
      <button
        onClick={() => text.trim() && onSubmit(text.trim())}
        disabled={disabled || !text.trim()}
        style={{
          marginTop: 14,
          width: "100%",
          padding: "16px 24px",
          borderRadius: 14,
          border: "none",
          background: text.trim()
            ? `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`
            : "rgba(255,255,255,0.08)",
          color: text.trim() ? "#fff" : TEXT_MUTED,
          fontWeight: 700, fontSize: 16,
          cursor: text.trim() && !disabled ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: text.trim() ? "0 4px 20px oklch(0.55 0.2 250 / 0.3)" : "none",
          letterSpacing: "-0.01em",
        }}
      >
        {disabled ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Submit Answer</>}
      </button>
    </div>
  );
}

function MultipleChoiceInput({ options, onSubmit, disabled }: { options: string[]; onSubmit: (a: string) => void; disabled: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const letters = "ABCDEFGHIJ";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt, i) => {
        const isSelected = selected === i;
        return (
          <button
            key={i}
            onClick={() => { if (!disabled) { setSelected(i); } }}
            disabled={disabled}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 18px", borderRadius: 14, textAlign: "left",
              border: `1.5px solid ${isSelected ? INDIGO_BORDER : CARD_BORDER}`,
              background: isSelected ? INDIGO_LIGHT : CARD_BG,
              color: TEXT_DARK, fontSize: 16, fontWeight: isSelected ? 600 : 400,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              width: "100%",
              boxShadow: isSelected ? `0 0 0 2px ${INDIGO_BORDER}` : "none",
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 800,
              background: isSelected ? INDIGO : "rgba(255,255,255,0.08)",
              color: isSelected ? "#fff" : TEXT_MUTED,
              transition: "all 0.15s",
            }}>
              {letters[i]}
            </span>
            <span style={{ lineHeight: 1.4 }}>{opt}</span>
          </button>
        );
      })}
      <button
        onClick={() => selected !== null && onSubmit(String(selected))}
        disabled={disabled || selected === null}
        style={{
          marginTop: 6,
          width: "100%",
          padding: "16px 24px",
          borderRadius: 14,
          border: "none",
          background: selected !== null
            ? `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`
            : "rgba(255,255,255,0.08)",
          color: selected !== null ? "#fff" : TEXT_MUTED,
          fontWeight: 700, fontSize: 16,
          cursor: selected !== null && !disabled ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: selected !== null ? "0 4px 20px oklch(0.55 0.2 250 / 0.3)" : "none",
          letterSpacing: "-0.01em",
        }}
      >
        {disabled ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Submit Answer</>}
      </button>
    </div>
  );
}

function TrueFalseInput({ onSubmit, disabled }: { onSubmit: (a: string) => void; disabled: boolean }) {
  const [selected, setSelected] = useState<"True" | "False" | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {(["True", "False"] as const).map((label) => {
          const isSelected = selected === label;
          const color = label === "True" ? GREEN : CRIMSON;
          const colorLight = label === "True" ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.12)";
          const colorBorder = label === "True" ? "rgba(34,197,94,0.35)" : "rgba(220,38,38,0.35)";
          return (
            <button
              key={label}
              onClick={() => { if (!disabled) setSelected(label); }}
              disabled={disabled}
              style={{
                flex: 1,
                padding: "22px 0",
                borderRadius: 16,
                border: `1.5px solid ${isSelected ? colorBorder : CARD_BORDER}`,
                background: isSelected ? colorLight : CARD_BG,
                color: isSelected ? color : TEXT_MID,
                fontSize: 18, fontWeight: 800,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                boxShadow: isSelected ? `0 0 0 2px ${colorBorder}` : "none",
                letterSpacing: "-0.01em",
              }}
            >
              {label === "True" ? "✓ True" : "✗ False"}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => selected && onSubmit(selected)}
        disabled={disabled || !selected}
        style={{
          width: "100%",
          padding: "16px 24px",
          borderRadius: 14,
          border: "none",
          background: selected
            ? `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`
            : "rgba(255,255,255,0.08)",
          color: selected ? "#fff" : TEXT_MUTED,
          fontWeight: 700, fontSize: 16,
          cursor: selected && !disabled ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: selected ? "0 4px 20px oklch(0.55 0.2 250 / 0.3)" : "none",
          letterSpacing: "-0.01em",
        }}
      >
        {disabled ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Submit Answer</>}
      </button>
    </div>
  );
}

function StarRatingInput({ onSubmit, disabled }: { onSubmit: (a: string) => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const GOLD = "oklch(0.75 0.18 60)";
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: "clamp(8px, 3vw, 16px)" }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = hovered >= n || selected >= n;
          return (
            <button
              key={n}
              onClick={() => { if (!disabled) setSelected(n); }}
              onMouseEnter={() => { if (!disabled) setHovered(n); }}
              onMouseLeave={() => setHovered(0)}
              disabled={disabled}
              style={{
                background: "none", border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                padding: "4px",
                transition: "transform 0.15s",
                transform: active ? "scale(1.2)" : "scale(1)",
              }}
            >
              <Star
                size={44}
                fill={active ? GOLD : "none"}
                stroke={active ? GOLD : "rgba(255,255,255,0.2)"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {(hovered > 0 || selected > 0) && (
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 600,
          color: TEXT_MID, animation: "fadeIn 0.15s ease",
        }}>
          {labels[hovered || selected]}
        </p>
      )}
      <button
        onClick={() => selected > 0 && onSubmit(String(selected))}
        disabled={disabled || selected === 0}
        style={{
          width: "100%",
          padding: "16px 24px",
          borderRadius: 14,
          border: "none",
          background: selected > 0
            ? `linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK})`
            : "rgba(255,255,255,0.08)",
          color: selected > 0 ? "#fff" : TEXT_MUTED,
          fontWeight: 700, fontSize: 16,
          cursor: selected > 0 && !disabled ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s",
          boxShadow: selected > 0 ? "0 4px 20px oklch(0.55 0.2 250 / 0.3)" : "none",
          letterSpacing: "-0.01em",
        }}
      >
        {disabled ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Submit Answer</>}
      </button>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// ── Waiting-for-next-question state (after answering) ─────────────────────────
function AnsweredState() {
  return (
    <div style={{
      flex: 1,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: GREEN_LIGHT,
        border: "2px solid rgba(34,197,94,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <CheckCircle2 size={34} style={{ color: GREEN }} />
      </div>
      <h3 style={{ color: TEXT_DARK, fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>
        Response submitted!
      </h3>
      <p style={{ color: TEXT_MID, fontSize: 15, margin: 0, lineHeight: 1.55 }}>
        Waiting for the next question…
      </p>
      <div style={{
        marginTop: 24, display: "flex", alignItems: "center", gap: 8,
        color: TEXT_MUTED, fontSize: 13,
        animation: "pulse 2s ease-in-out infinite",
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: GREEN,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        Checking for updates…
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentSession() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();

  const studentId = useRef<string>("");
  useEffect(() => {
    let id = sessionStorage.getItem("studentId");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("studentId", id);
    }
    studentId.current = id;
  }, []);

  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data, isLoading, error } = trpc.session.studentPoll.useQuery(
    { sessionId },
    { refetchInterval: 2000, enabled: !!sessionId }
  );

  const participantCountQ = trpc.session.participantCount.useQuery(
    { sessionId },
    { refetchInterval: 5000, enabled: !!sessionId }
  );
  const participantCount = participantCountQ.data?.count ?? 0;

  const submitMut = trpc.session.submitResponse.useMutation({
    onSuccess: () => {
      if (data?.currentQuestion) {
        setAnswered((prev) => new Set(Array.from(prev).concat(data.currentQuestion!.id)));
      }
      setSubmitting(false);
      setShowConfirmation(true);
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
  const progress = data?.questionCount
    ? ((data.currentQuestionIndex ?? 0) + 1) / data.questionCount
    : 0;

  // ── Render states ────────────────────────────────────────────────────────────

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen onRetry={() => navigate("/join")} />;
  if (data.status === "closed") return <SessionEnded onJoinAnother={() => navigate("/join")} />;
  if (data.status === "draft") return <WaitingRoom participantCount={participantCount} />;

  // Live — no question yet
  if (!currentQ) {
    return (
      <Shell>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={32} style={{ color: INDIGO, margin: "0 auto 16px" }} className="animate-spin" />
            <p style={{ color: TEXT_MID, fontSize: 15, margin: 0 }}>Waiting for the first question…</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <>
      {/* Submission confirmation overlay */}
      {showConfirmation && (
        <SubmittedOverlay onDone={() => setShowConfirmation(false)} />
      )}

      <Shell progress={progress}>
        {/* Header */}
        <header style={{
          padding: "0 20px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "oklch(0.57 0.22 27)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "oklch(0.57 0.22 27)", letterSpacing: "0.06em" }}>LIVE</span>
          </div>
          <span style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 500 }}>
            Question {(data.currentQuestionIndex ?? 0) + 1} of {data.questionCount}
          </span>
        </header>

        {/* Main content */}
        {hasAnswered ? (
          <AnsweredState />
        ) : (
          <main style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "28px 20px 32px",
            maxWidth: 560,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}>
            {/* Question type badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: INDIGO_LIGHT,
              border: `1px solid ${INDIGO_BORDER}`,
              marginBottom: 18, alignSelf: "flex-start",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: INDIGO,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                {currentQ.type}
              </span>
            </div>

            {/* Question text */}
            <h2 style={{
              margin: "0 0 28px",
              fontWeight: 800,
              fontSize: "clamp(20px, 5vw, 26px)",
              color: TEXT_DARK,
              lineHeight: 1.35,
              letterSpacing: "-0.02em",
            }}>
              {currentQ.text}
            </h2>

            {/* Answer input */}
            <div style={{ flex: 1 }}>
              {currentQ.type === "Text" && (
                <ShortTextInput onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "Multiple Choice" && currentQ.options && (
                <MultipleChoiceInput options={currentQ.options} onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "True / False" && (
                <TrueFalseInput onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "Star Rating" && (
                <StarRatingInput onSubmit={handleSubmit} disabled={submitting} />
              )}
              {currentQ.type === "File Upload" && (
                <div style={{
                  padding: "32px 24px", borderRadius: 14,
                  border: `1.5px dashed ${CARD_BORDER}`,
                  background: CARD_BG, textAlign: "center",
                }}>
                  <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
                    File upload is not yet supported on mobile.
                  </p>
                </div>
              )}
            </div>
          </main>
        )}
      </Shell>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </>
  );
}
