"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react"
import { ArrowRight, BarChart3, CheckCircle2, FileText, Link2, MicVocal, Sparkles, Target } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Hero, { HeroProps } from "@/components/Hero"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"

const SAMPLE_RESUME_NAME = "justin-tan-resume.pdf"
const SAMPLE_JOB_DESCRIPTION = `Responsibilities
Applications are accepted until further notice.

Please note this posting is to advertise potential job opportunities. This exact role may not be open today but could open in the near future. When you apply, a Cisco representative may contact you directly if a relevant position opens.

Meet the Team

Cisco Security Customer Experience (CX) organization supports customers through the entire lifecycle of a security solution: from understanding business needs to deploying custom solutions, from optimizing existing solutions to developing applications that meets specific needs; from helping customers to maintain their solutions to helping them investigate potential security incidents. As a Security Consulting Engineer Intern, you will be able to interact with customers and learn how Cisco plan, design, deploy and optimize Security Solution while acquiring the technical and consultative skills required to accurately delight Cisco customers. During the internship you will also have the opportunity to interact with other Cisco organizations and learn how they contribute to enable our customers to achieve their business goals.

Your Impact

Everything is converging on the Internet, making networked connections more relevant than ever. Our employees have groundbreaking ideas that impact everything imaginable - from entertainment, retail, healthcare, and education, to public and private sectors, smart cities, smart cars, and everyday devices in our homes. Here, that means you'll take creative ideas from the drawing board to powerful solutions that have real world impact. You'll collaborate with Cisco leaders, partner with expert mentors, and develop incredible relationships with colleagues who share your interest in connecting the unconnected. You'll be part of a team that cares about its customers, enjoys having fun, and you'll participate in changing the lives of those in our local communities. Come prepared to be inspired.

You will attend on-site design and configuration sessions with a Security Consulting mentor
You will collect requirements from customers for projects to meet critical business goals
You will work with a team mentor to define the business goals and requirements for integration efforts
You will aid in analyzing and designing policy creation for Identity Services, Firewalls, Visibility Solutions and Cloud-based solutions.
You will analyze customer configurations and provide feedback on possible improvements to the configuration to improve alignment with customer business goals
You will learn and understand Security Policies, Standards, Procedures and Guidelines
You will be able to demonstrate programming languages (Java/Python/C++) and open source automation platforms (Ansible/Chef/Terraform) to develop tailor-made automation capabilities to customers using Cisco application programming interfaces

Minimum Qualifications

Currently enrolled in a certification program (e.g., Boot Camp, Apprenticeship, Community College), or currently enrolled in an undergraduate degree program. Relevant fields include: in Information Systems, Cyber Security, Computer Networking, Computer Science or Engineering
Knowledge of IT systems, networking concepts, TCP/IP protocols, network devices and applications, OSI 7-layer model, or code development
Able to legally live and work in the country for which you're applying, without visa support or sponsorship`

const primaryCtaClass =
  "rounded-xl px-8 py-4 bg-[#FF7A70] text-white font-medium shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#ff695c] hover:shadow-[0_4px_32px_rgba(0,0,0,0.12)] focus-visible:ring-offset-[#FFF8F5]"

const outlineButtonClass =
  "rounded-xl px-6 py-3 border border-[#EDE5E0] bg-white text-sm font-medium text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-200 hover:bg-[#FFF2ED] hover:shadow-[0_4px_28px_rgba(0,0,0,0.08)] focus-visible:ring-offset-[#FFF8F5]"

const stepActionButtonClass =
  "rounded-xl px-8 py-4 bg-[#1A1A1A] text-white font-medium transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#2E2E2E] shadow-[0_2px_20px_rgba(0,0,0,0.1)] focus-visible:ring-offset-[#FFF8F5]"

const cardClass =
  "rounded-2xl border border-[#EDE5E0] bg-white/95 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)]"

