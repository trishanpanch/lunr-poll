"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

function StudentContent() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const joinCode = searchParams.get("code");
        if (joinCode) {
            setLoading(true);
            setCode(joinCode);
            router.push(`/session/${joinCode.toUpperCase()}`);
        }
    }, [searchParams, router]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            router.push(`/session/${code.trim().toUpperCase()}`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8"
        >
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tighter">
                    Harvard<span className="text-primary">Poll</span>
                </h1>
                <p className="text-slate-500 font-sans">
                    {loading ? "Joining session..." : "Enter your session code to join."}
                </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
                <div className="relative group">
                    <Input
                        type="text"
                        placeholder="CODE"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="text-center text-3xl font-mono tracking-widest h-20 rounded-2xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary transition-all bg-white"
                        maxLength={20}
                    />
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
                    disabled={!code}
                >
                    Join Session <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </form>

            <p className="text-center text-sm text-slate-400">
                No account required for students.
            </p>
        </motion.div>
    );
}

export default function StudentLanding() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
            <Suspense fallback={<div className="text-slate-400">Loading entry...</div>}>
                <StudentContent />
            </Suspense>
        </main>
    );
}
