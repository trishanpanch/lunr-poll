/**
 * StudentPreviewPiP.tsx — Picture-in-Picture student preview
 *
 * A draggable, resizable floating window that shows the instructor
 * what the student currently sees. Supports minimize/expand and
 * can be repositioned by dragging the header.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Minimize2,
  Maximize2,
  X,
  GripHorizontal,
  Eye,
  Star,
  Send,
  AlignJustify,
  Sliders,
} from "lucide-react";
import type { Question } from "@shared/types";

// ── Student-style colour tokens (dark theme) ─────────────────────────────────
const S_INDIGO = "oklch(0.55 0.2 250)";
const S_INDIGO_LIGHT = "rgba(99,102,241,0.12)";
const S_INDIGO_BORDER = "rgba(99,102,241,0.35)";
const S_TEXT_DARK = "#fff";
const S_TEXT_MID = "rgba(255,255,255,0.7)";
const S_TEXT_MUTED = "rgba(255,255,255,0.4)";
const S_CARD_BG = "rgba(255,255,255,0.06)";
const S_CARD_BORDER = "rgba(255,255,255,0.1)";
const S_BG_TOP = "oklch(0.18 0.04 264)";
const S_BG_BOT = "oklch(0.12 0.02 264)";

// ── Mini student question renderer ───────────────────────────────────────────
function MiniStudentView({
  question,
  questionIndex,
  questionCount,
}: {
  question: Question;
  questionIndex: number;
  questionCount: number;
}) {
  const progress = questionCount > 0 ? (questionIndex + 1) / questionCount : 0;

  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${S_BG_TOP} 0%, ${S_BG_BOT} 100%)`,
        borderRadius: "0 0 12px 12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div
          style={{
            height: "100%",
            width: `${Math.max(4, progress * 100)}%`,
            background: `linear-gradient(90deg, ${S_INDIGO}, oklch(0.65 0.2 290))`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: "0 12px",
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "oklch(0.57 0.22 27)",
              animation: "pip-pulse 1.5s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "oklch(0.57 0.22 27)",
              letterSpacing: "0.06em",
            }}
          >
            LIVE
          </span>
        </div>
        <span style={{ fontSize: 10, color: S_TEXT_MUTED, fontWeight: 500 }}>
          Q{questionIndex + 1}/{questionCount}
        </span>
      </div>

      {/* Question content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Type badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 12,
            background: S_INDIGO_LIGHT,
            border: `1px solid ${S_INDIGO_BORDER}`,
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: S_INDIGO,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {question.type}
          </span>
        </div>

        {/* Question media */}
        {question.mediaUrl && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              border: `1px solid ${S_CARD_BORDER}`,
              padding: 6,
            }}
          >
            <img
              src={question.mediaUrl}
              alt="Question media"
              style={{
                width: "100%",
                maxHeight: 100,
                objectFit: "contain",
                borderRadius: 6,
                display: "block",
              }}
            />
          </div>
        )}

        {/* Question text */}
        <p
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 13,
            color: S_TEXT_DARK,
            lineHeight: 1.35,
            letterSpacing: "-0.02em",
          }}
        >
          {question.text}
        </p>

        {/* Answer area preview (non-interactive) */}
        {question.type === "Text" && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${S_CARD_BORDER}`,
              background: S_CARD_BG,
              color: S_TEXT_MUTED,
              fontSize: 11,
            }}
          >
            Type your answer here…
          </div>
        )}

        {question.type === "Multiple Choice" && question.options && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {question.options.map((opt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${S_CARD_BORDER}`,
                  background: S_CARD_BG,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `1px solid ${S_CARD_BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: S_TEXT_MUTED,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ fontSize: 11, color: S_TEXT_MID }}>{opt}</span>
              </div>
            ))}
          </div>
        )}

        {question.type === "True / False" && (
          <div style={{ display: "flex", gap: 8 }}>
            {["True", "False"].map((label) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: `1px solid ${S_CARD_BORDER}`,
                  background: S_CARD_BG,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: S_TEXT_MID,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {question.type === "Star Rating" && (
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              padding: "4px 0",
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={20}
                style={{ color: "oklch(0.82 0.12 60)" }}
              />
            ))}
          </div>
        )}

        {question.type === "Labeled Scale" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(question.likertLabels ?? ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]).map(
              (label, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: `1px solid ${S_CARD_BORDER}`,
                    background: S_CARD_BG,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      background: "rgba(255,255,255,0.08)",
                      color: S_TEXT_MUTED,
                      border: `1px solid ${S_CARD_BORDER}`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 10, color: S_TEXT_MID }}>{label}</span>
                </div>
              )
            )}
          </div>
        )}

        {question.type === "Numeric Scale" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                justifyContent: "center",
              }}
            >
              {Array.from(
                {
                  length:
                    (question.numericMax ?? 10) - (question.numericMin ?? 1) + 1,
                },
                (_, i) => (question.numericMin ?? 1) + i
              ).map((n) => (
                <div
                  key={n}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: `1px solid ${S_CARD_BORDER}`,
                    background: S_CARD_BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: S_TEXT_MID,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 9,
                color: S_TEXT_MUTED,
              }}
            >
              <span>{question.numericLowLabel ?? "Not at all"}</span>
              <span>{question.numericHighLabel ?? "Extremely"}</span>
            </div>
          </div>
        )}

        {question.type === "File Upload" && (
          <div
            style={{
              padding: "14px 10px",
              borderRadius: 8,
              border: `1.5px dashed ${S_CARD_BORDER}`,
              background: S_CARD_BG,
              textAlign: "center",
            }}
          >
            <p style={{ color: S_TEXT_MUTED, fontSize: 10, margin: 0 }}>
              Click to upload a file
            </p>
          </div>
        )}

        {/* Fake submit button */}
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            color: S_TEXT_MUTED,
            fontWeight: 700,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 4,
          }}
        >
          <Send size={12} /> Submit Answer
        </div>
      </div>

      <style>{`
        @keyframes pip-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

// ── Main PiP component ───────────────────────────────────────────────────────
const MIN_W = 180;
const MIN_H = 280;
const EXPANDED_W = 220;
const EXPANDED_H = 390;
const COLLAPSED_W = 160;
const COLLAPSED_H = 36;

export default function StudentPreviewPiP({
  question,
  questionIndex,
  questionCount,
  onClose,
}: {
  question: Question;
  questionIndex: number;
  questionCount: number;
  onClose: () => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState(() => ({
    x: Math.max(16, window.innerWidth - 220 - 24),
    y: Math.max(80, window.innerHeight - 390 - 24),
  }));
  const [size, setSize] = useState({ w: EXPANDED_W, h: EXPANDED_H });
  const dragging = useRef(false);
  const resizing = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // ── Drag ────────────────────────────────────────────────────────────────────
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    },
    [pos]
  );

  // ── Resize ──────────────────────────────────────────────────────────────────
  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizing.current = true;
      offset.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - offset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 50, e.clientY - offset.current.y)),
        });
      }
      if (resizing.current) {
        const dx = e.clientX - offset.current.x;
        const dy = e.clientY - offset.current.y;
        offset.current = { x: e.clientX, y: e.clientY };
        setSize((prev) => ({
          w: Math.max(MIN_W, prev.w + dx),
          h: Math.max(MIN_H, prev.h + dy),
        }));
      }
    };
    const onUp = () => {
      dragging.current = false;
      resizing.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: minimized ? COLLAPSED_W : size.w,
        height: minimized ? COLLAPSED_H : size.h,
        zIndex: 999,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 0 0 1.5px rgba(255,255,255,0.12)",
        transition: minimized
          ? "width 0.25s ease, height 0.25s ease"
          : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header / drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          height: 36,
          flexShrink: 0,
          background: "oklch(0.15 0.03 264)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 6,
          cursor: "grab",
          userSelect: "none",
          borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <GripHorizontal size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        <Eye size={12} style={{ color: S_INDIGO, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          Student View
        </span>
        <button
          onClick={() => setMinimized((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            padding: 2,
            borderRadius: 4,
          }}
          title={minimized ? "Expand" : "Minimize"}
        >
          {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
        </button>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            padding: 2,
            borderRadius: 4,
          }}
          title="Close preview"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      {!minimized && (
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <MiniStudentView
            question={question}
            questionIndex={questionIndex}
            questionCount={questionCount}
          />

          {/* Resize handle (bottom-right corner) */}
          <div
            onMouseDown={onResizeStart}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 18,
              height: 18,
              cursor: "nwse-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.3 }}>
              <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="1" />
              <line x1="9" y1="4" x2="4" y2="9" stroke="white" strokeWidth="1" />
              <line x1="9" y1="7" x2="7" y2="9" stroke="white" strokeWidth="1" />
            </svg>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