const intakeSummary = {
  resume: {
    headline: "Justin Tan · Senior CIS Student · University of Houston",
    summary:
      "Focused on offensive security and AI system hardening. Runs daily capture-the-flag reps and prototypes tooling that stress-tests RAG pipelines under adversarial pressure.",
    highlights: [
      "Completed the DailyCTF streak—30 consecutive days of challenge solving with a consistent top-5% leaderboard finish.",
      "Built Parapet, a harness that probes retrieval-augmented generation systems for prompt injection, data leakage, and resiliency gaps.",
      "Co-led CougarSec incident response drills, coordinating red/blue teams through three full-fidelity attack simulations each semester.",
    ],
  },
  job: {
    company: "Cisco",
    role: "Cybersecurity Intern · Security Operations",
    summary:
      "Internship prioritizes cloud incident response, malware triage, and communicating risk to engineering partners within 30-minute SLAs.",
    signals: [
      "Demonstrate how you detected, contained, and documented high-severity alerts under time pressure.",
      "Highlight automation or tooling—like Parapet or custom scripts—that accelerated response or exposed blind spots.",
      "Translate deep technical findings into stakeholder-ready recommendations leadership can act on quickly.",
    ],
  },
  focusAreas: [
    {
      label: "Incident response",
      detail: "Show how you scoped blast radius, contained spread, and handled post-incident reviews.",
    },
    {
      label: "Automation wins",
      detail: "Connect Parapet or scripting projects to measurable response-time reductions.",
    },
    {
      label: "Executive comms",
      detail: "Practice briefing Cisco leadership on risk, mitigations, and next-step ownership.",
    },
  ],
  weights: { technical: 60, behavioral: 40 },
  focusSummary:
    "Lead with the incident timeline, quantify containment impact, and close with a clear recommendation a Cisco stakeholder could execute immediately.",
  persona: {
    id: "cisco-soc",
    name: "Aisha Rahman",
    title: "Security Operations Lead · Cisco",
    voiceLabel: "Security Coach · ElevenLabs",
    voiceBadge: "Calm, exacting, SOC-tier scrutiny",
    opener:
      "I’m treating this like a Cisco escalations review—expect probing questions on your containment choices and handoff notes.",
    reasons: [
      "Mirrors Cisco’s incident review cadence: direct, data-driven, and time-boxed.",
      "Pushes you to map DailyCTF and Parapet learnings to enterprise threat surfaces.",
      "Keeps follow-ups anchored in MTTR, containment metrics, and stakeholder alignment.",
    ],
  },
  questionPreview: [
    {
      prompt: "Walk me through the highest-severity alert you contained in the last six months. How did you triage and escalate?",
      focus: "Incident narrative",
    },
    {
      prompt:
        "Explain how Parapet, or a similar tool you built, changed the way your team detects or responds to threats. Quantify the impact.",
      focus: "Automation impact",
    },
    {
      prompt:
        "A Cisco VP joins the bridge midway through the incident. In 45 seconds, brief them on status, risk, and what you need.",
      focus: "Executive clarity",
    },
  ],
}

interface HomePageProps {
  HeroComponent?: (props: HeroProps) => JSX.Element
}

