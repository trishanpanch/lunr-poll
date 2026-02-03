"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder as FolderIcon, MoreHorizontal, Plus, Search, FileText, Trash2, Users } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { useActivities, createActivity, deleteActivity } from "@/lib/data/activities";
import { useFolders, useTeamFolders, createFolder, deleteFolder } from "@/lib/data/folders";
import { CreateActivityDialog } from "@/components/activities/CreateActivityDialog";
import { toast } from "sonner";
import { ActivityType } from "@/lib/types";

export default function ActivitiesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // Null = Root
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false); // Quick inline or dialog? simple prompt for now
    const [newFolderName, setNewFolderName] = useState("");

    // Data Hooks
    const [activities, setActivities] = useState<any[]>([]);
    const [myFolders, setMyFolders] = useState<any[]>([]);
    const [teamFolders, setTeamFolders] = useState<any[]>([]);

    // User Profile state for teamIds
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.push("/professor");
            } else {
                setUser(u);
                // Fetch profile for teamIds
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) {
                    setUserProfile(snap.data());
                }
            }
        });
        return () => unsub();
    }, [router]);

    // Subscriptions
    useEffect(() => {
        if (!user) return;
        const unsubActivities = useActivities(user.uid, currentFolderId, setActivities);
        const unsubMyFolders = useFolders(user.uid, currentFolderId, setMyFolders);

        let unsubTeamFolders = () => { };
        // Only fetch team folders at root (currentFolderId is null)
        if (!currentFolderId && userProfile?.teamIds?.length) {
            unsubTeamFolders = useTeamFolders(userProfile.teamIds, setTeamFolders);
        } else {
            setTeamFolders([]);
        }

        // @ts-ignore
        return () => { unsubActivities(); unsubMyFolders(); unsubTeamFolders(); };
    }, [user, userProfile, currentFolderId]);

    // Merge folders
    const folders = [...myFolders, ...teamFolders];

    const handleCreateActivity = async (type: ActivityType) => {
        if (!user) return;
        try {
            const defaults = userProfile?.defaults;
            const id = await createActivity(user.uid, type, currentFolderId || undefined, defaults);
            setIsCreateOpen(false);
            toast.success("Activity created");
            router.push(`/professor/activity/${id}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to create activity");
        }
    };

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            await createFolder(user.uid, newFolderName, currentFolderId || undefined);
            setNewFolderName("");
            setIsCreateFolderOpen(false);
            toast.success("Folder created");
        } catch (e) {
            toast.error("Failed to create folder");
        }
    };

    const handleEnterFolder = (folderId: string) => {
        setCurrentFolderId(folderId);
    };

    const handleUpLevel = () => {
        // Simple 1-level up logic or root. 
        // Real implementation might need to fetch parent folder of current folder to go up correctly if nested deep.
        // For MVP SP1-2, let's just go to Root if we are in a folder.
        setCurrentFolderId(null);
    };

    if (!user) return null;

    return (
        <main className="min-h-screen bg-slate-50 py-8">
            <ResponsiveContainer size="lg" className="space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900">Activities</h1>
                        <p className="text-slate-500">
                            {currentFolderId ? (
                                <button onClick={handleUpLevel} className="hover:text-primary transition-colors flex items-center gap-1">
                                    ← Back to Library
                                </button>
                            ) : "Manage your polls and questions"}
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="ghost" onClick={() => router.push("/professor/teams")}>
                            <Users className="mr-2 w-4 h-4" /> Teams
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreateFolderOpen(!isCreateFolderOpen)}>
                            <FolderIcon className="mr-2 w-4 h-4" /> New Folder
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-rose-800">
                            <Plus className="mr-2 w-5 h-5" /> New Activity
                        </Button>
                    </div>
                </header>

                {isCreateFolderOpen && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
                        <FolderIcon className="text-slate-400 w-5 h-5" />
                        <Input
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="max-w-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                        />
                        <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search activities..." className="pl-9 h-9 bg-white" />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {/* Folders List */}
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => handleEnterFolder(folder.id)}
                                className="group flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <FolderIcon className="fill-current w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                                        {folder.name}
                                        {folder.teamId && (
                                            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                Shared
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-500">{folder.teamId ? "Team Folder" : "Folder"}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        {/* Activities List */}
                        {activities.map(activity => (
                            <div
                                key={activity.id}
                                onClick={() => router.push(`/professor/activity/${activity.id}`)}
                                className="group flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-rose-100 group-hover:text-primary transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-900">{activity.title || activity.prompt?.text || "Untitled Activity"}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider font-bold">
                                            {activity.type.replace("_", " ")}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {activity.updatedAt ? new Date(activity.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-600"
                                        onClick={(e) => { e.stopPropagation(); deleteActivity(activity.id); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-slate-400">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {folders.length === 0 && activities.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <p>This folder is empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            </ResponsiveContainer>

            <CreateActivityDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={handleCreateActivity}
            />
        </main>
    );
}
