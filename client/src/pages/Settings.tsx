/**
 * Settings page — professor-facing configuration for all six domains.
 * Two-column layout on desktop (left nav + right panel), tab bar on mobile.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Layers,
  GraduationCap,
  Radio,
  Download,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingsSection =
  | "account"
  | "session-defaults"
  | "student-experience"
  | "live-mode"
  | "export"
  | "system";

interface SettingsData {
  // Professor / Account
  displayName: string | null;
  institutionName: string | null;
  sessionNameTemplate: string | null;
  emailNotifications: boolean;
  themePref: "light" | "dark" | "system";
  // Session Defaults
  allowLateJoins: boolean;
  showResponseCountToStudents: boolean;
  autoAdvance: boolean;
  autoAdvanceTimer: number;
  anonymousResponses: boolean;
  maxResponsesPerStudent: number;
  defaultQuestionType: string;
  // Student Experience
  waitingRoomMessage: string | null;
  sessionEndedMessage: string | null;
  requireStudentName: boolean;
  showQuestionNumber: boolean;
  revealTotalQuestionCount: boolean;
  allowResponseEditing: boolean;
  brandingLogoUrl: string | null;
  primaryAccentColor: string | null;
  // Live Mode
  pollingInterval: number;
  showWordCloudByDefault: boolean;
  showCorrectAnswerOverlay: boolean;
  confettiOnLaunch: boolean;
  // Export & Data
  csvDateFormat: "iso" | "us" | "eu";
  csvIncludeStudentId: boolean;
  autoDeleteAfterDays: number | null;
  exportFormat: "csv" | "excel";
}

const DEFAULT_SETTINGS: SettingsData = {
  displayName: null,
  institutionName: null,
  sessionNameTemplate: null,
  emailNotifications: false,
  themePref: "light",
  allowLateJoins: true,
  showResponseCountToStudents: false,
  autoAdvance: false,
  autoAdvanceTimer: 30,
  anonymousResponses: true,
  maxResponsesPerStudent: 1,
  defaultQuestionType: "Short Text",
  waitingRoomMessage: null,
  sessionEndedMessage: null,
  requireStudentName: false,
  showQuestionNumber: true,
  revealTotalQuestionCount: true,
  allowResponseEditing: false,
  brandingLogoUrl: null,
  primaryAccentColor: null,
  pollingInterval: 2,
  showWordCloudByDefault: false,
  showCorrectAnswerOverlay: false,
  confettiOnLaunch: true,
  csvDateFormat: "iso",
  csvIncludeStudentId: true,
  autoDeleteAfterDays: null,
  exportFormat: "csv",
};

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account", icon: <User size={15} /> },
  { id: "session-defaults", label: "Session Defaults", icon: <Layers size={15} /> },
  { id: "student-experience", label: "Student Experience", icon: <GraduationCap size={15} /> },
  { id: "live-mode", label: "Live Mode", icon: <Radio size={15} /> },
  { id: "export", label: "Export & Data", icon: <Download size={15} /> },
  { id: "system", label: "System", icon: <Shield size={15} /> },
];

// ── Shared form primitives ────────────────────────────────────────────────────

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 24,
        padding: "16px 0",
        borderBottom: "1px solid oklch(0.94 0 0)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Geist', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: "oklch(0.205 0 0)",
            marginBottom: description ? 3 : 0,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12,
              color: "oklch(0.556 0 0)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        background: checked ? "oklch(0.45 0.22 264)" : "oklch(0.85 0 0)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: 240,
        padding: "7px 10px",
        borderRadius: 8,
        border: "1.5px solid oklch(0.88 0 0)",
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 13,
        color: "oklch(0.205 0 0)",
        background: "#fff",
        outline: "none",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "oklch(0.45 0.22 264)")}
      onBlur={(e) => (e.target.style.borderColor = "oklch(0.88 0 0)")}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 10px",
        borderRadius: 8,
        border: "1.5px solid oklch(0.88 0 0)",
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 13,
        color: "oklch(0.205 0 0)",
        background: "#fff",
        cursor: "pointer",
        outline: "none",
        minWidth: 140,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!isNaN(n)) onChange(n);
      }}
      style={{
        width: 80,
        padding: "7px 10px",
        borderRadius: 8,
        border: "1.5px solid oklch(0.88 0 0)",
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 13,
        color: "oklch(0.205 0 0)",
        background: "#fff",
        outline: "none",
        textAlign: "center",
      }}
      onFocus={(e) => (e.target.style.borderColor = "oklch(0.45 0.22 264)")}
      onBlur={(e) => (e.target.style.borderColor = "oklch(0.88 0 0)")}
    />
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: 300,
        padding: "8px 10px",
        borderRadius: 8,
        border: "1.5px solid oklch(0.88 0 0)",
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 13,
        color: "oklch(0.205 0 0)",
        background: "#fff",
        outline: "none",
        resize: "vertical",
        lineHeight: 1.5,
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "oklch(0.45 0.22 264)")}
      onBlur={(e) => (e.target.style.borderColor = "oklch(0.88 0 0)")}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Geist', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 18,
        color: "oklch(0.145 0 0)",
        margin: "0 0 4px",
      }}
    >
      {children}
    </h2>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 13,
        color: "oklch(0.556 0 0)",
        margin: "0 0 20px",
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

// ── Section panels ────────────────────────────────────────────────────────────

function AccountSection({
  s,
  set,
}: {
  s: SettingsData;
  set: (k: keyof SettingsData, v: unknown) => void;
}) {
  return (
    <div>
      <SectionTitle>Account</SectionTitle>
      <SectionDesc>
        Your profile information and preferences shown to students and used across all sessions.
      </SectionDesc>
      <FieldRow label="Display Name" description="Shown to students in the session header.">
        <TextInput
          value={s.displayName ?? ""}
          onChange={(v) => set("displayName", v || null)}
          placeholder="e.g. Prof. Smith"
        />
      </FieldRow>
      <FieldRow
        label="Institution / Course Name"
        description="Appears as a subtitle on the student join screen."
      >
        <TextInput
          value={s.institutionName ?? ""}
          onChange={(v) => set("institutionName", v || null)}
          placeholder="e.g. CS 101 — Harvard"
        />
      </FieldRow>
      <FieldRow
        label="Default Session Name Template"
        description={`Pre-fills the session name when creating a new session. Use {date} or {course} tokens.`}
      >
        <TextInput
          value={s.sessionNameTemplate ?? ""}
          onChange={(v) => set("sessionNameTemplate", v || null)}
          placeholder="e.g. {course} — {date}"
        />
      </FieldRow>
      <FieldRow
        label="Email Notifications"
        description="Send a summary email when a session closes (requires auth)."
      >
        <Toggle
          checked={s.emailNotifications}
          onChange={(v) => set("emailNotifications", v)}
        />
      </FieldRow>
      <FieldRow label="Theme" description="Controls the professor-facing UI theme.">
        <SelectInput
          value={s.themePref}
          onChange={(v) => set("themePref", v)}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
        />
      </FieldRow>
    </div>
  );
}

function SessionDefaultsSection({
  s,
  set,
}: {
  s: SettingsData;
  set: (k: keyof SettingsData, v: unknown) => void;
}) {
  return (
    <div>
      <SectionTitle>Session Defaults</SectionTitle>
      <SectionDesc>
        Default behaviour applied to every new session you create. These can be overridden
        per-session in the builder.
      </SectionDesc>
      <FieldRow
        label="Allow Late Joins"
        description="Students can join after the first question has launched."
      >
        <Toggle checked={s.allowLateJoins} onChange={(v) => set("allowLateJoins", v)} />
      </FieldRow>
      <FieldRow
        label="Show Response Count to Students"
        description="Displays a live response counter on the student's screen after submission."
      >
        <Toggle
          checked={s.showResponseCountToStudents}
          onChange={(v) => set("showResponseCountToStudents", v)}
        />
      </FieldRow>
      <FieldRow
        label="Auto-Advance Questions"
        description="Automatically move to the next question after the timer expires."
      >
        <Toggle checked={s.autoAdvance} onChange={(v) => set("autoAdvance", v)} />
      </FieldRow>
      {s.autoAdvance && (
        <FieldRow
          label="Auto-Advance Timer (seconds)"
          description="Duration before advancing. Range: 10–300 s."
        >
          <NumberInput
            value={s.autoAdvanceTimer}
            onChange={(v) => set("autoAdvanceTimer", v)}
            min={10}
            max={300}
          />
        </FieldRow>
      )}
      <FieldRow
        label="Anonymous Responses"
        description="When on, responses are stored without a student identifier."
      >
        <Toggle
          checked={s.anonymousResponses}
          onChange={(v) => set("anonymousResponses", v)}
        />
      </FieldRow>
      <FieldRow
        label="Max Responses Per Student"
        description="How many times a student can answer the same question."
      >
        <NumberInput
          value={s.maxResponsesPerStudent}
          onChange={(v) => set("maxResponsesPerStudent", v)}
          min={1}
          max={10}
        />
      </FieldRow>
      <FieldRow
        label="Default Question Type"
        description="Pre-selected type when the Add Question picker opens."
      >
        <SelectInput
          value={s.defaultQuestionType}
          onChange={(v) => set("defaultQuestionType", v)}
          options={[
            { value: "Short Text", label: "Short Text" },
            { value: "Multiple Choice", label: "Multiple Choice" },
            { value: "True / False", label: "True / False" },
            { value: "Star Rating", label: "Star Rating" },
            { value: "File Upload", label: "File Upload" },
          ]}
        />
      </FieldRow>
    </div>
  );
}

function StudentExperienceSection({
  s,
  set,
}: {
  s: SettingsData;
  set: (k: keyof SettingsData, v: unknown) => void;
}) {
  return (
    <div>
      <SectionTitle>Student Experience</SectionTitle>
      <SectionDesc>
        Customise what students see before, during, and after a session.
      </SectionDesc>
      <FieldRow
        label="Waiting Room Message"
        description="Shown to students before the session goes live."
      >
        <TextareaInput
          value={s.waitingRoomMessage ?? ""}
          onChange={(v) => set("waitingRoomMessage", v || null)}
          placeholder="Your professor will start the session soon."
        />
      </FieldRow>
      <FieldRow
        label="Session Ended Message"
        description="Shown when the professor closes the session."
      >
        <TextareaInput
          value={s.sessionEndedMessage ?? ""}
          onChange={(v) => set("sessionEndedMessage", v || null)}
          placeholder="Thanks for participating!"
        />
      </FieldRow>
      <FieldRow
        label="Require Student Name"
        description="Students must enter a display name before joining."
      >
        <Toggle
          checked={s.requireStudentName}
          onChange={(v) => set("requireStudentName", v)}
        />
      </FieldRow>
      <FieldRow
        label="Show Question Number"
        description={`Displays "Question 2 of 5" on the student's screen.`}
      >
        <Toggle
          checked={s.showQuestionNumber}
          onChange={(v) => set("showQuestionNumber", v)}
        />
      </FieldRow>
      {s.showQuestionNumber && (
        <FieldRow
          label="Reveal Total Question Count"
          description={`When off, students see "Question 2" without knowing how many remain.`}
        >
          <Toggle
            checked={s.revealTotalQuestionCount}
            onChange={(v) => set("revealTotalQuestionCount", v)}
          />
        </FieldRow>
      )}
      <FieldRow
        label="Allow Response Editing"
        description="Students can change their answer before the next question is shown."
      >
        <Toggle
          checked={s.allowResponseEditing}
          onChange={(v) => set("allowResponseEditing", v)}
        />
      </FieldRow>
      <FieldRow
        label="Branding Logo URL"
        description="Image URL shown in the student join screen header."
      >
        <TextInput
          value={s.brandingLogoUrl ?? ""}
          onChange={(v) => set("brandingLogoUrl", v || null)}
          placeholder="https://example.com/logo.png"
          type="url"
        />
      </FieldRow>
      <FieldRow
        label="Primary Accent Color"
        description="Highlight color for buttons on student-facing pages (CSS color value)."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="color"
            value={s.primaryAccentColor ?? "#5b6cf6"}
            onChange={(e) => set("primaryAccentColor", e.target.value)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1.5px solid oklch(0.88 0 0)",
              cursor: "pointer",
              padding: 2,
            }}
          />
          <TextInput
            value={s.primaryAccentColor ?? ""}
            onChange={(v) => set("primaryAccentColor", v || null)}
            placeholder="#5b6cf6"
          />
        </div>
      </FieldRow>
    </div>
  );
}

function LiveModeSection({
  s,
  set,
}: {
  s: SettingsData;
  set: (k: keyof SettingsData, v: unknown) => void;
}) {
  return (
    <div>
      <SectionTitle>Live Mode</SectionTitle>
      <SectionDesc>
        Controls the professor's Live Mode view during an active session.
      </SectionDesc>
      <FieldRow
        label="Response Polling Interval"
        description="How frequently Live Mode polls for new responses. Lower values increase server load."
      >
        <SelectInput
          value={String(s.pollingInterval)}
          onChange={(v) => set("pollingInterval", parseInt(v, 10))}
          options={[
            { value: "1", label: "1 second" },
            { value: "2", label: "2 seconds (default)" },
            { value: "5", label: "5 seconds" },
          ]}
        />
      </FieldRow>
      <FieldRow
        label="Show Word Cloud by Default"
        description="Short Text panels open in Word Cloud view instead of List view."
      >
        <Toggle
          checked={s.showWordCloudByDefault}
          onChange={(v) => set("showWordCloudByDefault", v)}
        />
      </FieldRow>
      <FieldRow
        label="Show Correct Answer Overlay"
        description="Highlights the correct option in MC/TF charts when a model answer is set."
      >
        <Toggle
          checked={s.showCorrectAnswerOverlay}
          onChange={(v) => set("showCorrectAnswerOverlay", v)}
        />
      </FieldRow>
      <FieldRow
        label="Confetti on Launch"
        description="Plays a brief confetti animation when you click Launch Session."
      >
        <Toggle
          checked={s.confettiOnLaunch}
          onChange={(v) => set("confettiOnLaunch", v)}
        />
      </FieldRow>
    </div>
  );
}

function ExportSection({
  s,
  set,
}: {
  s: SettingsData;
  set: (k: keyof SettingsData, v: unknown) => void;
}) {
  return (
    <div>
      <SectionTitle>Export & Data</SectionTitle>
      <SectionDesc>
        Configure how responses are exported and how long data is retained.
      </SectionDesc>
      <FieldRow
        label="CSV Date Format"
        description="Controls the timestamp format in exported CSV files."
      >
        <SelectInput
          value={s.csvDateFormat}
          onChange={(v) => set("csvDateFormat", v)}
          options={[
            { value: "iso", label: "ISO 8601 (2026-03-21T14:00:00Z)" },
            { value: "us", label: "US (03/21/2026 2:00 PM)" },
            { value: "eu", label: "EU (21/03/2026 14:00)" },
          ]}
        />
      </FieldRow>
      <FieldRow
        label="Include Student ID in CSV"
        description="Adds the anonymous student device ID as a column in exports."
      >
        <Toggle
          checked={s.csvIncludeStudentId}
          onChange={(v) => set("csvIncludeStudentId", v)}
        />
      </FieldRow>
      <FieldRow
        label="Auto-Delete Closed Sessions After"
        description="Automatically purges closed sessions and responses after this period."
      >
        <SelectInput
          value={s.autoDeleteAfterDays === null ? "never" : String(s.autoDeleteAfterDays)}
          onChange={(v) => set("autoDeleteAfterDays", v === "never" ? null : parseInt(v, 10))}
          options={[
            { value: "never", label: "Never" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
            { value: "365", label: "1 year" },
          ]}
        />
      </FieldRow>
      <FieldRow
        label="Default Export Format"
        description="Format used by the Download button in Live Mode and Past Sessions."
      >
        <SelectInput
          value={s.exportFormat}
          onChange={(v) => set("exportFormat", v)}
          options={[
            { value: "csv", label: "CSV" },
            { value: "excel", label: "Excel (.xlsx)" },
          ]}
        />
      </FieldRow>
    </div>
  );
}

function SystemSection({
  s,
  set,
}: {
  s: SettingsData;
  set: (k: keyof SettingsData, v: unknown) => void;
}) {
  return (
    <div>
      <SectionTitle>System</SectionTitle>
      <SectionDesc>
        Platform-wide configuration. Authentication is currently disabled for testing — all
        professor pages are publicly accessible.
      </SectionDesc>

      {/* Info banner */}
      <div
        style={{
          background: "oklch(0.97 0.06 80)",
          border: "1.5px solid oklch(0.88 0.08 80)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: "oklch(0.45 0.14 70)",
          fontFamily: "'Geist', system-ui, sans-serif",
          lineHeight: 1.5,
        }}
      >
        <strong>Demo Mode is active.</strong> Authentication infrastructure is in place but
        disabled. To enable login-required access, update the tRPC procedures from{" "}
        <code>publicProcedure</code> to <code>protectedProcedure</code> and re-deploy.
      </div>

      <FieldRow
        label="Demo Mode Banner"
        description="Shows a yellow banner at the top of professor pages when auth is disabled."
      >
        <Toggle checked={false} onChange={() => toast.info("Coming soon — requires auth to be enabled.")} />
      </FieldRow>
      <FieldRow
        label="Analytics"
        description="Enables privacy-preserving page-view and session-launch analytics."
      >
        <Toggle checked={true} onChange={() => toast.info("Analytics settings are managed in the Manus dashboard.")} />
      </FieldRow>

      <div
        style={{
          marginTop: 24,
          padding: "16px",
          background: "oklch(0.97 0 0)",
          borderRadius: 10,
          border: "1.5px solid oklch(0.91 0 0)",
        }}
      >
        <div
          style={{
            fontFamily: "'Geist', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: "oklch(0.4 0 0)",
            marginBottom: 8,
          }}
        >
          Hard Limits (read-only)
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Geist', system-ui, sans-serif" }}>
          <tbody>
            {[
              ["Max questions per session", "50"],
              ["Max responses per session", "500"],
              ["Max sessions per user", "Unlimited"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ padding: "6px 0", color: "oklch(0.45 0 0)", borderBottom: "1px solid oklch(0.93 0 0)" }}>{label}</td>
                <td style={{ padding: "6px 0", color: "oklch(0.205 0 0)", fontWeight: 600, textAlign: "right", borderBottom: "1px solid oklch(0.93 0 0)" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Settings() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [localSettings, setLocalSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { data: remoteSettings, isLoading } = trpc.settings.get.useQuery();
  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: (data) => {
      if (data) {
        const normalized = normalizeSettings(data);
        setLocalSettings(normalized);
        setSavedSettings(normalized);
      }
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error("Failed to save settings: " + err.message);
    },
  });

  // Normalize DB row → SettingsData (handle null/undefined)
  function normalizeSettings(raw: Record<string, unknown>): SettingsData {
    return {
      displayName: (raw.displayName as string | null) ?? null,
      institutionName: (raw.institutionName as string | null) ?? null,
      sessionNameTemplate: (raw.sessionNameTemplate as string | null) ?? null,
      emailNotifications: Boolean(raw.emailNotifications ?? false),
      themePref: (raw.themePref as "light" | "dark" | "system") ?? "light",
      allowLateJoins: Boolean(raw.allowLateJoins ?? true),
      showResponseCountToStudents: Boolean(raw.showResponseCountToStudents ?? false),
      autoAdvance: Boolean(raw.autoAdvance ?? false),
      autoAdvanceTimer: Number(raw.autoAdvanceTimer ?? 30),
      anonymousResponses: Boolean(raw.anonymousResponses ?? true),
      maxResponsesPerStudent: Number(raw.maxResponsesPerStudent ?? 1),
      defaultQuestionType: (raw.defaultQuestionType as string) ?? "Short Text",
      waitingRoomMessage: (raw.waitingRoomMessage as string | null) ?? null,
      sessionEndedMessage: (raw.sessionEndedMessage as string | null) ?? null,
      requireStudentName: Boolean(raw.requireStudentName ?? false),
      showQuestionNumber: Boolean(raw.showQuestionNumber ?? true),
      revealTotalQuestionCount: Boolean(raw.revealTotalQuestionCount ?? true),
      allowResponseEditing: Boolean(raw.allowResponseEditing ?? false),
      brandingLogoUrl: (raw.brandingLogoUrl as string | null) ?? null,
      primaryAccentColor: (raw.primaryAccentColor as string | null) ?? null,
      pollingInterval: Number(raw.pollingInterval ?? 2),
      showWordCloudByDefault: Boolean(raw.showWordCloudByDefault ?? false),
      showCorrectAnswerOverlay: Boolean(raw.showCorrectAnswerOverlay ?? false),
      confettiOnLaunch: Boolean(raw.confettiOnLaunch ?? true),
      csvDateFormat: (raw.csvDateFormat as "iso" | "us" | "eu") ?? "iso",
      csvIncludeStudentId: Boolean(raw.csvIncludeStudentId ?? true),
      autoDeleteAfterDays: raw.autoDeleteAfterDays != null ? Number(raw.autoDeleteAfterDays) : null,
      exportFormat: (raw.exportFormat as "csv" | "excel") ?? "csv",
    };
  }

  useEffect(() => {
    if (remoteSettings) {
      const normalized = normalizeSettings(remoteSettings as Record<string, unknown>);
      setLocalSettings(normalized);
      setSavedSettings(normalized);
    }
  }, [remoteSettings]);

  function set(key: keyof SettingsData, value: unknown) {
    setLocalSettings((prev) => {
      const next = { ...prev, [key]: value };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(savedSettings));
      return next;
    });
  }

  function handleSave() {
    saveMutation.mutate({
      ...localSettings,
      defaultQuestionType: localSettings.defaultQuestionType as
        | "Short Text"
        | "Multiple Choice"
        | "File Upload"
        | "Star Rating"
        | "True / False",
    });
  }

  function handleDiscard() {
    setLocalSettings(savedSettings);
    setIsDirty(false);
  }

  const sectionProps = { s: localSettings, set };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.985 0 0)",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid oklch(0.922 0 0)",
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <button
          onClick={() => navigate("/sessions")}
          title="Back to My Sessions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "none",
            border: "1.5px solid oklch(0.922 0 0)",
            color: "oklch(0.45 0 0)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: "oklch(0.145 0 0)",
            }}
          >
            Settings
          </div>
          <div style={{ fontSize: 12, color: "oklch(0.556 0 0)" }}>
            Configure your professor experience
          </div>
        </div>

        {/* Save / Discard actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {isDirty && (
            <button
              onClick={handleDiscard}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 10,
                border: "1.5px solid oklch(0.88 0 0)",
                background: "#fff",
                color: "oklch(0.45 0 0)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} />
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty && !justSaved}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 10,
              border: "none",
              background: isDirty
                ? "oklch(0.45 0.22 264)"
                : justSaved
                ? "oklch(0.45 0.18 160)"
                : "oklch(0.88 0 0)",
              color: isDirty || justSaved ? "#fff" : "oklch(0.6 0 0)",
              fontSize: 13,
              fontWeight: 600,
              cursor: isDirty ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            {justSaved ? (
              <>
                <CheckCircle2 size={13} />
                Saved
              </>
            ) : (
              <>
                <Save size={13} />
                {isDirty ? "Save Changes" : "Saved"}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Unsaved changes banner */}
      {isDirty && (
        <div
          style={{
            background: "oklch(0.97 0.06 80)",
            borderBottom: "1px solid oklch(0.88 0.08 80)",
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: "oklch(0.45 0.14 70)",
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          <span>You have unsaved changes.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleDiscard}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "1.5px solid oklch(0.82 0.08 80)",
                background: "transparent",
                color: "oklch(0.45 0.14 70)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "none",
                background: "oklch(0.52 0.18 70)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Left nav — desktop */}
        <nav
          style={{
            width: 200,
            flexShrink: 0,
            position: "sticky",
            top: 96,
          }}
          className="hidden-mobile"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid oklch(0.922 0 0)",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 16px",
                    border: "none",
                    borderBottom: "1px solid oklch(0.94 0 0)",
                    background: active ? "oklch(0.982 0.0107 271.3)" : "#fff",
                    color: active ? "oklch(0.45 0.22 264)" : "oklch(0.45 0 0)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    fontFamily: "'Geist', system-ui, sans-serif",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ color: active ? "oklch(0.45 0.22 264)" : "oklch(0.65 0 0)" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile tab bar */}
        <div
          style={{
            display: "none",
            width: "100%",
            overflowX: "auto",
            marginBottom: 16,
          }}
          className="show-mobile"
        >
          <div style={{ display: "flex", gap: 6, paddingBottom: 4 }}>
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: active
                      ? "1.5px solid oklch(0.88 0.04 264)"
                      : "1.5px solid oklch(0.88 0 0)",
                    background: active ? "oklch(0.982 0.0107 271.3)" : "#fff",
                    color: active ? "oklch(0.45 0.22 264)" : "oklch(0.45 0 0)",
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    fontFamily: "'Geist', system-ui, sans-serif",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "#fff",
            borderRadius: 14,
            border: "1px solid oklch(0.922 0 0)",
            padding: "28px 32px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
                color: "oklch(0.65 0 0)",
                fontSize: 14,
              }}
            >
              Loading settings…
            </div>
          ) : (
            <>
              {activeSection === "account" && <AccountSection {...sectionProps} />}
              {activeSection === "session-defaults" && (
                <SessionDefaultsSection {...sectionProps} />
              )}
              {activeSection === "student-experience" && (
                <StudentExperienceSection {...sectionProps} />
              )}
              {activeSection === "live-mode" && <LiveModeSection {...sectionProps} />}
              {activeSection === "export" && <ExportSection {...sectionProps} />}
              {activeSection === "system" && <SystemSection {...sectionProps} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
