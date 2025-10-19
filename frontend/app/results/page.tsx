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
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"
import { SuccessAnimation } from "@/components/success-animation"
import { StepIndicator } from "@/components/step-indicator"

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

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

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

  const progressSteps = ["Upload", "Review brief", "Mock room", "Coach Card"]

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      {showAnimation && <SuccessAnimation onComplete={() => setShowAnimation(false)} />}

      <header className="sticky top-0 z-30 border-b border-[#EDE5E0] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-3 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#E0D6CF] bg-white/90 shadow-[0_10px_24px_-16px_rgba(26,26,26,0.45)]">
              <span className="font-display text-sm font-semibold text-[#1A1A1A]">Mock</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-semibold tracking-tight text-[#1A1A1A]">Mockly</span>
              <span className="text-xs font-body font-medium text-[#777777]">Step 4 · Coach Card recap</span>
            </div>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <ProgressBar currentStep={4} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-[#777777]">
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">Gemini</span>
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <motion.main
        className="mx-auto max-w-screen-lg space-y-12 px-2 py-16 md:px-8 md:py-24"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <StepIndicator steps={progressSteps} currentIndex={3} />
        <motion.section
          className="relative isolate overflow-hidden rounded-[32px] border border-[#EDE5E0] bg-white/95 px-8 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-10 top-8 h-48 w-48 rounded-full bg-[#FF7A70]/8 blur-[120px]" />
            <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-[#FF7A70]/10 blur-[140px]" />
          </div>
          <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#777777]">
                <Sparkles className="h-4 w-4 text-[#FF7A70]" />
                Gemini analysis
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1A1A1A] md:text-5xl">
                You’re interview-ready.
              </h1>
              <p className="max-w-2xl font-body text-base font-medium leading-relaxed max-sm:clamp-2 md:text-lg">
                Gemini mapped your answers against the Google SWE intern JD. Use this recap to tighten your story before the
                real interview.
              </p>
            </div>
            <div className="relative isolate flex h-40 w-40 items-center justify-center">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[#FF7A70]/10 blur-3xl" />
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[28px] border border-[#EDE5E0] bg-white/95 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
                <span className="text-xs font-body font-semibold uppercase tracking-[0.35em] text-[#777777]">Score</span>
                <span className="mt-3 font-display text-5xl font-semibold text-[#1A1A1A]">
                  {evaluationSummary.overallScore}
                </span>
                <span className="text-xs font-body font-medium text-[#777777]">out of 100</span>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#FF7A70]">
                  <TrendingUp className="h-4 w-4" />
                  JD coverage breakdown
                </div>
                <p className="font-body text-sm font-medium">
                  Gemini highlighted where your responses hit the mark and where to reinforce them.
                </p>
              </div>
              <Button variant="outline" size="sm">
                View raw Gemini output
              </Button>
            </div>

            <div className="mt-8 space-y-5">
              {coverageSegments.map((segment, index) => (
                <div key={segment.label} className="space-y-3 animate-fade-up" style={{ animationDelay: `${0.1 * index}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-body text-sm font-medium text-[#1A1A1A]">
                      <span className={`inline-flex h-2 w-2 rounded-full ${segment.color}`} />
                      {segment.label}
                    </div>
                    <span className="font-body text-sm font-semibold text-[#FF7A70]">{segment.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3E9E3]">
                    <div className={`h-full ${segment.color}`} style={{ width: `${segment.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="animate-fade-up delay-100 space-y-4 rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#FF7A70]">
              <BadgeCheck className="h-4 w-4" />
              Quick wins
            </div>
            <ul className="space-y-3 font-body text-sm font-medium">
              {evaluationSummary.strengths.map((strength) => (
                <li key={strength} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 font-body text-sm font-semibold text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Focus next
              </div>
              <p className="mt-2 font-body text-sm font-medium">
                {evaluationSummary.weakAreas[0]} · {evaluationSummary.weakAreas[1]}
              </p>
            </div>
          </aside>
        </motion.section>

        <motion.section
          className="grid gap-8 lg:grid-cols-2"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {evidenceSnippets.map((snippet, index) => (
            <div
              key={snippet.skill}
              className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]"
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      snippet.type === "hit" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {snippet.type === "hit" ? "Strong match" : "Partial"}
                  </span>
                  <span className="font-display text-sm font-semibold text-[#1A1A1A]">{snippet.skill}</span>
                </div>
                <span className="text-xs font-body font-semibold uppercase tracking-[0.35em] text-[#777777]">
                  Gemini cite
                </span>
              </div>
              <p className="mt-4 font-body text-sm font-medium leading-relaxed italic">
                “{snippet.quote}”
              </p>
              <div className="mt-4 rounded-2xl bg-[#FFF2ED] px-4 py-3 text-xs font-body font-semibold text-[#FF7A70]">
                JD signal: {snippet.jdSignal}
              </div>
            </div>
          ))}
        </motion.section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <div className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 font-body text-sm font-semibold text-[#FF7A70]">
                <BarChart3 className="h-4 w-4" />
                Gemini upgrade plan
              </div>
              <Button variant="outline" size="sm">
                Copy to clipboard
              </Button>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="rounded-2xl border border-[#EDE5E0] bg-white px-4 py-3">
                <span className="font-display text-sm font-semibold text-[#1A1A1A]">
                  Quantify ambiguous projects
                </span>
                <p className="mt-1 font-body text-sm font-medium">
                  Add a metric when discussing the scope change (e.g., “Reduced onboarding time from 3 weeks to 8 days by
                  centralizing documentation.”)
                </p>
              </li>
              <li className="rounded-2xl border border-[#EDE5E0] bg-white px-4 py-3">
                <span className="font-display text-sm font-semibold text-[#1A1A1A]">
                  Tie leadership to customer outcomes
                </span>
                <p className="mt-1 font-body text-sm font-medium">
                  Highlight how your decisions impacted students/end users to mirror Google’s customer focus.
                </p>
              </li>
              <li className="rounded-2xl border border-[#EDE5E0] bg-white px-4 py-3">
                <span className="font-display text-sm font-semibold text-[#1A1A1A]">
                  Plan for scale follow-ups
                </span>
                <p className="mt-1 font-body text-sm font-medium">
                  Prepare a sentence on scaling your robotics pipeline to 10× more devices—Gemini flagged this as a likely
                  follow-up.
                </p>
              </li>
            </ul>
          </div>

          <aside className="animate-fade-up delay-100 space-y-4 rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 font-body text-sm font-semibold text-[#FF7A70]">
              <MicVocal className="h-4 w-4" />
              ElevenLabs coach recap
            </div>
            <p className="font-body text-sm font-medium leading-relaxed">
              Hear a 30-second voice note summarizing your performance for a quick refresh before the real interview.
            </p>
            <Button disabled={isGeneratingAudio} onClick={handleGenerateAudio} className="w-full">
              {isGeneratingAudio ? "Generating audio…" : "Play voice recap"}
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download report PDF
            </Button>
          </aside>
        </motion.section>

        <section className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-body text-sm font-semibold text-[#FF7A70]">
                <RefreshCcw className="h-4 w-4" />
                Practice weak areas
              </div>
              <p className="font-body text-sm font-medium">
                Gemini spun up follow-ups targeting the JD signals that need another rep.
              </p>
            </div>
            <Button variant="outline" onClick={handleGenerateFollowUps}>
              Generate follow-up questions
            </Button>
          </div>

          {showFollowUps ? (
            <div className="mt-6 grid gap-3 rounded-2xl border border-[#EDE5E0] bg-white px-6 py-5">
              {followUps.map((item, index) => (
                <div key={item} className="flex items-start gap-3 font-body text-sm font-medium">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#FF7A70]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#EDE5E0] px-6 py-10 text-center font-body text-sm font-medium text-[#777777]">
              Follow-up prompts will appear here once generated.
            </div>
          )}
        </section>

        <section className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 px-8 py-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#777777]">
                Next steps
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#1A1A1A]">Keep your momentum going</h2>
              <p className="font-body text-sm font-medium">
                Start a new interview with a fresh persona or revisit the setup to fine-tune Gemini’s focus.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/">
                <Button variant="outline">Start new interview</Button>
              </Link>
              <Link href="/setup">
                <Button className="group">
                  Run another drill
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </motion.main>
    </div>
  )
}
