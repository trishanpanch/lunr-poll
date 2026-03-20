/* ── Design: Student join page — clean, focused, mobile-first ──
   Single action: enter a 5-character session code.
   Blue as the interactive accent (not crimson — avoids error associations).
   Background: #F9FAFC
*/

import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const CRIMSON = "oklch(0.514 0.2 13.9)";
const BLUE = "oklch(0.55 0.2 250)";
const BLUE_HOVER = "oklch(0.48 0.2 250)";
const BLUE_LIGHT = "oklch(0.96 0.04 250)";
const BG = "oklch(0.982 0.0107 271.3)";
const CARD_BG = "#ffffff";
const BORDER = "oklch(0.922 0 0)";
const TEXT_DARK = "oklch(0.145 0 0)";
const TEXT_MID = "oklch(0.4 0 0)";
const TEXT_MUTED = "oklch(0.556 0 0)";

export default function Join() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (code.trim().length < 4) {
      setError("Please enter a valid session code.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate lookup — replace with real Firebase call
    setTimeout(() => {
      setLoading(false);
      setError("Session not found. Check your code and try again.");
    }, 1400);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(val);
    if (error) setError("");
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* Nav */}
      <nav style={{
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${BORDER}`,
        background: "rgba(249,250,252,0.88)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 17, color: TEXT_DARK }}>Harvard</span>
          <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 17, color: CRIMSON }}>Poll</span>
        </Link>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 500, color: TEXT_MID,
            textDecoration: "none", padding: "6px 12px",
            borderRadius: 8, border: `1px solid ${BORDER}`,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = BLUE_LIGHT;
            (e.currentTarget as HTMLElement).style.color = BLUE;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = TEXT_MID;
          }}
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </nav>

      {/* Main */}
      <main style={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: BLUE_LIGHT,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              color: BLUE,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h1 style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 800, fontSize: 28,
              letterSpacing: "-0.03em",
              color: TEXT_DARK, margin: "0 0 8px",
            }}>
              Join a session
            </h1>
            <p style={{ fontSize: 15, color: TEXT_MID, margin: 0, lineHeight: 1.55 }}>
              Enter the code your professor displayed to join the live poll.
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: CARD_BG,
            borderRadius: 18,
            border: `1px solid ${BORDER}`,
            padding: "32px 32px 28px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}>
            <label style={{
              display: "block",
              fontSize: 12, fontWeight: 600,
              color: TEXT_MUTED, letterSpacing: "0.06em",
              textTransform: "uppercase", marginBottom: 10,
            }}>
              Session Code
            </label>

            <input
              type="text"
              value={code}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. 23EAJ"
              autoFocus
              style={{
                width: "100%",
                fontFamily: "'Geist Mono', 'Courier New', monospace",
                fontSize: 28, fontWeight: 700,
                letterSpacing: "0.15em",
                textAlign: "center",
                padding: "16px 20px",
                borderRadius: 12,
                border: `2px solid ${error ? "oklch(0.57 0.22 27)" : code.length > 0 ? BLUE : BORDER}`,
                background: code.length > 0 ? BLUE_LIGHT : BG,
                color: TEXT_DARK,
                outline: "none",
                transition: "all 0.15s",
                boxSizing: "border-box",
                boxShadow: code.length > 0 ? `0 0 0 3px oklch(0.55 0.2 250 / 0.12)` : "none",
              }}
            />

            {error && (
              <p style={{
                fontSize: 13, color: "oklch(0.57 0.22 27)",
                fontWeight: 500, margin: "10px 0 0",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span>⚠</span> {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || code.length < 4}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "14px 24px",
                borderRadius: 10,
                border: "none",
                background: code.length >= 4 ? BLUE : "oklch(0.88 0 0)",
                color: code.length >= 4 ? "#fff" : TEXT_MUTED,
                fontWeight: 600, fontSize: 15,
                cursor: code.length >= 4 ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => {
                if (code.length >= 4 && !loading) {
                  (e.currentTarget as HTMLElement).style.background = BLUE_HOVER;
                }
              }}
              onMouseLeave={(e) => {
                if (code.length >= 4) {
                  (e.currentTarget as HTMLElement).style.background = BLUE;
                }
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Looking up session...</>
              ) : (
                <>Join Session <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Footer hint */}
          <p style={{ textAlign: "center", fontSize: 13, color: TEXT_MUTED, marginTop: 20 }}>
            Are you a professor?{" "}
            <Link
              href="/session"
              style={{ color: CRIMSON, fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
            >
              Create a session →
            </Link>
          </p>
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
