/**
 * Join.tsx — Student join page (mobile-first rebuild)
 *
 * Full-screen, touch-native design with individual character boxes for the
 * 6-char session code. Auto-advances on complete. Works on desktop too
 * (centered card layout on wide screens). No login required.
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, QrCode, ChevronLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CODE_LENGTH = 6;

const INDIGO = "oklch(0.55 0.2 250)";
const INDIGO_DARK = "oklch(0.45 0.22 264)";
const INDIGO_LIGHT = "oklch(0.96 0.04 250)";
const CRIMSON = "oklch(0.514 0.2 13.9)";
const TEXT_DARK = "oklch(0.145 0 0)";
const TEXT_MID = "oklch(0.4 0 0)";
const TEXT_MUTED = "oklch(0.65 0 0)";
const BORDER = "oklch(0.922 0 0)";
const BG = "oklch(0.982 0.0107 271.3)";

export default function Join() {
  const [, navigate] = useLocation();
  const [chars, setChars] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = chars.join("");

  // Auto-fill from ?code= URL param (QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qCode = params.get("code");
    if (qCode) {
      const cleaned = qCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
      const padded = cleaned.split("").concat(Array(CODE_LENGTH).fill("")).slice(0, CODE_LENGTH);
      setChars(padded);
    }
  }, []);

  // Auto-focus first empty box on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, []);

  const joinMut = trpc.session.joinByCode.useMutation({
    onSuccess: (data) => {
      if (!sessionStorage.getItem("studentId")) {
        sessionStorage.setItem("studentId", crypto.randomUUID());
      }
      navigate(`/student/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
      triggerShake();
    },
  });

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (trimmed.length < CODE_LENGTH) {
      setError("Please enter all 6 characters.");
      triggerShake();
      return;
    }
    setError("");
    joinMut.mutate({ code: trimmed });
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i]) {
        const next = [...chars];
        next[i] = "";
        setChars(next);
        setError("");
      } else if (i > 0) {
        const next = [...chars];
        next[i - 1] = "";
        setChars(next);
        setError("");
        inputRefs.current[i - 1]?.focus();
      }
    } else if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleInput = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!raw) return;

    // Handle paste: distribute across boxes
    if (raw.length > 1) {
      const next = [...chars];
      let cursor = i;
      for (const ch of raw) {
        if (cursor >= CODE_LENGTH) break;
        next[cursor] = ch;
        cursor++;
      }
      setChars(next);
      setError("");
      const focusIdx = Math.min(cursor, CODE_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      // Auto-submit if filled
      if (next.every((c) => c !== "")) {
        setTimeout(() => joinMut.mutate({ code: next.join("") }), 60);
      }
      return;
    }

    const next = [...chars];
    next[i] = raw[0];
    setChars(next);
    setError("");

    if (i < CODE_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus();
    } else {
      // Last box filled — auto-submit
      const full = next.join("");
      if (full.length === CODE_LENGTH) {
        setTimeout(() => joinMut.mutate({ code: full }), 60);
      }
    }
  };

  const handleBoxFocus = (i: number) => {
    // On tap/click, move focus to first empty box or the tapped box
    const firstEmpty = chars.findIndex((c) => c === "");
    if (firstEmpty !== -1 && firstEmpty < i) {
      inputRefs.current[firstEmpty]?.focus();
    }
  };

  const loading = joinMut.isPending;
  const filled = chars.filter((c) => c !== "").length;

  return (
    <div style={{
      minHeight: "100svh",
      background: "linear-gradient(160deg, oklch(0.18 0.04 264) 0%, oklch(0.12 0.02 264) 100%)",
      fontFamily: "'Geist', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",
    }}>

      {/* Top nav */}
      <nav style={{
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>Harvard</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: CRIMSON, letterSpacing: "-0.02em" }}>Poll</span>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20, padding: "6px 12px",
            color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>
      </nav>

      {/* Main content — vertically centered */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px 40px",
      }}>

        {/* Icon + heading */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 34,
          }}>
            🎓
          </div>
          <h1 style={{
            fontWeight: 800, fontSize: "clamp(26px, 7vw, 34px)",
            letterSpacing: "-0.03em", color: "#fff", margin: "0 0 10px",
          }}>
            Join a session
          </h1>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.55)",
            margin: 0, lineHeight: 1.55, maxWidth: 300,
          }}>
            Enter the 6-character code your professor displayed
          </p>
        </div>

        {/* Code input boxes */}
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 2.5vw, 14px)",
            marginBottom: 12,
            animation: shake ? "shake 0.45s ease" : "none",
          }}
        >
          {chars.map((ch, i) => {
            const isFilled = ch !== "";
            const isActive = !loading && chars.slice(0, i).every((c) => c !== "");
            const hasError = !!error;
            return (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={6} // allow paste of full code
                value={ch}
                onChange={(e) => handleInput(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={() => handleBoxFocus(i)}
                disabled={loading}
                style={{
                  width: "clamp(44px, 12vw, 58px)",
                  height: "clamp(56px, 15vw, 72px)",
                  borderRadius: 14,
                  border: `2px solid ${
                    hasError ? "oklch(0.57 0.22 27)" :
                    isFilled ? INDIGO :
                    isActive ? "rgba(255,255,255,0.25)" :
                    "rgba(255,255,255,0.1)"
                  }`,
                  background: isFilled
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(255,255,255,0.05)",
                  color: isFilled ? "#fff" : "rgba(255,255,255,0.4)",
                  fontFamily: "'Geist Mono', 'Courier New', monospace",
                  fontSize: "clamp(22px, 6vw, 28px)",
                  fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                  caretColor: "transparent",
                  transition: "border-color 0.15s, background 0.15s",
                  boxShadow: isFilled ? `0 0 0 3px oklch(0.55 0.2 250 / 0.2)` : "none",
                  cursor: "text",
                  WebkitAppearance: "none",
                }}
              />
            );
          })}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
          {chars.map((ch, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: ch ? INDIGO : "rgba(255,255,255,0.15)",
              transition: "background 0.15s",
            }} />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 10, padding: "10px 16px",
            marginBottom: 16, maxWidth: 340, width: "100%",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, color: "oklch(0.75 0.18 27)", fontWeight: 500 }}>
              {error}
            </p>
          </div>
        )}

        {/* Join button */}
        <button
          onClick={handleSubmit}
          disabled={loading || filled < CODE_LENGTH}
          style={{
            width: "100%",
            maxWidth: 340,
            padding: "16px 24px",
            borderRadius: 14,
            border: "none",
            background: filled === CODE_LENGTH
              ? `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_DARK} 100%)`
              : "rgba(255,255,255,0.08)",
            color: filled === CODE_LENGTH ? "#fff" : "rgba(255,255,255,0.3)",
            fontWeight: 700, fontSize: 16,
            cursor: filled === CODE_LENGTH && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.2s",
            boxShadow: filled === CODE_LENGTH ? "0 4px 20px oklch(0.55 0.2 250 / 0.35)" : "none",
            letterSpacing: "-0.01em",
          }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Finding session…</>
          ) : (
            <>Join Session <ArrowRight size={18} /></>
          )}
        </button>

        {/* QR hint */}
        <div style={{
          marginTop: 24,
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, maxWidth: 340, width: "100%",
        }}>
          <QrCode size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>
            Or scan the QR code your professor shows — it'll pre-fill the code automatically.
          </p>
        </div>

        {/* Professor link */}
        <p style={{
          marginTop: 28, fontSize: 13,
          color: "rgba(255,255,255,0.3)", textAlign: "center",
        }}>
          Are you a professor?{" "}
          <button
            onClick={() => navigate("/session")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: CRIMSON, fontWeight: 600, fontSize: 13,
              padding: 0, textDecoration: "underline",
            }}
          >
            Create a session →
          </button>
        </p>
      </main>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
