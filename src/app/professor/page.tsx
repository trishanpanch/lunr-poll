"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfessorLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Bypass for testing - complete local mock
            if (email.toLowerCase() === "lunr@lunr.studio" && password === "lunr") {
                // Ensure we have a firebase auth token so firestore doesn't reject us
                try {
                    await signInAnonymously(auth);
                } catch (e) {
                    console.warn("Dev Bypass: Anonymous auth failed (likely not enabled in console), proceeding without auth.", e);
                    toast.warning("Auth warning: Enable Anonymous Auth in Firebase Console for live data.");
                }

                // Set a mock session in local storage
                localStorage.setItem("harvard_poll_dev_user", JSON.stringify({
                    uid: "dev_lunr_ID",
                    email: "lunr@lunr.studio",
                    displayName: "Dev Professor"
                }));
                toast.success("Dev Bypass: Logged in locally");
                router.push("/professor/dashboard");
                return;
            }

            if (isSignUp) {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", cred.user.uid), {
                    uid: cred.user.uid,
                    email: email,
                    name: "Professor",
                    createdAt: serverTimestamp()
                });
                toast.success("Account created!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push("/professor/dashboard");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-serif font-bold text-slate-900">
                        {isSignUp ? "Professor Sign Up" : "Professor Access"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isSignUp ? "Create a new class account." : "Sign in to manage your classes."}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="harvard@edu..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : (isSignUp ? "Create Account" : "Sign In")}
                    </Button>
                    <div className="text-center">
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-slate-500"
                        >
                            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                        </Button>
                    </div>
                </form>

                <div className="text-center text-xs text-slate-400">
                    For demo: Use any existing account or create one manually in Firebase Console.
                    <br />(Or implement sign up if needed)
                </div>
            </div>
        </div>
    );
}
