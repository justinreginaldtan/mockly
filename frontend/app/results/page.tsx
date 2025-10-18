"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  Download,
  MicVocal,
  RefreshCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"
import { SuccessAnimation } from "@/components/success-animation"

const gradientClass =
  "bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] text-white shadow-lg shadow-primary/30 animate-gradient"

const evaluationSummary = {
  overallScore: 82,
  jdCoverage: {
    hit: 68,
    partial: 22,
    miss: 10,
  },
  strengths: ["Clear storytelling", "Quantified impact", "Collaborative tone"],
  weakAreas: ["Handling ambiguity", "Cross-functional alignment"],
}

const evidenceSnippets = [
  {
    type: "hit",
    skill: "Leadership & Impact",
    quote:
      "I led a 12-person robotics team, delivering a computer vision pipeline that improved accuracy by 18% and earned us a national finals slot.",
    jdSignal: "Leadership in cross-functional teams",
  },
  {
    type: "partial",
    skill: "Handling Ambiguity",
    quote:
      "When requirements shifted, I met with our PM to clarify must-haves, but I could have outlined a stronger plan for ongoing changes.",
    jdSignal: "Ambiguity management",
  },
  {
    type: "hit",
    skill: "Technical Depth",
    quote: "We orchestrated services with Kubernetes to achieve 99.9% uptime across the IoT fleet.",
    jdSignal: "Scaling systems",
  },
] as const

const followUps = [
  "Describe a time when you had to make a decision with limited data.",
  "How did you align stakeholders with conflicting priorities?",
] as const

