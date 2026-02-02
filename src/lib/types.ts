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
