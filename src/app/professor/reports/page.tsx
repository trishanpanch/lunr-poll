"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Session, StudentResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileDown, FileText, Archive, MoreHorizontal, ArrowLeft } from "lucide-react";
import { downloadCSV } from "@/lib/export-utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ReportsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                try {
                    // Fetch completed or all sessions
                    // We need a composite index for ownerId + createdAt. If it fails, we fall back to client sort?
                    // Let's try simple ownerId first, and sort client side if needed to avoid index blocking.
                    const q = query(
                        collection(db, "sessions"),
                        where("ownerId", "==", u.uid)
                        // orderBy("createdAt", "desc") // May require index
                    );
                    const snap = await getDocs(q);
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));

                    // Client-side sort to be safe without index
                    list.sort((a, b) => {
                        const ta = a.createdAt?.seconds || 0;
                        const tb = b.createdAt?.seconds || 0;
                        return tb - ta;
                    });

                    setSessions(list);
                } catch (e) {
                    console.error("Error fetching sessions:", e);
                    toast.error("Failed to load reports");
                }
            } else {
                router.push("/professor");
            }
            setLoading(false);
        });
        return () => unsub();
    }, [router]);

    const handleExportCSV = async (session: Session) => {
        if (!session.id) return;
        setExportingId(session.id);
        try {
            // Fetch responses
            const responsesSnap = await getDocs(collection(db, "sessions", session.id, "responses"));
            const responses = responsesSnap.docs.map(d => d.data() as StudentResponse);

            if (responses.length === 0) {
                toast.warning("No responses to export");
                setExportingId(null);
                return;
            }

            downloadCSV(`harvard-poll-${session.code}-${new Date().toISOString().split('T')[0]}`, session.questions, responses);
            toast.success("CSV Downloaded");
        } catch (e) {
            console.error(e);
            toast.error("Failed to export CSV");
        } finally {
            setExportingId(null);
        }
    };

    const handleArchive = async (session: Session) => {
        if (!session.id) return;
        try {
            await updateDoc(doc(db, "sessions", session.id), { status: "ARCHIVED" });
            setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: "ARCHIVED" } : s));
            toast.success("Session archived");
        } catch (e) {
            toast.error("Failed to archive");
        }
    };

    if (loading) return <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/professor/dashboard")} className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900">Reports & Data</h1>
                        <p className="text-slate-500">Access results from past activities and sessions.</p>
                    </div>
                </header>

                <Card className="border-slate-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>Session History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 italic">
                                No sessions found. Run a live activity to generate reports.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-mono text-xs text-slate-500">
                                                {session.createdAt?.seconds
                                                    ? new Date(session.createdAt.seconds * 1000).toLocaleDateString()
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                {session.title || "Untitled Session"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">{session.code}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={session.status === "OPEN" ? "default" : "secondary"}>
                                                    {session.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/professor/session/${session.code}?view=report`)}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        View Report
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleExportCSV(session)}>
                                                                <FileDown className="w-4 h-4 mr-2" />
                                                                Export CSV
                                                                {exportingId === session.id && <Loader2 className="ml-2 w-3 h-3 animate-spin" />}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleArchive(session)} className="text-rose-600 focus:text-rose-700">
                                                                <Archive className="w-4 h-4 mr-2" />
                                                                Archive Session
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
