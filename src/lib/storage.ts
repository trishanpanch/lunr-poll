import { Session } from "@/lib/types";
import { IS_DEMO_MODE, isLocalSession } from "@/lib/utils";

const STORAGE_KEY = "harvard_poll_dev_sessions";

export function getLocalSessions(): Session[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Session[]) : [];
    } catch {
        return [];
    }
}

export function getLocalSession(id: string): Session | null {
    return getLocalSessions().find(s => s.id === id) ?? null;
}

export function updateLocalSession(id: string, updates: Partial<Session>): void {
    const sessions = getLocalSessions();
    const updated = sessions.map(s =>
        s.id === id ? { ...s, ...updates } : s
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function isDemoSession(session: { id?: string; ownerId: string }): boolean {
    return IS_DEMO_MODE && !!session.id && (isLocalSession(session.id) || session.ownerId === "dev_lunr_ID");
}