export default function HomePage({ HeroComponent = Hero }: HomePageProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null)
  const [jobDescriptionInput, setJobDescriptionInput] = useState("")
  const [jobDescriptionSource, setJobDescriptionSource] = useState<string>("")
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showCalibrating, setShowCalibrating] = useState(false)

  useEffect(() => {
    if (analysisComplete) {
      const briefSection = document.getElementById("interview-brief")
      briefSection?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [analysisComplete])

  const handleResumeUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setResumeFile(file)
    if (file) {
      setUploadedResumeName(file.name)
    }
  }, [])

  const handleUsePracticePack = useCallback(() => {
    setResumeFile(null)
    setUploadedResumeName(SAMPLE_RESUME_NAME)
    setJobDescriptionInput(SAMPLE_JOB_DESCRIPTION)
    setAnalysisComplete(false)
    setJobDescriptionSource("")
  }, [])

  const handleAnalyzeMaterials = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isAnalyzing) {
        return
      }
      const resolvedResumeName = resumeFile?.name ?? uploadedResumeName ?? SAMPLE_RESUME_NAME
      const resolvedJobDescription = jobDescriptionInput.trim() || SAMPLE_JOB_DESCRIPTION

      setUploadedResumeName(resolvedResumeName)
      setJobDescriptionSource(resolvedJobDescription)
      setIsAnalyzing(true)
      setAnalysisComplete(false)
      setShowCalibrating(true)

      window.setTimeout(() => {
        setIsAnalyzing(false)
        setAnalysisComplete(true)
        setShowCalibrating(false)
      }, 1400)
    },
    [isAnalyzing, jobDescriptionInput, resumeFile, uploadedResumeName],
  )

  const handleScrollToIntake = useCallback(() => {
    const section = document.getElementById("intake-form")
    section?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const effectiveResumeName = uploadedResumeName ?? (analysisComplete ? SAMPLE_RESUME_NAME : undefined)

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      {showCalibrating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1A1A1A]/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#EDE5E0] bg-white/90 px-10 py-12 shadow-[0_28px_80px_-50px_rgba(26,26,26,0.6)]">
            <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-[#E5D7D0] border-t-[#FF7A70]" />
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Gemini</p>
              <h2 className="text-lg font-semibold tracking-tight text-[#1A1A1A]">Preparing your interview</h2>
              <p className="text-sm text-[#75665E]">We’re aligning your materials with the Coach Card focus areas.</p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[#EDE5E0] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#E0D6CF] bg-white/80 shadow-[0_10px_20px_-16px_rgba(26,26,26,0.45)]">
              <Image
                src="/mockly-head.svg"
                alt="Mockly mascot"
                width={44}
                height={44}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-[#1A1A1A]">Mockly</span>
              <span className="text-xs text-[#777777]">Your AI interview coach</span>
            </div>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <ProgressBar currentStep={1} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-[#777777]">
              <span className="uppercase tracking-[0.2em] text-[#B7A89F]">Powered by</span>
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">Gemini</span>
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 space-y-28 pb-20 transition-opacity duration-500 md:pb-28 ${
          showCalibrating ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto max-w-screen-lg px-6 pt-20 md:px-8 md:pt-24">
          <HeroComponent onAnalyzeClick={handleScrollToIntake} />
        </div>

        <section
          id="intake-form"
          className={`${cardClass} relative isolate mx-auto max-w-4xl px-8 py-12 md:px-12 md:py-14 animate-fade-up`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#FF7A70]/5 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
              Step 1
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1A1A1A] md:text-4xl">
              Upload your materials
            </h2>
            <p className="font-body text-base font-medium leading-relaxed text-[#444444]">
              Mockly calibrates every interview to the resume you provide and the job description you’re targeting. Gemini
              analyzes both so the Coach Card is ready before you enter the room.
            </p>
          </div>

          <form className="relative mt-8 space-y-8" onSubmit={handleAnalyzeMaterials}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-3 rounded-2xl border border-[#EDE5E0] bg-white px-5 py-5 text-sm text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Resume (.pdf)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="rounded-lg border border-[#E3D8D2] bg-[#F9F3EF] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#B9AAA1] file:mr-4 file:rounded-md file:border-0 file:bg-white/90 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A70] focus:ring-offset-2 focus:ring-offset-white"
                />
                <span className="text-xs font-medium text-[#777777]">
                  {resumeFile?.name ?? uploadedResumeName ?? "No file selected yet."}
                </span>
              </label>

              <label className="flex flex-col gap-3 rounded-2xl border border-[#EDE5E0] bg-white px-5 py-5 text-sm text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Job description</span>
                <textarea
                  rows={8}
                  value={jobDescriptionInput}
                  onChange={(event) => setJobDescriptionInput(event.target.value)}
                  placeholder="Paste the Cisco Security Consulting Engineer Intern posting here…"
                  className="rounded-lg border border-[#E3D8D2] bg-[#F9F3EF] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#B9AAA1] focus:outline-none focus:ring-2 focus:ring-[#FF7A70] focus:ring-offset-2 focus:ring-offset-white"
                />
                <span className="text-xs font-medium text-[#777777]">
                  Paste a full posting or include a link with key responsibilities.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" className={primaryCtaClass} disabled={isAnalyzing}>
                {isAnalyzing ? "Analyzing…" : "Analyze with Gemini"}
              </Button>
              <Button type="button" variant="outline" className={outlineButtonClass} onClick={handleUsePracticePack}>
                Use practice pack
              </Button>
              <span className="font-body text-sm font-medium text-[#777777]">
                {analysisComplete
                  ? `Interview brief ready for ${effectiveResumeName ?? SAMPLE_RESUME_NAME}.`
                  : isAnalyzing
                    ? "Preparing your interview plan…"
                    : "Uploads stay private to this session."}
              </span>
            </div>
          </form>
        </section>

        <section id="interview-brief" className="mx-auto max-w-screen-lg px-6 md:px-8">
          <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-b from-white/90 to-white/70 px-8 py-12 shadow-[0_2px_24px_rgba(0,0,0,0.05)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-12 top-10 h-40 w-40 rounded-full bg-[#FF7A70]/5 blur-3xl" />
              <div className="absolute right-16 bottom-12 h-48 w-48 rounded-full bg-[#FF7A70]/5 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F] animate-fade-up">
                Step 2
              </span>
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-[#FFF0EA] px-4 py-1 text-sm font-semibold text-[#7A6C64] animate-fade-up"
                style={{ animationDelay: "0.05s" }}
              >
                <Sparkles className="h-4 w-4 text-[#FF7A70]" /> AI interview brief
              </div>
              <h2
                className="font-display text-3xl font-semibold tracking-tight text-[#1A1A1A] animate-fade-up md:text-4xl"
                style={{ animationDelay: "0.1s" }}
              >
                What Gemini prepared for you
              </h2>
              <p
                className="max-w-3xl font-body text-base font-medium leading-relaxed text-[#444444] animate-fade-up md:text-lg"
                style={{ animationDelay: "0.2s" }}
              >
                Gemini reviews your resume, reads the job description, and scripts the first moments of the conversation. When you
                enter the mock room, the interviewer, agenda, and Coach Card scoring pillars are already aligned.
              </p>
            </div>
          </div>
        </section>

        {analysisComplete ? (
          <div className="mx-auto grid max-w-screen-lg gap-10 px-6 md:px-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <div className="space-y-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <FileText className="h-4 w-4 text-[#FF7A70]" /> Resume intake
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-[#1A1A1A]">
                  {intakeSummary.resume.headline}
                </h3>
                <p className="mt-3 font-body text-sm font-medium leading-relaxed text-[#444444]">
                  {intakeSummary.resume.summary}
                </p>
                {effectiveResumeName && (
                  <div className="mt-4 rounded-2xl border border-[#EDE5E0] bg-[#FFF2ED] px-4 py-2 text-xs font-medium text-[#777777]">
                    Analyzed file: <span className="text-[#1A1A1A]">{effectiveResumeName}</span>
                  </div>
                )}
                <ul className="mt-4 space-y-2 font-body text-sm font-medium text-[#444444]">
                  {intakeSummary.resume.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <Link2 className="h-4 w-4 text-[#FF7A70]" /> Job description intake
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-[#1A1A1A]">
                  {intakeSummary.job.company} · {intakeSummary.job.role}
                </h3>
                <p className="mt-3 font-body text-sm font-medium leading-relaxed text-[#444444]">
                  {intakeSummary.job.summary}
                </p>
                <ul className="mt-4 space-y-2 font-body text-sm font-medium text-[#444444]">
                  {intakeSummary.job.signals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
                {jobDescriptionSource && (
                  <div className="mt-4 rounded-2xl border border-[#EDE5E0] bg-white/95 px-4 py-3 text-xs font-medium text-[#777777]">
                    <p className="font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">JD excerpt</p>
                    <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-body text-sm font-medium leading-relaxed text-[#444444]">
                      {jobDescriptionSource}
                    </p>
                  </div>
                )}
              </div>

              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <Target className="h-4 w-4 text-[#FF7A70]" /> Gemini brief
                </div>
                <p className="mt-4 font-body text-sm font-medium leading-relaxed text-[#444444]">
                  {intakeSummary.focusSummary}
                </p>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#8F7A6F]">
                      <span>Technical depth</span>
                      <span>{intakeSummary.weights.technical}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3E9E3]">
                      <div
                        className="h-full rounded-full bg-[#FF7A70]"
                        style={{ width: `${intakeSummary.weights.technical}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#8F7A6F]">
                      <span>Behavioral stories</span>
                      <span>{intakeSummary.weights.behavioral}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3E9E3]">
                      <div
                        className="h-full rounded-full bg-[#C89A6A]"
                        style={{ width: `${intakeSummary.weights.behavioral}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {intakeSummary.focusAreas.map((area) => (
                    <div
                      key={area.label}
                      className="rounded-2xl border border-[#E4D6CE] bg-[#F9F2ED] px-4 py-3 font-body text-sm font-medium text-[#444444]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8F7A6F]">{area.label}</p>
                      <p className="mt-2">{area.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <BarChart3 className="h-4 w-4 text-[#FF7A70]" /> First prompts Gemini drafted
                </div>
                <ul className="mt-4 space-y-4">
                  {intakeSummary.questionPreview.map((question, index) => (
                    <li key={question.prompt} className="rounded-2xl border border-[#E4D6CE] bg-white/85 p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#8F7A6F]">
                        <span>Q{index + 1}</span>
                        <span className="text-[#7A6C64]">{question.focus}</span>
                      </div>
                      <p className="mt-2 font-body text-sm font-medium leading-relaxed text-[#444444]">{question.prompt}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="space-y-8 animate-fade-up" style={{ animationDelay: "0.25s" }}>
              <div className={`${cardClass} p-6 md:p-8`}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <MicVocal className="h-4 w-4 text-[#FF7A70]" /> Recommended interviewer
                </div>
                <h3 className="mt-4 font-display text-3xl font-semibold text-[#1A1A1A]">
                  {intakeSummary.persona.name}
                </h3>
                <p className="font-body text-sm font-medium text-[#444444]">{intakeSummary.persona.title}</p>
                <div className="mt-4 rounded-2xl border border-[#E4D6CE] bg-[#F9F2ED] p-4 font-body text-sm font-medium text-[#444444]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Voice persona</p>
                  <p className="mt-2 font-semibold text-[#1A1A1A]">{intakeSummary.persona.voiceLabel}</p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#7A6C64]">
                    {intakeSummary.persona.voiceBadge}
                  </span>
                </div>
                <p className="mt-4 font-body text-sm font-medium leading-relaxed text-[#444444]">
                  {intakeSummary.persona.opener}
                </p>
                <div className="mt-4 space-y-3 font-body text-sm font-medium text-[#444444]">
                  {intakeSummary.persona.reasons.map((reason) => (
                    <div key={reason} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div
            className={`${cardClass} mx-auto max-w-4xl px-8 py-12 text-center font-body text-sm font-medium text-[#444444] md:px-12 animate-fade-up`}
          >
            Upload a resume PDF and the job description you’re targeting, then select{" "}
            <span className="font-semibold text-[#1A1A1A]">Analyze with Gemini</span> to generate your personalized interview
            brief.
          </div>
        )}

        <section className="mx-auto max-w-screen-lg px-6 pb-24 md:px-8">
          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex flex-col items-start gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
              Step 3
            </span>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1A1A1A] md:text-4xl">
                Enter the mock room
              </h2>
              <p className="max-w-2xl font-body text-base font-medium leading-relaxed text-[#444444]">
              Your interviewer, agenda, and scoring pillars are ready. Step into the room when you’re prepared to speak and
              receive a Coach Card moments after you finish.
            </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button
              asChild
              size="lg"
              disabled={!analysisComplete}
              className={stepActionButtonClass}
            >
              <Link href={`/setup?recommended=${intakeSummary.persona.id}`} className="inline-flex items-center gap-2">
                Enter mock interview
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            {!analysisComplete && (
              <span className="font-body text-sm font-medium text-[#777777]">
                Upload your materials above to activate the mock room.
              </span>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
