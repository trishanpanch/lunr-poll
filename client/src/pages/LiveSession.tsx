/**
 * LiveSession.tsx — Professor Live Mode
 *
 * Shows the current question, live response counts/charts, QR code for students,
 * and controls to navigate questions and close the session.
 *
 * Polling interval: 2 s (lightweight, no websocket needed for MVP).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  X,
  QrCode,
  Users,
  BarChart2,
  CheckCircle2,
  Star,
  Type,
  ListChecks,
  ToggleLeft,
  Paperclip,
  Copy,
  ExternalLink,
  Loader2,
  Download,
  Cloud,
  ZoomIn,
  AlignJustify,
  Sliders,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QRCode from "qrcode";
import type { Question } from "@shared/types";
import WordCloud from "@/components/WordCloud";
import StudentPreviewPiP, { MiniStudentView } from "@/components/StudentPreviewPiP";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const INDIGO = "var(--primary)";
const INDIGO_LIGHT = "var(--indigo-light)";
const BORDER = "var(--border)";
const TEXT_DARK = "var(--foreground)";
const TEXT_MID = "var(--foreground)";
const TEXT_MUTED = "var(--muted-foreground)";
const BG = "var(--background)";
const GREEN = "var(--green)";
const GREEN_LIGHT = "var(--green-light)";
const CRIMSON = "var(--crimson)";

const TYPE_ICON: Record<string, React.ReactNode> = {
  "Text": <Type size={16} />,
  "Multiple Choice": <ListChecks size={16} />,
  "File Upload": <Paperclip size={16} />,
  "Star Rating": <Star size={16} />,
  "True / False": <ToggleLeft size={16} />,
  "Labeled Scale": <AlignJustify size={16} />,
  "Numeric Scale": <Sliders size={16} />,
};

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QRModal({ code, onClose }: { code: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState("");
  const joinUrl = `${window.location.origin}/join?code=${code}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } }).then(setDataUrl);
  }, [joinUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `alicepoll-join-${code}.png`;
    a.click();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)", borderRadius: 20, padding: "32px 36px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxWidth: 400, width: "100%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: TEXT_DARK, fontFamily: "'Geist', system-ui, sans-serif" }}>
            Scan to Join
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: TEXT_MUTED }}>
            Students scan this QR code to join instantly
          </p>
        </div>

        {dataUrl ? (
          <img src={dataUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 12 }} />
        ) : (
          <div style={{ width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={32} style={{ color: INDIGO, animation: "spin 1s linear infinite" }} />
          </div>
        )}

        <div style={{
          background: BG, borderRadius: 12, padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%",
        }}>
          <span style={{
            fontFamily: "'Geist Mono', monospace", fontSize: 22, fontWeight: 800,
            letterSpacing: "0.15em", color: INDIGO, textAlign: "center",
          }}>
            {code}
          </span>
          <button
            onClick={() => { navigator.clipboard.writeText(code); toast.success("Code copied!"); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: 4, borderRadius: 6 }}
          >
            <Copy size={16} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(joinUrl); toast.success("Link copied!"); }}
            style={{ flex: 1, fontSize: 12 }}
          >
            <Copy size={13} /> Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(joinUrl, "_blank")}
            style={{ flex: 1, fontSize: 12 }}
          >
            <ExternalLink size={13} /> Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!dataUrl}
            style={{ flex: 1, fontSize: 12 }}
          >
            <Download size={13} /> Download
          </Button>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: TEXT_MUTED, fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          Close
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/// ── Response bar chart ────────────────────────────────────────────
function ResponseChart({
  type,
  tally,
  total,
  options,
  correctIndex,
  tfAnswer,
  likertLabels,
  numericMin,
  numericMax,
  numericLowLabel,
  numericHighLabel,
}: {
  type: string;
  tally: Record<string, number>;
  total: number;
  options?: string[];
  correctIndex?: number;
  tfAnswer?: string;
  likertLabels?: string[];
  numericMin?: number;
  numericMax?: number;
  numericLowLabel?: string;
  numericHighLabel?: string;
}) {
  if (type === "Multiple Choice" && options) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt, i) => {
          const count = tally[String(i)] ?? tally[opt] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isCorrect = correctIndex === i;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT_DARK }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isCorrect && <CheckCircle2 size={13} style={{ color: GREEN }} />}
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
                <span style={{ fontWeight: 600, color: isCorrect ? GREEN : TEXT_MID }}>{count}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--muted)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${pct}%`,
                  background: isCorrect ? GREEN : INDIGO,
                  transition: "width 0.4s ease",
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
      <div style={{ display: "flex", gap: 12 }}>
        {["True", "False"].map((label) => {
          const count = tally[label] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isCorrect = tfAnswer === label;
          return (
            <div key={label} style={{
              flex: 1, background: isCorrect ? GREEN_LIGHT : BG,
              border: `1.5px solid ${isCorrect ? GREEN : BORDER}`,
              borderRadius: 12, padding: "14px 16px", textAlign: "center",
            }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: isCorrect ? GREEN : TEXT_DARK }}>{label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: isCorrect ? GREEN : TEXT_DARK }}>{count}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: TEXT_MUTED }}>{pct}%</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "Star Rating") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = tally[String(star)] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_MID, width: 20 }}>{star}★</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--muted)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${pct}%`,
                  background: "var(--amber)",
                  transition: "width 0.4s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, color: TEXT_MUTED, width: 28, textAlign: "right" }}>{count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "Labeled Scale") {
    const effectiveLabels = (likertLabels && likertLabels.length === 5)
      ? likertLabels
      : ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {effectiveLabels.map((label, i) => {
          const val = String(i + 1);
          const count = tally[val] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MID, width: 18, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: TEXT_MID }}>{label}</span>
                <div style={{ height: 7, borderRadius: 4, background: "var(--muted)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: INDIGO, transition: "width 0.4s ease" }} />
                </div>
              </div>
              <span style={{ fontSize: 12, color: TEXT_MUTED, width: 28, textAlign: "right", flexShrink: 0 }}>{count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "Numeric Scale") {
    const min = numericMin ?? 1;
    const max = numericMax ?? 10;
    const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {nums.map((n) => {
            const count = tally[String(n)] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const intensity = total > 0 ? count / Math.max(...nums.map((x) => tally[String(x)] ?? 0), 1) : 0;
            return (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 32 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: `oklch(0.55 0.2 250 / ${0.1 + intensity * 0.7})`,
                  color: intensity > 0.5 ? TEXT_DARK : TEXT_MID,
                  border: `1.5px solid oklch(0.55 0.2 250 / ${0.2 + intensity * 0.5})`,
                  transition: "all 0.3s",
                }}>{n}</div>
                <span style={{ fontSize: 10, color: TEXT_MUTED }}>{count}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>{numericLowLabel ?? "Not at all"}</span>
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>{numericHighLabel ?? "Extremely"}</span>
        </div>
      </div>
    );
  }

  // Text — list responses
  const textResponses = Object.entries(tally);
  if (textResponses.length === 0) {
    return <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>No responses yet.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
      {Object.keys(tally).map((answer, i) => (
        <div key={i} style={{
          padding: "8px 12px", borderRadius: 8,
          background: BG, border: `1px solid ${BORDER}`,
          fontSize: 13, color: TEXT_DARK,
        }}>
          {answer}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveSession() {
  const params = useParams<{ id: string }>();
  const sessionId = parseInt(params.id ?? "0");
  const [, navigate] = useLocation();
  const [showQR, setShowQR] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showStudentPreview, setShowStudentPreview] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const pipContainerRef = useRef<HTMLDivElement>(null);

  // Track if the PiP window gets closed externally
  useEffect(() => {
    if (!pipWindow) return;
    const handleClose = () => {
      setPipWindow(null);
      setIsPoppedOut(false);
    };
    pipWindow.addEventListener("pagehide", handleClose);
    return () => pipWindow.removeEventListener("pagehide", handleClose);
  }, [pipWindow]);

  const handlePopOut = async () => {
    // Document Picture-in-Picture API
    if ("documentPictureInPicture" in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 560,
        });
        // Copy stylesheets so Tailwind/fonts work inside PiP
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            const css = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
            const style = pip.document.createElement("style");
            style.textContent = css;
            pip.document.head.appendChild(style);
          } catch {
            // Cross-origin sheets — copy link instead
            if (sheet.href) {
              const link = pip.document.createElement("link");
              link.rel = "stylesheet";
              link.href = sheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });
        // Add Google Fonts link
        const fontLink = pip.document.createElement("link");
        fontLink.rel = "stylesheet";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap";
        pip.document.head.appendChild(fontLink);
        // Style the PiP body
        pip.document.body.style.margin = "0";
        pip.document.body.style.padding = "0";
        pip.document.body.style.overflow = "auto";
        pip.document.body.style.background = "oklch(0.14 0.02 264)";
        pip.document.body.style.fontFamily = "'Geist', system-ui, sans-serif";
        setPipWindow(pip);
        setIsPoppedOut(true);
      } catch (e) {
        console.error("Document PiP failed:", e);
        toast.error("Picture-in-Picture is not supported in this browser.");
      }
    } else {
      // Fallback: open in a regular window
      const w = window.open(
        `/preview/${sessionId}`,
        `student-preview-${sessionId}`,
        "width=375,height=667,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
      );
      if (w) {
        setIsPoppedOut(true);
        // Poll for close
        const timer = setInterval(() => {
          if (w.closed) {
            clearInterval(timer);
            setIsPoppedOut(false);
          }
        }, 500);
      }
    }
  };

  const handlePopIn = () => {
    if (pipWindow) {
      pipWindow.close();
    }
    setPipWindow(null);
    setIsPoppedOut(false);
  };

  const utils = trpc.useUtils();

  // Fetch live state (poll every 2s)
  const { data, isLoading, error } = trpc.session.liveState.useQuery(
    { id: sessionId },
    { refetchInterval: 2000, enabled: !!sessionId }
  );

  const responseCounts = trpc.session.responseCounts.useQuery(
    { id: sessionId },
    { refetchInterval: 2000, enabled: !!sessionId }
  );

  const launchMut = trpc.session.launch.useMutation({
    onSuccess: () => utils.session.liveState.invalidate(),
  });
  const closeMut = trpc.session.close.useMutation({
    onSuccess: () => {
      utils.session.liveState.invalidate();
      navigate("/sessions");
    },
  });
  const nextMut = trpc.session.nextQuestion.useMutation({
    onSuccess: () => utils.session.liveState.invalidate(),
  });
  const prevMut = trpc.session.prevQuestion.useMutation({
    onSuccess: () => utils.session.liveState.invalidate(),
  });

  const session = data?.session;
  const questions = (session?.questions as Question[]) ?? [];
  const currentIdx = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentIdx];
  const currentStats = responseCounts.data?.find((r) => r.questionId === currentQ?.id);

  // ── Participant count (polls every 5s) ────────────────────────────────────
  const participantCountQ = trpc.session.participantCount.useQuery(
    { sessionId },
    { refetchInterval: 5000, enabled: !!sessionId }
  );
  const participantCount = participantCountQ.data?.count ?? 0;

  // ── CSV export ────────────────────────────────────────────────────────────
  const csvExport = trpc.session.exportCsv.useQuery(
    { id: sessionId },
    { enabled: false } // only fetch on demand
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

  // ── Word cloud view toggle ────────────────────────────────────────────────
  const [showWordCloud, setShowWordCloud] = useState(false);

  const handleLaunch = async () => {
    await launchMut.mutateAsync({ id: sessionId });
    toast.success("Session is now live!");
  };

  const handleClose = async () => {
    setShowEndConfirm(false);
    setClosing(true);
    try {
      await closeMut.mutateAsync({ id: sessionId });
      toast.success("Session closed");
    } finally {
      setClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        <Loader2 size={32} style={{ color: INDIGO, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, flexDirection: "column", gap: 16 }}>
        <p style={{ color: CRIMSON, fontWeight: 600 }}>Session not found or access denied.</p>
        <Button variant="outline" onClick={() => navigate("/sessions")}>Back to Sessions</Button>
      </div>
    );
  }

  const isLive = session.status === "live";
  const isDraft = session.status === "draft";

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "color-mix(in oklch, var(--card) 95%, transparent)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`,
        height: 60, display: "flex", alignItems: "center",
        padding: "0 24px", gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <button
          onClick={() => navigate("/sessions")}
          style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 4, fontSize: 13, padding: "4px 8px", borderRadius: 8 }}
        >
          <ChevronLeft size={16} /> Sessions
        </button>

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: TEXT_DARK }}>{session.name}</p>
        </div>

        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: isLive ? "var(--amber-light)" : "var(--muted)",
          border: `1px solid ${isLive ? "var(--amber-border)" : BORDER}`,
        }}>
          {isLive && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", animation: "pulse 1.5s ease-in-out infinite" }} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: isLive ? "var(--amber)" : TEXT_MUTED }}>
            {session.status.toUpperCase()}
          </span>
        </div>

        {/* Join code */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>Code:</span>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 800, fontSize: 16, color: INDIGO, letterSpacing: "0.12em" }}>
            {session.code}
          </span>
          <button
            onClick={() => setShowQR(true)}
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: TEXT_MID }}
          >
            <QrCode size={14} /> QR
          </button>
          <button
            onClick={() => {
              const joinUrl = `${window.location.origin}/join?code=${session.code}`;
              navigator.clipboard.writeText(joinUrl);
              toast.success("Join link copied!");
            }}
            title="Copy join link"
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: TEXT_MID }}
          >
            <Copy size={14} /> Share
          </button>

        </div>

        {/* Actions */}
        {isDraft && (
          <Button
            onClick={handleLaunch}
            disabled={questions.length === 0 || launchMut.isPending}
            style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 13 }}
          >
            {launchMut.isPending ? <Loader2 size={14} className="animate-spin" /> : "🚀 Launch"}
          </Button>
        )}
        {isLive && (
          <>
            <Button
              variant="outline"
              onClick={handleDownloadCsv}
              disabled={csvExport.isFetching}
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              {csvExport.isFetching ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEndConfirm(true)}
              disabled={closing}
              style={{ borderColor: CRIMSON, color: CRIMSON, fontWeight: 600, fontSize: 13 }}
            >
              <X size={14} /> End Session
            </Button>
          </>
        )}
      </header>

      {/* Main content — bento two-column layout */}
      <main style={{ display: "flex", gap: 24, padding: "24px 24px 80px", maxWidth: 1280, margin: "0 auto", alignItems: "flex-start" }}>

        {/* LEFT: Student Preview (always visible when live) */}
        {isLive && currentQ && (
          <div style={{
            width: isPoppedOut ? 64 : 280, minWidth: isPoppedOut ? 64 : 280, flexShrink: 0,
            position: "sticky", top: 84,
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px var(--border)",
            background: "var(--card)",
            transition: "width 0.3s ease, min-width 0.3s ease",
          }}>
            {isPoppedOut ? (
              /* Compact indicator when popped out */
              <div style={{
                background: "oklch(0.14 0.02 264)",
                padding: "16px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                minHeight: 200,
              }}>
                <Eye size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.06em", writingMode: "vertical-rl", textOrientation: "mixed",
                }}>STUDENT VIEW</span>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "oklch(0.52 0.18 160)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", writingMode: "vertical-rl" }}>POPPED OUT</span>
                <button
                  onClick={handlePopIn}
                  title="Dock preview back"
                  style={{
                    marginTop: 8, padding: "6px", borderRadius: 8,
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              /* Full inline preview */
              <>
                {/* Phone frame header with pop-out button */}
                <div style={{
                  background: "oklch(0.14 0.02 264)",
                  padding: "8px 12px 4px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Eye size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>STUDENT VIEW</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Q{currentIdx + 1}/{questions.length}</span>
                    <button
                      onClick={handlePopOut}
                      title="Pop out to separate window"
                      style={{
                        padding: "3px", borderRadius: 4,
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                        color: "rgba(255,255,255,0.5)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
                <MiniStudentView question={currentQ} questionIndex={currentIdx} questionCount={questions.length} />
              </>
            )}
          </div>
        )}

        {/* RIGHT: Instructor panel */}
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Draft state */}
        {isDraft && (
          <div style={{
            background: "var(--card)", borderRadius: 16, border: `1px solid ${BORDER}`,
            padding: "32px", textAlign: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22, color: TEXT_DARK }}>Ready to launch?</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: TEXT_MUTED }}>
              This session has {questions.length} question{questions.length !== 1 ? "s" : ""}. Launch it to go live.
            </p>
            <Button
              onClick={handleLaunch}
              disabled={questions.length === 0 || launchMut.isPending}
              style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 15, padding: "10px 28px" }}
            >
              {launchMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Launching…</> : "🚀 Launch Session"}
            </Button>
          </div>
        )}

        {/* Live state */}
        {isLive && currentQ && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>
                Question {currentIdx + 1} of {questions.length}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--muted)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${((currentIdx + 1) / questions.length) * 100}%`,
                  background: INDIGO, transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: TEXT_MID }}>
                  <Users size={14} />
                  <span>{participantCount} joined</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: TEXT_MID }}>
                  <BarChart2 size={14} />
                  <span>{currentStats?.total ?? 0} response{(currentStats?.total ?? 0) !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            {/* Current question card */}
            <div style={{
              background: "var(--card)", borderRadius: 16, border: `1px solid ${BORDER}`,
              padding: "28px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ color: INDIGO }}>{TYPE_ICON[currentQ.type]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED }}>
                  {currentQ.type}
                </span>
              </div>
              {currentQ.mediaUrl && (
                <div style={{ marginTop: 4, marginBottom: 20, background: "var(--muted)", borderRadius: 12, border: `1px solid ${BORDER}`, padding: 10 }}>
                  <div
                    style={{ position: "relative", cursor: "zoom-in", display: "block", width: "100%" }}
                    onClick={() => setLightboxUrl(currentQ.mediaUrl!)}
                    title="Click to expand"
                  >
                    <img
                      src={currentQ.mediaUrl}
                      alt="Question media"
                      style={{
                        width: "100%",
                        maxHeight: 260,
                        objectFit: "contain",
                        borderRadius: 8,
                        display: "block",
                        height: "auto",
                      }}
                    />

                  </div>
                </div>
              )}
              {lightboxUrl && createPortal(
                <div onClick={() => setLightboxUrl(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
                  <button onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, color: "#fff", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={18} />
                  </button>
                  <img src={lightboxUrl} alt="Expanded" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", cursor: "default" }} />
                </div>,
                document.body
              )}
              <h2 style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 20, color: TEXT_DARK, lineHeight: 1.4 }}>
                {currentQ.text}
              </h2>

              {/* Instructor answer key */}
              {(currentQ.modelAnswer ||
                currentQ.correctIndex !== undefined ||
                currentQ.tfAnswer ||
                (currentQ.type === "Multiple Choice" && currentQ.options && currentQ.correctIndex !== undefined)
              ) && (
                <div style={{
                  marginBottom: 20, padding: "10px 14px", borderRadius: 10,
                  background: "oklch(0.97 0.04 160)", border: "1.5px solid oklch(0.82 0.1 160)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.42 0.15 160)", whiteSpace: "nowrap" }}>Answer</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.3 0.12 160)", lineHeight: 1.5 }}>
                    {currentQ.type === "Multiple Choice" && currentQ.options && currentQ.correctIndex !== undefined
                      ? currentQ.options[currentQ.correctIndex]
                      : currentQ.type === "True / False" && currentQ.tfAnswer
                      ? currentQ.tfAnswer
                      : currentQ.modelAnswer}
                  </span>
                </div>
              )}

              {/* Response chart / word cloud toggle for Text */}
              {currentQ.type === "Text" && currentStats && currentStats.total > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  <button
                    onClick={() => setShowWordCloud(false)}
                    style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${!showWordCloud ? INDIGO : BORDER}`,
                      background: !showWordCloud ? INDIGO_LIGHT : "var(--card)",
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
                      background: showWordCloud ? INDIGO_LIGHT : "var(--card)",
                      color: showWordCloud ? INDIGO : TEXT_MUTED,
                      cursor: "pointer",
                    }}
                  >
                    <Cloud size={12} style={{ display: "inline", marginRight: 4 }} />
                    Word Cloud
                  </button>
                </div>
              )}

              {currentStats ? (
                showWordCloud && currentQ.type === "Text" ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                    <WordCloud
                      responses={(currentStats.responses ?? []).map((r: { answer: string }) => r.answer)}
                      width={480}
                      height={240}
                    />
                  </div>
                ) : (
                  <ResponseChart
                    type={currentQ.type}
                    tally={currentStats.tally}
                    total={currentStats.total}
                    options={currentQ.options}
                    correctIndex={currentQ.correctIndex}
                    tfAnswer={currentQ.tfAnswer}
                    likertLabels={currentQ.likertLabels}
                    numericMin={currentQ.numericMin}
                    numericMax={currentQ.numericMax}
                    numericLowLabel={currentQ.numericLowLabel}
                    numericHighLabel={currentQ.numericHighLabel}
                  />
                )
              ) : (
                <p style={{ fontSize: 13, color: TEXT_MUTED }}>Waiting for responses…</p>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button
                variant="outline"
                onClick={() => prevMut.mutate({ id: sessionId })}
                disabled={currentIdx === 0 || prevMut.isPending}
              >
                <ChevronLeft size={16} /> Previous
              </Button>

              <div style={{ display: "flex", gap: 6 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: i === currentIdx ? INDIGO : i < currentIdx ? GREEN : "var(--border)",
                    transition: "background 0.2s",
                  }} />
                ))}
              </div>

              {currentIdx < questions.length - 1 ? (
                <Button
                  onClick={() => nextMut.mutate({ id: sessionId })}
                  disabled={nextMut.isPending}
                  style={{ background: INDIGO, color: "#fff", fontWeight: 600 }}
                >
                  Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={closing}
                  style={{ background: CRIMSON, color: "#fff", fontWeight: 600 }}
                >
                  End Session <X size={16} />
                </Button>
              )}
            </div>

            {/* All questions overview */}
            <div style={{ background: "var(--card)", borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px 24px" }}>
              <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 13, color: TEXT_DARK, display: "flex", alignItems: "center", gap: 6 }}>
                <BarChart2 size={15} /> All Questions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {questions.map((q, i) => {
                  const stats = responseCounts.data?.find((r) => r.questionId === q.id);
                  return (
                    <div key={q.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "8px 12px", borderRadius: 10,
                      background: i === currentIdx ? INDIGO_LIGHT : "var(--card)",
                      border: `1px solid ${i === currentIdx ? INDIGO : BORDER}`,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: i === currentIdx ? INDIGO : TEXT_MUTED, width: 20 }}>
                        Q{i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: TEXT_DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.text}
                      </span>
                      <span style={{ fontSize: 12, color: TEXT_MUTED, whiteSpace: "nowrap" }}>
                        {stats?.total ?? 0} resp.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Closed state */}
        {session.status === "closed" && (
          <div style={{
            background: "var(--card)", borderRadius: 16, border: `1px solid ${BORDER}`,
            padding: "32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 22, color: TEXT_DARK }}>Session Ended</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: TEXT_MUTED }}>
              This session has been closed. View the full results below.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Button variant="outline" onClick={() => navigate("/sessions")}>Back to Sessions</Button>
              <Button
                onClick={handleDownloadCsv}
                disabled={csvExport.isFetching}
                style={{ background: INDIGO, color: "#fff", fontWeight: 600 }}
              >
                {csvExport.isFetching ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download CSV
              </Button>
            </div>
          </div>
        )}
        </div>
      </main>

      {showQR && <QRModal code={session.code} onClose={() => setShowQR(false)} />}



      {/* End Session confirmation dialog */}
      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately close the session for all students currently connected.
              Responses are saved and you can review them in Past Sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              style={{ background: CRIMSON, color: "#fff" }}
            >
              {closing ? "Ending…" : "End Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document PiP portal — renders student preview into the native PiP window */}
      {isPoppedOut && pipWindow && currentQ && createPortal(
        <div style={{
          background: "oklch(0.14 0.02 264)",
          minHeight: "100vh",
          fontFamily: "'Geist', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* PiP header */}
          <div style={{
            padding: "8px 12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={12} style={{ color: "rgba(255,255,255,0.5)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>STUDENT VIEW</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "oklch(0.57 0.22 27)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "oklch(0.57 0.22 27)" }}>LIVE</span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Q{currentIdx + 1}/{questions.length}</span>
            </div>
          </div>
          <MiniStudentView question={currentQ} questionIndex={currentIdx} questionCount={questions.length} />
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          `}</style>
        </div>,
        pipWindow.document.body
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
