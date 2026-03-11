"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
    Folder as FolderIcon,
    MoreHorizontal,
    Plus,
    Search,
    FileText,
    Trash2,
    Users,
    Copy,
    Move
} from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase/client";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateActivityDialog } from "@/components/activities/CreateActivityDialog";
import {
    useActivities as subscribeActivities,
    createActivity,
    deleteActivity,
    duplicateActivity,
    moveActivityToFolder
} from "@/lib/data/activities";
import {
    useFolders as subscribeFolders,
    useTeamFolders as subscribeTeamFolders,
    createFolder,
    deleteFolder
} from "@/lib/data/folders";
import { Activity, ActivityType, Folder, UserProfile } from "@/lib/types";

type SortOption = "updated_desc" | "updated_asc" | "title_asc";

export default function ActivitiesPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("updated_desc");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [activityToMove, setActivityToMove] = useState<Activity | null>(null);
    const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>("__root__");

    const [activities, setActivities] = useState<Activity[]>([]);
    const [myFolders, setMyFolders] = useState<Folder[]>([]);
    const [teamFolders, setTeamFolders] = useState<Folder[]>([]);
    const [rootFolders, setRootFolders] = useState<Folder[]>([]);
    const [rootTeamFolders, setRootTeamFolders] = useState<Folder[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/professor");
                return;
            }

            setUser(currentUser);
            const profileSnapshot = await getDoc(doc(db, "users", currentUser.uid));
            if (profileSnapshot.exists()) {
                setUserProfile(profileSnapshot.data() as UserProfile);
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;

        const unsubscribeActivities = subscribeActivities(user.uid, currentFolderId, setActivities);
        const unsubscribeMyFolders = subscribeFolders(user.uid, currentFolderId, setMyFolders);
        const unsubscribeRootFolders = subscribeFolders(user.uid, null, setRootFolders);

        let unsubscribeTeamFolders = () => { };
        let unsubscribeRootTeamFolders = () => { };

        if (!currentFolderId && userProfile?.teamIds?.length) {
            unsubscribeTeamFolders = subscribeTeamFolders(userProfile.teamIds, setTeamFolders);
        } else {
            setTeamFolders([]);
        }

        if (userProfile?.teamIds?.length) {
            unsubscribeRootTeamFolders = subscribeTeamFolders(userProfile.teamIds, setRootTeamFolders);
        } else {
            setRootTeamFolders([]);
        }

        return () => {
            unsubscribeActivities();
            unsubscribeMyFolders();
            unsubscribeRootFolders();
            unsubscribeTeamFolders();
            unsubscribeRootTeamFolders();
        };
    }, [user, userProfile, currentFolderId]);

    const folders = useMemo(() => [...myFolders, ...teamFolders], [myFolders, teamFolders]);
    const availableMoveFolders = useMemo(() => {
        const byId = new Map<string, Folder>();
        [...rootFolders, ...rootTeamFolders].forEach((folder) => byId.set(folder.id, folder));
        return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [rootFolders, rootTeamFolders]);

    const filteredFolders = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return folders;
        return folders.filter((folder) => folder.name.toLowerCase().includes(search));
    }, [folders, searchTerm]);

    const filteredActivities = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        const nextActivities = activities.filter((activity) => {
            const matchesSearch =
                !search ||
                activity.title?.toLowerCase().includes(search) ||
                activity.type.replace("_", " ").toLowerCase().includes(search);
            const matchesType = typeFilter === "all" || activity.type === typeFilter;
            return matchesSearch && matchesType;
        });

        nextActivities.sort((left, right) => {
            if (sortOption === "title_asc") {
                return (left.title || "").localeCompare(right.title || "");
            }

            const leftTime = left.updatedAt?.seconds || left.createdAt?.seconds || 0;
            const rightTime = right.updatedAt?.seconds || right.createdAt?.seconds || 0;

            return sortOption === "updated_asc" ? leftTime - rightTime : rightTime - leftTime;
        });

        return nextActivities;
    }, [activities, searchTerm, sortOption, typeFilter]);

    const handleCreateActivity = async (type: ActivityType) => {
        if (!user) return;

        try {
            const defaults = userProfile?.defaults;
            const id = await createActivity(user.uid, type, currentFolderId || undefined, defaults);
            setIsCreateOpen(false);
            toast.success("Activity created");
            router.push(`/professor/activity/${id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create activity");
        }
    };

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;

        try {
            await createFolder(user.uid, newFolderName.trim(), currentFolderId || undefined);
            setNewFolderName("");
            setIsCreateFolderOpen(false);
            toast.success("Folder created");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create folder");
        }
    };

    const handleDuplicateActivity = async (activity: Activity) => {
        try {
            const duplicateId = await duplicateActivity(activity, activity.folderId || null);
            toast.success("Activity duplicated");
            router.push(`/professor/activity/${duplicateId}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to duplicate activity");
        }
    };

    const openMoveDialog = (activity: Activity) => {
        setActivityToMove(activity);
        setMoveTargetFolderId(activity.folderId || "__root__");
        setMoveDialogOpen(true);
    };

    const handleMoveActivity = async () => {
        if (!activityToMove) return;

        try {
            await moveActivityToFolder(
                activityToMove.id,
                moveTargetFolderId === "__root__" ? null : moveTargetFolderId
            );
            toast.success("Activity moved");
            setMoveDialogOpen(false);
            setActivityToMove(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to move activity");
        }
    };

    if (!user) return null;

    return (
        <main className="min-h-screen bg-slate-50 py-8">
            <ResponsiveContainer size="lg" className="space-y-8">
                <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-serif text-slate-900">Activities</h1>
                        <p className="text-slate-500">
                            {currentFolderId ? (
                                <button
                                    onClick={() => setCurrentFolderId(null)}
                                    className="flex items-center gap-1 transition-colors hover:text-primary"
                                >
                                    ← Back to Library
                                </button>
                            ) : (
                                "Manage your polls and questions"
                            )}
                        </p>
                    </div>

                    <div className="flex w-full gap-3 md:w-auto">
                        <Button variant="ghost" onClick={() => router.push("/professor/teams")}>
                            <Users className="mr-2 h-4 w-4" /> Teams
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreateFolderOpen(!isCreateFolderOpen)}>
                            <FolderIcon className="mr-2 h-4 w-4" /> New Folder
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-rose-800">
                            <Plus className="mr-2 h-5 w-5" /> New Activity
                        </Button>
                    </div>
                </header>

                {isCreateFolderOpen && (
                    <div className="animate-in slide-in-from-top-2 fade-in flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
                        <FolderIcon className="h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={(event) => setNewFolderName(event.target.value)}
                            className="max-w-sm"
                            autoFocus
                            onKeyDown={(event) => event.key === "Enter" && handleCreateFolder()}
                        />
                        <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                            Create
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsCreateFolderOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[420px]">
                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-4 md:flex-row md:items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search folders and activities..."
                                className="h-9 bg-white pl-9"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                            <select
                                value={typeFilter}
                                onChange={(event) => setTypeFilter(event.target.value)}
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                            >
                                <option value="all">All types</option>
                                <option value="multiple_choice">Multiple choice</option>
                                <option value="open_ended">Open ended</option>
                                <option value="survey">Survey</option>
                                <option value="word_cloud">Word cloud</option>
                                <option value="qa">Q&A</option>
                                <option value="ranking">Ranking</option>
                                <option value="competition">Competition</option>
                            </select>

                            <select
                                value={sortOption}
                                onChange={(event) => setSortOption(event.target.value as SortOption)}
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                            >
                                <option value="updated_desc">Newest first</option>
                                <option value="updated_asc">Oldest first</option>
                                <option value="title_asc">Title A-Z</option>
                            </select>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredFolders.map((folder) => (
                            <div
                                key={folder.id}
                                onClick={() => setCurrentFolderId(folder.id)}
                                className="group flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <FolderIcon className="w-5 h-5 fill-current" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="flex items-center gap-2 font-medium text-slate-900 transition-colors group-hover:text-primary">
                                        {folder.name}
                                        {folder.teamId && (
                                            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                                                Shared
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-500">{folder.teamId ? "Team Folder" : "Folder"}</p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        deleteFolder(folder.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {filteredActivities.map((activity) => (
                            <div
                                key={activity.id}
                                onClick={() => router.push(`/professor/activity/${activity.id}`)}
                                className="group flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-rose-100 group-hover:text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-900">
                                        {activity.title || activity.prompt?.text || "Untitled Activity"}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                            {activity.type.replace("_", " ")}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {activity.updatedAt
                                                ? new Date(activity.updatedAt.seconds * 1000).toLocaleDateString()
                                                : "Just now"}
                                        </span>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDuplicateActivity(activity);
                                            }}
                                        >
                                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openMoveDialog(activity);
                                            }}
                                        >
                                            <Move className="mr-2 h-4 w-4" /> Move to Folder
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                deleteActivity(activity.id);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}

                        {filteredFolders.length === 0 && filteredActivities.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <p>{searchTerm ? "No matching folders or activities." : "This folder is empty."}</p>
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

            <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move Activity</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            Choose where <span className="font-medium text-slate-800">{activityToMove?.title || "this activity"}</span> should live.
                        </p>

                        <select
                            value={moveTargetFolderId}
                            onChange={(event) => setMoveTargetFolderId(event.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                            <option value="__root__">No folder (root)</option>
                            {availableMoveFolders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                    {folder.teamId ? " (Shared)" : ""}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleMoveActivity}>Move Activity</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
