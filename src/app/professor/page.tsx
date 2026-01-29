"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfessorLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password State
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                // Client-side quick check (optional, but good for UX)
                if (inviteCode !== "02143") {
                    // We can leave this or remove it. Better to let serve handle authoritative check, 
                    // but to save a request we can keep it. The important part is server checks it too.
                    // I will remove logic here to prove server enforcement works, 
                    // OR keep it and wrap the fetch.
                }

                const res = await fetch("/api/admin/create-professor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, inviteCode })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to create account");
                }

                // Account created on server, now sign in on client
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Account created!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push("/professor/dashboard");
        } catch (error: any) {
            console.error(error);
            if (error instanceof FirebaseError) {
                // ... existing error handling ...
            } else {
                toast.error(error.message || "Authentication failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) {
            toast.error("Please enter your email address.");
            return;
        }
        setResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            toast.success("Password reset email sent! Check your inbox.");
            setIsForgotPasswordOpen(false);
            setResetEmail("");
        } catch (error) {
            console.error(error);
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/user-not-found') {
                    toast.error("No account found with this email.");
                } else {
                    toast.error("Failed to send reset email: " + error.message);
                }
            } else {
                toast.error("Failed to send reset email.");
            }
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-serif font-bold text-slate-900">
                        {isSignUp ? "Professor Sign Up" : "Professor Sign In"}
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
                            placeholder="hello@lunr.studio"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password">Password</Label>
                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetEmail(email); // Pre-fill email if available
                                        setIsForgotPasswordOpen(true);
                                    }}
                                    className="text-xs text-slate-500 hover:text-primary underline"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="inviteCode">Invite Code</Label>
                            <Input
                                id="inviteCode"
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                required
                                placeholder="Enter invite code"
                            />
                        </div>
                    )}
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

                {/* Forgot Password Dialog */}
                <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                                Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    placeholder="harvard@edu..."
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={resetLoading}>
                                {resetLoading ? <Loader2 className="animate-spin mr-2" /> : "Send Reset Link"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