export default function ResultsPage() {
  const [showAnimation, setShowAnimation] = useState(true)
  const [showFollowUps, setShowFollowUps] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const coverageSegments = useMemo(
    () => [
      { label: "Strong match", value: evaluationSummary.jdCoverage.hit, color: "bg-emerald-500" },
      { label: "Partial match", value: evaluationSummary.jdCoverage.partial, color: "bg-amber-400" },
      { label: "Not covered", value: evaluationSummary.jdCoverage.miss, color: "bg-rose-400" },
    ],
    [],
  )

  const handleGenerateFollowUps = () => {
    setShowFollowUps(true)
    setTimeout(() => setShowFollowUps(false), 4000)
  }

  const handleGenerateAudio = () => {
    setIsGeneratingAudio(true)
    setTimeout(() => setIsGeneratingAudio(false), 2500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(79,97,255,0.45),_rgba(12,15,25,0.95))] text-white">
      {showAnimation && <SuccessAnimation onComplete={() => setShowAnimation(false)} />}

      <header className="sticky top-0 z-30 border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4b6bff] via-[#805dff] to-[#a855f7] flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="text-white font-semibold text-sm">MI</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight">Mock Interviewer</span>
              <span className="text-xs text-white/60">Step 4 · Gemini insights unlocked</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <ProgressBar currentStep={4} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">Gemini</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 space-y-10">
        <section className="animate-slide-up space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-semibold text-white shadow-sm shadow-[#4f61ff]/30">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Gemini analysis complete
              </div>
              <h1 className="text-4xl font-semibold leading-tight">You’re interview-ready.</h1>
              <p className="max-w-2xl text-lg text-white/70">
                Gemini cross-checked your answers against the Google SWE intern JD and your resume. Use this recap to tighten
                your narrative before the real interview.
              </p>
            </div>
            <div className="relative isolate flex h-36 w-36 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(79,97,255,0.45),_transparent)] blur-2xl" />
              <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/15 bg-[#141c2f]/90 shadow-lg shadow-black/40">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Score</span>
                <span className="mt-2 text-4xl font-bold text-white">{evaluationSummary.overallScore}</span>
                <span className="text-xs text-white/60">out of 100</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <div className="animate-slide-up rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#9aa7ff]">
                  <TrendingUp className="h-4 w-4" />
                  JD coverage breakdown
                </div>
                <p className="mt-1 text-sm text-white/70">
                  Gemini mapped your stories to the job description to spot gaps and strengths.
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/20">
                View raw Gemini output
              </Button>
            </div>

            <div className="mt-8 grid gap-6">
              {coverageSegments.map((segment) => (
                <div key={segment.label} className="space-y-3">
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className={`inline-flex h-2 w-2 rounded-full ${segment.color}`} />
                      {segment.label}
                    </div>
                    <span className="text-sm font-semibold text-[#9aa7ff]">{segment.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full ${segment.color}`} style={{ width: `${segment.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="animate-slide-up delay-150 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9aa7ff]">
              <BadgeCheck className="h-4 w-4" />
              Quick wins
            </div>
            <ul className="space-y-3 text-sm text-white/70">
              {evaluationSummary.strengths.map((strength) => (
                <li key={strength} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Focus next
              </div>
              <p className="mt-2">
                {evaluationSummary.weakAreas[0]} · {evaluationSummary.weakAreas[1]}
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {evidenceSnippets.map((snippet, index) => (
            <div
              key={index}
              className="animate-slide-up rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      snippet.type === "hit" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {snippet.type === "hit" ? "Strong match" : "Partial"}
                  </span>
                  <span className="text-sm font-semibold text-white">{snippet.skill}</span>
                </div>
                <span className="text-xs uppercase tracking-[0.35em] text-white/40">Gemini cite</span>
              </div>
              <p className="mt-4 text-sm text-white/70 leading-relaxed italic">“{snippet.quote}”</p>
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-xs font-medium text-[#9aa7ff]">
                JD signal: {snippet.jdSignal}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
          <div className="animate-slide-up rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-semibold text-[#9aa7ff]">
                <BarChart3 className="h-4 w-4" />
                Gemini upgrade plan
              </div>
              <Button variant="outline" size="sm" className="border-white/15 bg-white/10 text-white hover:bg-white/20">
                Copy to clipboard
              </Button>
            </div>
            <ul className="mt-5 space-y-4 text-sm text-white/70">
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="font-semibold text-white">Quantify ambiguous projects</span>
                <p className="mt-1 text-sm text-white/70">
                  Add a metric when discussing the scope change (e.g., “Reduced onboarding time from 3 weeks to 8 days by
                  centralizing documentation.”)
                </p>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="font-semibold text-white">Tie leadership to customer outcomes</span>
                <p className="mt-1 text-sm text-white/70">
                  Highlight how your decisions impacted students/end users to mirror Google’s customer focus.
                </p>
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="font-semibold text-white">Plan for scale follow-ups</span>
                <p className="mt-1 text-sm text-white/70">
                  Prepare 1–2 sentences on how you would scale your robotics pipeline to 10× more devices—Gemini flagged this
                  as a likely probing question.
                </p>
              </li>
            </ul>
          </div>

          <aside className="animate-slide-up delay-150 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#9aa7ff]">
              <MicVocal className="h-4 w-4" />
              ElevenLabs coach recap
            </div>
            <p className="text-sm text-white/70 leading-6">
              Hear a 30-second voice note summarizing your performance for a rapid refresher before the real thing.
            </p>
            <Button
              disabled={isGeneratingAudio}
              onClick={handleGenerateAudio}
              className={`w-full rounded-full font-semibold ${gradientClass}`}
            >
              {isGeneratingAudio ? "Generating audio..." : "Play voice recap"}
            </Button>
            <Button variant="outline" className="w-full border-white/15 bg-white/10 text-white hover:bg-white/20">
              <Download className="mr-2 h-4 w-4" />
              Download report PDF
            </Button>
          </aside>
        </section>

        <section className="animate-slide-up rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#9aa7ff]">
                <RefreshCcw className="h-4 w-4" />
                Practice weak areas
              </div>
              <p className="text-sm text-white/70">Gemini spun up follow-up prompts based on your weakest JD signals.</p>
            </div>
            <Button
              variant="outline"
              className="border-white/15 bg-white/10 text-white hover:bg-white/20"
              onClick={handleGenerateFollowUps}
            >
              Generate follow-up questions
            </Button>
          </div>

          {showFollowUps ? (
            <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-md shadow-black/30">
              {followUps.map((item, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-white/70">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#9aa7ff]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 px-6 py-10 text-center text-sm text-white/60">
              Follow-up prompts will appear here once generated.
            </div>
          )}
        </section>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Sparkles className="h-4 w-4 text-[#9aa7ff]" />
            Gemini saved this session—revisit anytime for targeted prep.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/">
              <Button variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/20">
                Start new interview
              </Button>
            </Link>
            <Link href="/setup">
              <Button className={gradientClass}>
                Run another drill
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
