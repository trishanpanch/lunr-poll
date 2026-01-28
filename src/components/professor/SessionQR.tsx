"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface SessionQRProps {
    sessionCode: string;
    sessionId?: string; // Optional for backward compatibility, but we will pass it
}

export function SessionQR({ sessionCode, sessionId }: SessionQRProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    // Use window.location.origin to adapt to localhost or prod URL automatically
    // Fallback to localhost if window is undefined (SSR safety, though this is 'use client')
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    // Construct robust URL
    let joinUrl = `${origin}/student?code=${sessionCode}`;
    if (sessionId) {
        joinUrl += `&id=${sessionId}`;
    }

    const downloadQR = async () => {
        if (!qrRef.current) return;
        try {
            const dataUrl = await toPng(qrRef.current, { cacheBust: true, backgroundColor: 'white' });
            const link = document.createElement("a");
            link.download = `harvard-poll-qr-${sessionCode}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("QR Code downloaded!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download QR code");
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6">
            <div
                ref={qrRef}
                className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center space-y-4 w-full max-w-[300px]"
            >
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Join Session</h3>
                <QRCodeSVG value={joinUrl} size={200} level="H" />
                <div className="text-center">
                    <p className="text-xs text-slate-400">Or enter code:</p>
                    <p className="text-3xl font-mono font-bold text-slate-900 tracking-widest">{sessionCode}</p>
                </div>
                <div className="text-[10px] text-slate-300 font-sans">
                    Harvard Poll Platform
                </div>
            </div>

            <Button onClick={downloadQR} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Download for Slides
            </Button>
        </div>
    );
}
