"use client"

import { useEffect, useState } from "react"
import {
  BrainCircuit,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Link2,
  MicVocal,
  Sparkles,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"
import { FileUploadCard } from "@/components/file-upload-card"
import Link from "next/link"

const personaPreview = {
  company: "Google",
  role: "Software Engineering Intern",
  focus: ["Leadership stories", "Debugging process", "System design basics"],
  voice: "Technical Mentor · ElevenLabs",
  sprint: "Interview in 3 days",
  jdAnchor: "Emphasize collaborative problem solving and impact metrics.",
}

const gradientClass =
  "bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] text-white shadow-lg shadow-primary/40 animate-gradient"

export default function UploadPage() {
  const [showCalibrating, setShowCalibrating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowCalibrating(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(79,97,255,0.45),_rgba(12,15,25,0.95))] text-white">
      {showCalibrating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/70 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/15 bg-[#141c2f]/90 px-8 py-10 shadow-2xl shadow-black/40">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#4f61ff]/30 border-t-[#9aa7ff]" />
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Gemini</p>
              <h2 className="text-lg font-semibold text-white">Calibrating your interview</h2>
              <p className="text-sm text-white/60">We’re reading your resume and job description…</p>
            </div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4b6bff] via-[#805dff] to-[#a855f7] flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="text-white font-semibold text-sm">MI</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight">Mock Interviewer</span>
              <span className="text-xs text-white/60">Always-on practice for students</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <ProgressBar currentStep={1} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-white/60">
              <span className="uppercase tracking-[0.2em] text-white/40">Powered by</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">Gemini</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 container mx-auto px-6 py-16 flex flex-col justify-center transition-opacity duration-500 ${
          showCalibrating ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
          <div className="space-y-10 animate-slide-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-semibold text-white shadow-sm shadow-[#4f61ff]/30">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Need a mock interview tonight?
              </div>
              <h1 className="text-5xl font-semibold tracking-tight text-balance leading-tight">
                Drop your resume, pick the role, and let Gemini coach you like the real thing.
              </h1>
              <p className="text-lg text-white/70 max-w-xl">
                Upload your resume and the job description to get a hyper-personalized mock interview—with a mentor voice
                from ElevenLabs and JD-grounded feedback in minutes.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FileUploadCard
                icon={<FileText className="w-6 h-6" />}
                title="Resume"
                description="PDF or DOCX — we’ll highlight your impact."
                acceptedFormats=".pdf,.doc,.docx"
              />
              <FileUploadCard
                icon={<Link2 className="w-6 h-6" />}
                title="Job Description"
                description="Paste a link or drop a file — we’ll parse the requirements."
                acceptedFormats=".pdf,.txt,.doc,.docx"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Built for students",
                  icon: <GraduationCap className="h-4 w-4" />,
                  copy: "Gemini learns from your campus projects, internships, and clubs to tailor every question.",
                },
                {
                  title: "Company-specific drills",
                  icon: <BrainCircuit className="h-4 w-4" />,
                  copy: "Hit the exact competencies top tech companies look for, grounded in their JD language.",
                },
                {
                  title: "Practice in minutes",
                  icon: <Clock className="h-4 w-4" />,
                  copy: "Hop in before tomorrow’s interview—no scheduling, no waiting for a human mock.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <div className="text-[#9aa7ff]">{card.icon}</div>
                    {card.title}
                  </div>
                  <p className="mt-3 text-sm text-white/70">{card.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative isolate animate-slide-up delay-150">
            <div className="absolute -top-8 -right-6 h-32 w-32 rounded-full bg-[#4f61ff]/30 blur-3xl" aria-hidden />
            <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[#38bdf8]/25 blur-3xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#141c2f]/90 p-8 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gemini Preview
                </span>
                <span className="font-medium text-white/70">Next session</span>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white/50 uppercase tracking-widest">Candidate</p>
                  <h3 className="text-3xl font-semibold mt-1">
                    {personaPreview.company} · {personaPreview.role}
                  </h3>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">{personaPreview.jdAnchor}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    <Target className="h-4 w-4 text-[#9aa7ff]" />
                    Focus Areas
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {personaPreview.focus.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <MicVocal className="h-4 w-4 text-[#9aa7ff]" />
                      {personaPreview.voice}
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Ready
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="h-4 w-4 text-[#9aa7ff]" />
                    {personaPreview.sprint}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Target className="h-4 w-4 text-[#a782ff]" />
                    “Tell me how you led the robotics team to nationals…”
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#9aa7ff]" />
                    <span>Session length adapts to your availability.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-3.5 w-3.5 text-[#9aa7ff]" />
                    <span>Gemini cites the JD so you practice the right stories.</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 -bottom-12 h-24 bg-gradient-to-t from-[#4f61ff]/20 via-transparent to-transparent blur-2xl" />
            </div>
          </div>
        </div>
      </main>

      <div className="sticky bottom-6 z-20 flex justify-center px-6">
        <div className="inline-flex items-center gap-4 rounded-full border border-white/15 bg-white/10 px-6 py-4 shadow-xl shadow-black/40 backdrop-blur">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <MicVocal className="h-4 w-4 text-[#9aa7ff]" />
            ElevenLabs interviewer voice included
          </div>
          <Link href="/setup">
            <Button
              size="lg"
              className={`text-lg px-8 py-6 rounded-full font-semibold tracking-tight transition-transform duration-300 hover:scale-[1.03] focus-visible:scale-[1.02] ${gradientClass}`}
            >
              Launch tailored practice
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
