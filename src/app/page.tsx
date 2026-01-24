"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-serif font-bold text-slate-900 tracking-tighter">
            Harvard<span className="text-primary">Poll</span>
          </h1>
          <p className="text-xl text-slate-500 font-sans">
            Real-time interaction for the modern classroom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-64 flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-slate-200 hover:border-primary hover:bg-slate-50 transition-all shadow-sm hover:shadow-xl group"
              onClick={() => router.push("/student")}
            >
              <div className="p-4 bg-slate-100 rounded-full group-hover:bg-primary/10 transition-colors">
                <Users className="w-10 h-10 text-slate-600 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-serif font-bold text-slate-800">Student</h3>
                <p className="text-slate-500">Join a session</p>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-64 flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-slate-200 hover:border-primary hover:bg-slate-50 transition-all shadow-sm hover:shadow-xl group"
              onClick={() => router.push("/professor")}
            >
              <div className="p-4 bg-slate-100 rounded-full group-hover:bg-primary/10 transition-colors">
                <GraduationCap className="w-10 h-10 text-slate-600 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-serif font-bold text-slate-800">Professor</h3>
                <p className="text-slate-500">Manage classes</p>
              </div>
            </Button>
          </motion.div>
        </div>

        <p className="text-center text-sm text-slate-300">
          © {new Date().getFullYear()} Harvard University
        </p>
      </motion.div>
    </main>
  );
}
