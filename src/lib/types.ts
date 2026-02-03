import { Timestamp } from "firebase/firestore";

export type QuestionType = "short_text" | "multiple_choice" | "file_upload" | "rating";

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    options?: string[]; // For multiple choice
    isActive?: boolean;
}

export type SessionStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";

export interface Session {
    id?: string; // Document ID
    code: string;
    title?: string;
    ownerId: string;
    status: SessionStatus;
    createdAt: Timestamp;
    activeQuestionId?: string | null;
    activeQuestionIds?: string[];
    questions: Question[];
    analysis?: Record<string, AnalysisResult>;
    globalAnalysis?: GlobalAnalysis;
}

export interface TeacherProfile {
    uid: string;
    email: string;
    name: string;
    createdAt: Timestamp;
}

export interface StudentResponse {
    id?: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    answers: Record<string, string>; // questionId -> answer (or url)
    submittedAt: Timestamp;
}

export interface AnalysisResult {
    consensus: string;
    confusion_points: string[];
    outlier_insight: string;
    recommended_action: string;
    distribution_analysis: string;
    key_inferences: string[];
}

export interface GlobalAnalysis {
    executive_summary: string;
    common_misconceptions: string[];
    engagement_analysis: string;
    teaching_recommendations: string[];
}

// --- V2 DATA MODEL (Activity-Centric) ---

export type ActivityType =
    | "multiple_choice"
    | "open_ended"
    | "word_cloud"
    | "qa"
    | "clickable_image"
    | "survey"
    | "competition"
    | "ranking";

export interface RichContent {
    text: string;           // Plain text or Markdown/HTML
    imageUrl?: string;      // Optional image
    latex?: string;         // Math notation
}

export interface ActivityOption {
    id: string;
    content: RichContent;   // Supports rich text/images in options
    isCorrect?: boolean;
    val?: number;           // For Likert/Ranking scoring
}

export interface ActivitySettings {
    isAnonymous?: boolean;
    identityMode?: "anonymous" | "screen_name" | "registered";
    responseLimit?: number; // 0 or 1 usually
    optionSelectionLimit?: number; // Check-all-that-apply limit
    allowChangeAnswer?: boolean;
    timerSeconds?: number;
    showCorrectAnswer?: boolean; // When to show? (Immediate vs Manual reveal)
    moderationEnabled?: boolean; // For free-text
    profanityFilter?: boolean;
}

export interface Activity {
    id: string;
    ownerId: string;
    folderId?: string;      // Organization
    title: string;          // Internal name / Heading

    type: ActivityType;
    status: "DRAFT" | "ACTIVE" | "LOCKED" | "ARCHIVED" | "TRASH";

    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Core Content
    prompt: RichContent;
    options?: ActivityOption[];
    questions?: Activity[]; // For Surveys, we can embed "Sub-Activities" or simplified questions
    content?: any; // Flexible payload for specific types (e.g. { imageUrl } for heatmap)

    // Configuration
    settings: ActivitySettings;
}

export interface Folder {
    id: string;
    ownerId: string;
    parentFolderId?: string;
    name: string;
    createdAt: Timestamp;
    order: number; // sortIndex

    // SP7: Shared Folders
    teamId?: string;
}

export interface Run {
    id: string;
    activityId: string;
    name: string;   // e.g. "Lecture 1 (2024-02-03)"
    startedAt: Timestamp;
    endedAt?: Timestamp;
    status: "ACTIVE" | "LOCKED" | "COMPLETED";
    responseCount: number;
}

export interface UserProfile extends TeacherProfile {
    // Extending V1 TeacherProfile for backward compat
    handle?: string;     // Unique username for /u/handle
    role: "professor" | "admin" | "student";
    teamIds?: string[];
    organizationId?: string;

    // SP7: Branding & Defaults
    branding?: {
        primaryColor: string;
        logoUrl?: string;
    };
    defaults?: {
        timerSeconds?: number;
        profanityFilter?: boolean;
    };
}

export interface Team {
    id: string;
    name: string;
    ownerId: string;
    memberIds: string[];
    createdAt: Timestamp;
}

export interface Response {
    id: string;
    activityId: string;
    runId?: string;       // Optional for now, linking to a specific "presentation session"
    participantId: string;
    content: any;         // Flexible payload: { optionId: "123" } or { text: "answer" }
    submittedAt: Timestamp;

    // Q&A & Moderation
    status?: "APPROVED" | "PENDING" | "REJECTED" | "FEATURED";
    upvotes?: number;
    upvoterIds?: string[];
}
