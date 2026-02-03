"use client";

import { useState, useEffect } from "react";
import { UserProfile, Team } from "@/lib/types";
import { db, auth } from "@/lib/firebase/client";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Users, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TeamManagement({ user }: { user: UserProfile }) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    // Invite State
    const [inviteEmail, setInviteEmail] = useState("");
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchTeams();
    }, [user]);

    const fetchTeams = async () => {
        try {
            // Find teams where I am owner OR member
            // Firestore array-contains-any logic for 'memberIds' is best
            // But for now, we'll index memberIds.
            const q = query(
                collection(db, "teams"),
                where("memberIds", "array-contains", user.uid)
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Team));
            setTeams(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        try {
            const newTeam: Partial<Team> = {
                name: newTeamName,
                ownerId: user.uid,
                memberIds: [user.uid],
                createdAt: serverTimestamp() as any
            };
            const ref = await addDoc(collection(db, "teams"), newTeam);
            toast.success("Team created!");
            setNewTeamName("");
            setCreateOpen(false);
            fetchTeams();
        } catch (e) {
            console.error(e);
            toast.error("Failed to create team");
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !selectedTeamId) return;
        // In real app: Search for user by email -> Add UID.
        // For Staging/MVP: We'll just 'simulate' invitation or add if we can find them.
        // Since we can't easily query users by email without Cloud Function (security),
        // we will just show a Toast with "Invite Sent". 
        // OR: If we want to test multi-user, we need a way to link.
        // Let's assume we copy a 'Invite Link' instead.
        toast.info(`Invitation sent to ${inviteEmail} (Simulated)`);
        setInviteEmail("");
        setSelectedTeamId(null);
    };

    if (loading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold">My Teams</h2>
                <Button onClick={() => setCreateOpen(!createOpen)}>
                    <Plus className="w-4 h-4 mr-2" /> New Team
                </Button>
            </div>

            {createOpen && (
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-sm">Create New Team</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input
                            placeholder="Team Name (e.g. Physics Department)"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                        />
                        <Button onClick={handleCreateTeam}>Create</Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => (
                    <Card key={team.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between">
                                <span>{team.name}</span>
                                <span className="text-xs font-normal text-slate-400 flex items-center">
                                    <Users className="w-3 h-3 mr-1" /> {team.memberIds.length} Members
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Invite member by email..."
                                        value={selectedTeamId === team.id ? inviteEmail : ""}
                                        onChange={(e) => {
                                            setSelectedTeamId(team.id);
                                            setInviteEmail(e.target.value);
                                        }}
                                        className="text-sm h-8"
                                    />
                                    <Button size="sm" variant="outline" onClick={handleInvite} className="h-8">
                                        <Mail className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Owner: {team.ownerId === user.uid ? "You" : "Another Professor"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {teams.length === 0 && !createOpen && (
                <div className="text-center text-slate-400 py-10 border-2 border-dashed border-slate-100 rounded-xl">
                    No teams yet. Create one to share folders!
                </div>
            )}
        </div>
    );
}
