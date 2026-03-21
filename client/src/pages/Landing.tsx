/* ── Design: Structured Clarity aligned to harvard-poll token set ──
   Crimson = primary CTA (professor path)
   Blue = secondary/interactive (student path, hover states)
   Background: #F9FAFC (oklch 0.982 0.0107 271.3)
   Fonts: Geist (headings), Inter (body)
*/

import { Link } from "wouter";
import { Zap, BarChart2, Sparkles, GraduationCap, BookOpen, ArrowRight, ChevronRight } from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663458952851/86W9gfE4aRgK8Kn2hW7KrC/classroom-hero_9a6565e8.png";

const CRIMSON = "oklch(0.514 0.2 13.9)";
const CRIMSON_HOVER = "oklch(0.44 0.2 13.9)";
const CRIMSON_LIGHT = "oklch(0.97 0.04 13.9)";
const BLUE = "oklch(0.55 0.2 250)";
const BLUE_LIGHT = "oklch(0.96 0.04 250)";
const BG = "oklch(0.982 0.0107 271.3)";
const CARD_BG = "#ffffff";
const BORDER = "oklch(0.922 0 0)";
const TEXT_DARK = "oklch(0.145 0 0)";
const TEXT_MID = "oklch(0.4 0 0)";
const TEXT_MUTED = "oklch(0.556 0 0)";

