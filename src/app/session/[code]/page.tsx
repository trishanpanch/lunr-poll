"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Loader2, CircleCheck, CircleAlert } from "lucide-react";
import { auth, db } from "@/lib/firebase/client";
import { useSession } from "@/hooks/useSession";
import { Session } from "@/lib/types";
import { QuestionList } from "@/components/student/QuestionList";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ClosedReview({ session, answers }: { session: Session; answers: Record<string, string> }) {
    const reviewableQuestions = (session.questions || []).filter(
        (question) =>
            question.type === "multiple_choice" &&
            question.revealMode === "after_session_close" &&
            !!answers[question.id]
    );

    if (reviewableQuestions.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Answer Review</h3>
                <p className="text-sm text-slate-500">Your instructor has released feedback for this poll.</p>
            </div>

            {reviewableQuestions.map((question) => {
                const answer = answers[question.id];
                const isCorrect = question.correctAnswers?.includes(answer);

                return (
                    <div key={question.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{question.text}</p>
                        <p className="mt-2 text-sm text-slate-600">
                            Your answer: <span className="font-medium text-slate-900">{answer}</span>
                        </p>
                        {!!question.correctAnswers?.length && (
                            <div
                                className={`mt-3 flex items-start gap-3 rounded-lg border p-3 text-sm ${
                                    isCorrect
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                        : "border-amber-200 bg-amber-50 text-amber-900"
                                }`}
                            >
                                {isCorrect ? (
                                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
                                ) : (
                                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                                )}
                                <div className="space-y-2">
                                    <p className="font-semibold">{isCorrect ? "Correct" : "Review this answer"}</p>
                                    <p>
                                        Correct answer{question.correctAnswers.length === 1 ? "" : "s"}:{" "}
                                        <span className="font-medium">{question.correctAnswers.join(", ")}</span>
                                    </p>
                                    {question.explanation && <p className="leading-relaxed">{question.explanation}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function SessionPage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const code = typeof params.code === "string" ? params.code : "";
    const sessionId = searchParams.get("id");

    const [authLoading, setAuthLoading] = useState(true);
    const { session, loading, error } = useSession(code, sessionId || undefined, { enabled: !authLoading });
    const [user, setUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({});
    const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthLoading(false);
                return;
            }

            signInAnonymously(auth).catch((authFailure) => {
                console.error("Sign in failed", authFailure);
                setAuthError(authFailure.message);
                setAuthLoading(false);
            });
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        if (!session?.id || !user?.uid) return;

        const unsubscribe = onSnapshot(doc(db, "sessions", session.id, "responses", user.uid), (snap) => {
            if (!snap.exists()) {
                setSubmittedAnswers({});
                setAnsweredQuestionIds(new Set());
                return;
            }

            const data = snap.data();
            const answers = (data.answers || {}) as Record<string, string>;
            setSubmittedAnswers(answers);
            setAnsweredQuestionIds(new Set(Object.keys(answers)));
        });

        return () => unsubscribe();
    }, [session?.id, user?.uid]);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || authError || !session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg">
                    <h2 className="mb-2 text-xl font-bold text-red-600">Connection Error</h2>
                    <p className="mb-6 text-sm font-mono text-slate-600">
                        {authError ? "Authentication Failed" : "Could not load session"}
                    </p>

                    <div className="mb-4 overflow-auto rounded-lg bg-slate-100 p-4 text-left font-mono text-xs text-slate-500">
                        <p><strong>Code:</strong> {code}</p>
                        <p><strong>Status:</strong> {loading ? "Loading..." : "Failed"}</p>
                        <p><strong>Error:</strong> {authError || error || "Session not found"}</p>
                    </div>

                    <p className="text-sm text-slate-400">
                        {authError && "Check 'Authorized Domains' in Firebase Authentication Settings."}
                        {error?.includes("permission") && "Check Firestore Security Rules (allow read)."}
                        {!authError && !error?.includes("permission") && "Ask your professor if the session is valid."}
                    </p>
                </div>
            </div>
        );
    }

    if (session.status !== "OPEN") {
        return (
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <h2 className="mb-2 text-2xl font-serif text-slate-800">Session Closed</h2>
                        <p className="text-slate-500">
                            This session is currently {(session.status || "closed").toLowerCase()}.
                        </p>
                    </div>
                    <ClosedReview session={session} answers={submittedAnswers} />
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 pb-20">
            <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Session</span>
                    <h1 className="font-mono text-xl font-bold tracking-wider text-slate-900">{code}</h1>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    {session.deliveryMode === "self_paced" ? "Live • Self-Paced" : "Live"}
                </div>
            </header>

            <ErrorBoundary>
                <QuestionList
                    session={session}
                    userId={user?.uid || ""}
                    answeredQuestionIds={answeredQuestionIds}
                    submittedAnswers={submittedAnswers}
                />
            </ErrorBoundary>
        </main>
    );
}
