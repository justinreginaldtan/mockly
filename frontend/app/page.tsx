"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Link2,
  MicVocal,
  Sparkles,
  Target,
} from "lucide-react"
import Link from "next/link"
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

const primaryButtonClass =
  "bg-[#0f172a] text-white shadow-sm transition-transform duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f172a] focus-visible:ring-offset-white"

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
    { label: "Incident response", detail: "Show how you scoped blast radius, contained spread, and handled post-incident reviews." },
    { label: "Automation wins", detail: "Connect Parapet or scripting projects to measurable response-time reductions." },
    { label: "Executive comms", detail: "Practice briefing Cisco leadership on risk, mitigations, and next-step ownership." },
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
      prompt:
        "Walk me through the highest-severity alert you handled this semester. What let you detect it quickly, and how did you brief leadership?",
      focus: "Incident response · Executive comms",
    },
    {
      prompt: "Tell me how Parapet exposed a weakness in an AI system. What mitigation plan did you drive afterward?",
      focus: "Automation wins · Risk mitigation",
    },
  ],
}

export default function UploadPage() {
  const [showCalibrating, setShowCalibrating] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null)
  const [jobDescriptionInput, setJobDescriptionInput] = useState("")
  const [jobDescriptionSource, setJobDescriptionSource] = useState<string>("")
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

  const handlePrefillSample = useCallback(() => {
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff7ab6] via-[#7f6bff] to-[#3ac6ff] flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="text-white font-semibold text-sm">MK</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight">Mockly</span>
              <span className="text-xs text-white/60">Your AI interview coach</span>
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
        className={`flex-1 container mx-auto px-6 py-16 flex flex-col transition-opacity duration-500 ${
          showCalibrating ? "opacity-0" : "opacity-100"
        }`}
      >
        <section className="max-w-3xl mx-auto text-center space-y-6 animate-slide-up">
          <span className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">
            Meet Mockly
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Practice seriously, learn playfully. Mockly listens to your answer and turns it into instant coaching.
          </h1>
          <p className="text-lg text-slate-600">
            Upload a resume and job description, let Gemini shape the scenario, and watch Mockly’s Coach Card show you what worked—and what to tighten—right after you speak.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" className={`${primaryButtonClass} px-8 py-5 rounded-full`} onClick={handleScrollToIntake}>
              Analyze with Gemini
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MicVocal className="h-4 w-4 text-slate-400" />
              <span>Voice-led mock + Coach Card feedback in under two minutes.</span>
            </div>
          </div>
          <ul className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" />
              Calibrated for Justin’s Cisco SOC internship prep—swap in your own materials after the demo.
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" />
              Mockly captures transcripts and grades structure, clarity, and confidence instantly.
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" />
              `?demo=true` keeps the demo offline—no surprises on stage.
            </li>
          </ul>
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Coach Card preview</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">Confidence</span>
                <span className="text-emerald-500">8 / 10</span>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Structure</p>
                <p>Use STAR—call out Situation → Task → Action → Result. Lead with your containment window.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Clarity</p>
                <p>Trim to 60–90 seconds. Keep the incident timeline, automation, and exec takeaway in focus.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Next step</p>
                <p>Open with the measurable outcome before unpacking how Parapet exposed the weakness.</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="intake-form"
          className="max-w-4xl mx-auto space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm animate-slide-up"
        >
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Step 1
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">Upload your resume and paste the Cisco JD</h2>
            <p className="text-sm text-slate-600">
              For the demo we keep everything local. Choose a PDF (or use the sample) and paste the job post. Click
              <span className="font-semibold text-slate-900"> Analyze with Gemini </span>
              to mimic how Gemini would parse these materials before generating your interview plan.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleAnalyzeMaterials}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Resume (.pdf)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700"
                />
                <span className="text-xs text-slate-500">
                  {resumeFile?.name ?? uploadedResumeName ?? "No file selected (sample will be used)"}
                </span>
              </label>

              <label className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Job description</span>
                <textarea
                  rows={8}
                  value={jobDescriptionInput}
                  onChange={(event) => setJobDescriptionInput(event.target.value)}
                  placeholder="Paste the Cisco Security Consulting Engineer Intern posting here…"
                  className="min-h-[160px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                size="lg"
                className={`${primaryButtonClass} px-6 disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing…" : "Analyze with Gemini"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={handlePrefillSample}
              >
                Prefill sample data
              </Button>
              <span className="text-sm text-slate-500">
                {analysisComplete
                  ? `Brief generated for ${effectiveResumeName ?? SAMPLE_RESUME_NAME}.`
                  : isAnalyzing
                    ? "Running simulated parsing…"
                    : "Nothing uploads to a server during this demo."}
              </span>
            </div>
          </form>
        </section>

        <section id="interview-brief" className="space-y-6 animate-slide-up">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Step 2
            </span>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4" /> AI interview brief
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">What Gemini prepped for you</h2>
            <p className="text-lg text-slate-600 max-w-3xl">
              We’ve preloaded the resume and JD you’ll demo with so this screen appears instantly. In a live run, Gemini parses your PDF and job link to produce the same brief before you enter the room.
            </p>
          </div>
        </section>

        {analysisComplete ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <div className="space-y-6 animate-slide-up delay-75">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <FileText className="h-4 w-4 text-slate-500" /> Resume intake
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{intakeSummary.resume.headline}</h3>
                <p className="mt-3 text-sm text-slate-600">{intakeSummary.resume.summary}</p>
                {effectiveResumeName && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                    Analyzed file: <span className="text-slate-900">{effectiveResumeName}</span>
                  </div>
                )}
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {intakeSummary.resume.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <Link2 className="h-4 w-4 text-slate-500" /> Job description intake
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                  {intakeSummary.job.company} · {intakeSummary.job.role}
                </h3>
                <p className="mt-3 text-sm text-slate-600">{intakeSummary.job.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {intakeSummary.job.signals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
                {jobDescriptionSource && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    <p className="font-semibold uppercase tracking-[0.3em] text-slate-500">JD excerpt</p>
                    <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-slate-600">
                      {jobDescriptionSource}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <Target className="h-4 w-4 text-slate-500" /> Gemini brief
                </div>
                <p className="mt-4 text-sm text-slate-600">{intakeSummary.focusSummary}</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>Technical depth</span>
                      <span>{intakeSummary.weights.technical}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#6366f1]"
                        style={{ width: `${intakeSummary.weights.technical}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>Behavioral stories</span>
                      <span>{intakeSummary.weights.behavioral}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#f97316]"
                        style={{ width: `${intakeSummary.weights.behavioral}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {intakeSummary.focusAreas.map((area) => (
                    <div key={area.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{area.label}</p>
                      <p className="mt-2 text-sm text-slate-600">{area.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <BarChart3 className="h-4 w-4 text-slate-500" /> First prompts Gemini drafted
                </div>
                <ul className="mt-4 space-y-4">
                  {intakeSummary.questionPreview.map((question, index) => (
                    <li key={question.prompt} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
                        <span>Q{index + 1}</span>
                        <span className="text-slate-500">{question.focus}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{question.prompt}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="space-y-6 animate-slide-up delay-150">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <MicVocal className="h-4 w-4 text-slate-500" /> Recommended interviewer
                </div>
                <h3 className="mt-4 text-3xl font-semibold text-slate-900">{intakeSummary.persona.name}</h3>
                <p className="text-sm text-slate-600">{intakeSummary.persona.title}</p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Voice persona</p>
                  <p className="mt-2 text-sm text-slate-700">{intakeSummary.persona.voiceLabel}</p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {intakeSummary.persona.voiceBadge}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-600">{intakeSummary.persona.opener}</p>
                <div className="mt-4 space-y-3">
                  {intakeSummary.persona.reasons.map((reason) => (
                    <div key={reason} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm animate-slide-up">
            Upload a resume PDF and paste the Cisco job description above, then click
            <span className="font-semibold text-slate-900"> Analyze with Gemini</span> to generate your personalized interview brief.
          </div>
        )}

        <section className="animate-slide-up delay-100">
          <div className="flex flex-col gap-3 items-start">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Step 3
            </span>
            <h2 className="text-3xl font-semibold text-slate-900">Enter the mock room</h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Mockly already staged your Cisco SOC scenario. Hop into the room to hear the question and get your Coach Card feedback right after you answer.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              disabled={!analysisComplete}
              className={`${primaryButtonClass} px-8 py-6 text-lg rounded-full disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <Link href={`/setup?recommended=${intakeSummary.persona.id}`} className="inline-flex items-center gap-2">
                Enter mock interview
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            {!analysisComplete && (
              <span className="text-sm text-slate-500">Upload your resume and JD above to unlock the mock room.</span>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
