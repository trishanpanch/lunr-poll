import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getSettings, upsertSettings } from "../db";

/** The demo-mode key used when no user is logged in */
const DEMO_KEY = "demo";

function resolveKey(ctx: { user?: { id: number } | null }): string {
  const userId = (ctx as { user?: { id: number } }).user?.id;
  return userId ? String(userId) : DEMO_KEY;
}

const SettingsInputSchema = z.object({
  // Professor / Account
  displayName: z.string().max(128).nullable().optional(),
  institutionName: z.string().max(255).nullable().optional(),
  sessionNameTemplate: z.string().max(255).nullable().optional(),
  emailNotifications: z.boolean().optional(),
  themePref: z.enum(["light", "dark", "system"]).optional(),

  // Session Defaults
  allowLateJoins: z.boolean().optional(),
  showResponseCountToStudents: z.boolean().optional(),
  autoAdvance: z.boolean().optional(),
  autoAdvanceTimer: z.number().int().min(10).max(300).optional(),
  anonymousResponses: z.boolean().optional(),
  maxResponsesPerStudent: z.number().int().min(1).max(10).optional(),
  defaultQuestionType: z
    .enum(["Short Text", "Multiple Choice", "File Upload", "Star Rating", "True / False"])
    .optional(),

  // Student Experience
  waitingRoomMessage: z.string().max(2000).nullable().optional(),
  sessionEndedMessage: z.string().max(2000).nullable().optional(),
  requireStudentName: z.boolean().optional(),
  showQuestionNumber: z.boolean().optional(),
  revealTotalQuestionCount: z.boolean().optional(),
  allowResponseEditing: z.boolean().optional(),
  brandingLogoUrl: z.string().url().max(2048).nullable().optional(),
  primaryAccentColor: z.string().max(64).nullable().optional(),

  // Live Mode
  pollingInterval: z.number().int().refine((v) => [1, 2, 5].includes(v)).optional(),
  showWordCloudByDefault: z.boolean().optional(),
  showCorrectAnswerOverlay: z.boolean().optional(),
  confettiOnLaunch: z.boolean().optional(),

  // Export & Data
  csvDateFormat: z.enum(["iso", "us", "eu"]).optional(),
  csvIncludeStudentId: z.boolean().optional(),
  autoDeleteAfterDays: z.number().int().nullable().optional(),
  exportFormat: z.enum(["csv", "excel"]).optional(),
});

export const settingsRouter = router({
  /** Fetch settings for the current user (or demo key) */
  get: publicProcedure.query(async ({ ctx }) => {
    const key = resolveKey(ctx as { user?: { id: number } | null });
    const settings = await getSettings(key);
    // Return defaults if no row exists yet
    return settings ?? {
      settingsKey: key,
      displayName: null,
      institutionName: null,
      sessionNameTemplate: null,
      emailNotifications: false,
      themePref: "light" as const,
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
      csvDateFormat: "iso" as const,
      csvIncludeStudentId: true,
      autoDeleteAfterDays: null,
      exportFormat: "csv" as const,
    };
  }),

  /** Save (upsert) settings for the current user */
  save: publicProcedure
    .input(SettingsInputSchema)
    .mutation(async ({ input, ctx }) => {
      const key = resolveKey(ctx as { user?: { id: number } | null });
      const saved = await upsertSettings(key, input);
      return saved;
    }),
});
