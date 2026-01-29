"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BarChart3, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-serif font-bold tracking-tight">
          Harvard<span className="text-primary">Poll</span>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        <motion.div variants={itemVariants} className="space-y-8">
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight text-slate-900">
            Real-time insights for the <br /><span className="text-primary">connected classroom</span>.
          </h1>
          <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
            Empower your lectures with instant student feedback, live polls, and anonymous Q&A. Simple, fast, and effective.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="text-lg px-8 h-14 rounded-full" onClick={() => router.push("/professor")}>
              Start Teaching
              <Zap className="ml-2 w-5 h-5 fill-current" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full" onClick={() => router.push("/student")}>
              I am a Student
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
            <Image
              src="/hero.png"
              alt="Classroom Interaction"
              width={800}
              height={600}
              className="object-cover w-full h-auto transform group-hover:scale-105 transition duration-700 ease-out"
              priority
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif">Live Analytics</h3>
              <p className="text-slate-600">Visualize student comprehension instantly with dynamic charts and heatmaps.</p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif">Anonymous Feedback</h3>
              <p className="text-slate-600">Encourage participation from every student with secure, anonymous responses.</p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif">Instant Setup</h3>
              <p className="text-slate-600">No app download required. Students join via QR code or a simple 6-digit link.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection (Secondary CTA) */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center space-y-12">
        <h2 className="text-3xl font-serif font-bold">Choose your path</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Button
            variant="outline"
            className="h-auto p-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-rose-50/50 transition-all group"
            onClick={() => router.push("/student")}
          >
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-white transition-colors shadow-sm">
              <Users className="w-8 h-8 text-slate-600 group-hover:text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">Student Portal</div>
              <div className="text-slate-500">Enter a code to join a live session</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-8 flex flex-col items-center gap-4 hover:border-primary hover:bg-rose-50/50 transition-all group"
            onClick={() => router.push("/professor")}
          >
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-white transition-colors shadow-sm">
              <GraduationCap className="w-8 h-8 text-slate-600 group-hover:text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">Professor Access</div>
              <div className="text-slate-500">Create polls and view results</div>
            </div>
          </Button>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 font-sans">
        Made with love by <a href="https://www.lunr.studio" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LUNR Studio</a>
      </footer>
    </main>
  );
}