const features = [
  {
    icon: <Zap size={20} />,
    color: CRIMSON,
    bg: CRIMSON_LIGHT,
    title: "Instant Interactions",
    desc: "Poll students with verified, real-time submissions during your lectures — no app download required.",
  },
  {
    icon: <BarChart2 size={20} />,
    color: BLUE,
    bg: BLUE_LIGHT,
    title: "Live Insights",
    desc: "Visualize comprehension with dynamic charts and engagement metrics that update as students respond.",
  },
  {
    icon: <Sparkles size={20} />,
    color: "oklch(0.52 0.22 290)",
    bg: "oklch(0.96 0.04 290)",
    title: "AI-Powered Synthesis",
    desc: "Paste your lecture notes and instantly generate relevant questions — or let AI synthesize student responses into actionable insights.",
  },
];

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 80 }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(249,250,252,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 32px",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 17, color: TEXT_DARK, letterSpacing: "-0.02em" }}>
            Harvard
          </span>
          <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 17, color: CRIMSON, letterSpacing: "-0.02em" }}>
            Poll
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/join"
            style={{
              fontSize: 13, fontWeight: 500, color: TEXT_MID,
              textDecoration: "none", padding: "6px 14px",
              borderRadius: 8, transition: "all 0.15s",
              border: `1px solid ${BORDER}`,
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = BLUE_LIGHT;
              (e.currentTarget as HTMLElement).style.color = BLUE;
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.88 0.04 250)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = TEXT_MID;
              (e.currentTarget as HTMLElement).style.borderColor = BORDER;
            }}
          >
            Join a Session
          </Link>
          <Link
            href="/session"
            style={{
              fontSize: 13, fontWeight: 600, color: "#fff",
              textDecoration: "none", padding: "6px 16px",
              borderRadius: 8, background: CRIMSON,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = CRIMSON_HOVER; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = CRIMSON; }}
          >
            Start Teaching
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 1160, margin: "0 auto",
        padding: "72px 32px 64px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 56,
        alignItems: "center",
      }}>
        {/* Left */}
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: CRIMSON_LIGHT, border: `1px solid oklch(0.9 0.06 13.9)`,
            borderRadius: 100, padding: "4px 12px 4px 8px",
            marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: CRIMSON, display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: CRIMSON, letterSpacing: "0.02em" }}>
              Built for Harvard classrooms
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontWeight: 500, fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1, letterSpacing: "-0.03em",
            margin: "0 0 16px",
          }}>
            <span style={{ display: "block", color: TEXT_DARK }}>Real-time insights</span>
            <span style={{ display: "block", color: TEXT_DARK }}>from the</span>
            <span style={{ display: "block", color: CRIMSON }}>connected classroom.</span>
          </h1>

          <p style={{
            fontSize: 15, lineHeight: 1.6, color: TEXT_MID,
            margin: "0 0 32px", maxWidth: 400,
          }}>
            Empower your lectures with instant student feedback and live polls.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/session"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: CRIMSON, color: "#fff",
                fontWeight: 600, fontSize: 15,
                padding: "12px 24px", borderRadius: 10,
                textDecoration: "none", transition: "background 0.15s",
                border: "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = CRIMSON_HOVER; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = CRIMSON; }}
            >
              Start Teaching
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/join"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: CARD_BG, color: TEXT_DARK,
                fontWeight: 500, fontSize: 15,
                padding: "12px 24px", borderRadius: 10,
                textDecoration: "none", transition: "all 0.15s",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = BLUE_LIGHT;
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.88 0.04 250)";
                (e.currentTarget as HTMLElement).style.color = BLUE;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = CARD_BG;
                (e.currentTarget as HTMLElement).style.borderColor = BORDER;
                (e.currentTarget as HTMLElement).style.color = TEXT_DARK;
              }}
            >
              I am a Student
            </Link>
          </div>
        </div>

        {/* Right — Hero image */}
        <div style={{ position: "relative" }}>
          <div style={{
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            border: `1px solid ${BORDER}`,
          }}>
            <img
              src={HERO_IMG}
              alt="Live polling in a Harvard classroom"
              style={{ width: "100%", display: "block" }}
            />
          </div>
          {/* Floating stat badge */}
          <div style={{
            position: "absolute", bottom: -38, left: -40,
            background: CARD_BG,
            borderRadius: 12, padding: "10px 16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 10, paddingLeft: '10px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: CRIMSON_LIGHT,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={16} style={{ color: CRIMSON }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>92% response rate</p>
              <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>avg. in live sessions</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px 72px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}>
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: CARD_BG,
                borderRadius: 16,
                border: `1px solid ${BORDER}`,
                padding: "28px 28px 32px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: f.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20, color: f.color,
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontFamily: "'Geist', system-ui, sans-serif",
                fontWeight: 700, fontSize: 17,
                color: TEXT_DARK, margin: "0 0 10px",
              }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: TEXT_MID, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Choose your path ── */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px 72px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'Geist', system-ui, sans-serif",
            fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)",
            letterSpacing: "-0.03em", color: TEXT_DARK, margin: "0 0 10px",
          }}>
            Choose your path
          </h2>
          <p style={{ fontSize: 15, color: TEXT_MUTED, margin: 0 }}>
            Two experiences, one platform.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Professor card — primary */}
          <Link
            href="/session"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: CRIMSON,
                borderRadius: 18,
                padding: "40px 36px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: `0 4px 20px oklch(0.514 0.2 13.9 / 0.25)`,
                display: "flex", flexDirection: "column", gap: 16,
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px oklch(0.514 0.2 13.9 / 0.35)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px oklch(0.514 0.2 13.9 / 0.25)`;
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <BookOpen size={24} />
              </div>
              <div>
                <p style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontWeight: 800, fontSize: 24,
                  color: "#fff", margin: "0 0 6px",
                  letterSpacing: "-0.02em",
                }}>
                  Professor Access
                </p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
                  Create sessions, build questions with AI, and view live results as your class responds.
                </p>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: "#fff", fontWeight: 600, fontSize: 14,
                marginTop: 4,
              }}>
                Get started <ChevronRight size={16} />
              </div>
            </div>
          </Link>

          {/* Student card — secondary */}
          <Link
            href="/join"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: CARD_BG,
                border: `1.5px solid ${BORDER}`,
                borderRadius: 18,
                padding: "40px 36px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex", flexDirection: "column", gap: 16,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.88 0.04 250)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = BORDER;
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: BLUE_LIGHT,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: BLUE,
              }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <p style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontWeight: 800, fontSize: 24,
                  color: TEXT_DARK, margin: "0 0 6px",
                  letterSpacing: "-0.02em",
                }}>
                  Student Portal
                </p>
                <p style={{ fontSize: 14, color: TEXT_MID, margin: 0, lineHeight: 1.5 }}>
                  Enter a session code to join your professor's live poll and submit your responses in seconds.
                </p>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: BLUE, fontWeight: 600, fontSize: 14,
                marginTop: 4,
              }}>
                Join a session <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        padding: "24px 32px",
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: 8,
      }}>
        <span style={{ fontSize: 12, color: TEXT_MUTED }}>
          © 2026 Harvard Poll · Built at Harvard University
        </span>
      </footer>
    </div>
  );
}
