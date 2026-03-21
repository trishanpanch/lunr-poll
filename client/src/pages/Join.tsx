/**
 * Join.tsx — Student join page
 *
 * Students enter a 6-char code (or arrive via QR link with ?code=XXXXXX).
 * No login required. On success, redirected to /session/live/:id as a student.
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Loader2, QrCode } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Auto-fill code from URL query param (QR code auto-join)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qCode = params.get("code");
    if (qCode) {
      const cleaned = qCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      setCode(cleaned);
    }
  }, []);

  const joinMut = trpc.session.joinByCode.useMutation({
    onSuccess: (data) => {
      // Store student identity in sessionStorage (persists across page navigations in same tab)
      if (!sessionStorage.getItem("studentId")) {
        sessionStorage.setItem("studentId", crypto.randomUUID());
      }
      navigate(`/student/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (code.trim().length < 4) {
      setError("Please enter a valid session code.");
      return;
    }
    setError("");
    joinMut.mutate({ code });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(val);
    if (error) setError("");
  };

  const loading = joinMut.isPending;

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
            <div style={{ fontSize: 48, lineHeight: 1, margin: "0 auto 20px" }}>🎓</div>
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
              placeholder="e.g. 23EAJ9"
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
                <><Loader2 size={16} className="animate-spin" /> Looking up session…</>
              ) : (
                <>Join Session <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* QR hint */}
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <QrCode size={18} style={{ color: BLUE, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: TEXT_MID, lineHeight: 1.45 }}>
              Or scan the QR code your professor displays — it will bring you here with the code pre-filled.
            </p>
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
    </div>
  );
}
