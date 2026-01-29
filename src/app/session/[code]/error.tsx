"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Session Page Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-red-100">
                <h2 className="text-xl font-bold text-red-600 mb-2">Session Error</h2>
                <p className="text-slate-600 mb-6 font-mono text-sm">Something went wrong loading this session.</p>

                <div className="text-left bg-slate-100 p-4 rounded-lg font-mono text-xs text-slate-500 overflow-auto mb-4 max-h-60">
                    <p><strong>Message:</strong> {error.message}</p>
                    {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                    <p><strong>Stack:</strong></p>
                    <pre>{error.stack}</pre>
                </div>

                <Button onClick={() => reset()} className="w-full">
                    Try again
                </Button>
            </div>
        </div>
    );
}
