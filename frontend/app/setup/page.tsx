"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BrainCircuit,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  LucideIcon,
  MicVocal,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ProgressBar } from "@/components/progress-bar"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { InterviewPlan, InterviewSetupPayload } from "@/lib/gemini"
import { SETUP_CACHE_KEY, PLAN_CACHE_KEY } from "@/lib/cache-keys"

type FocusAreaId =
  | "leadership"
  | "adaptability"
  | "teamwork"
  | "timeManagement"
  | "systemDesign"
  | "productThinking"
  | "communication"

const personaPresets = [
  {
    id: "google-swe",
    company: "Google",
    role: "Software Engineering Intern",
    tagline: "Technical mentor persona leaning on your project impact and debugging process.",
    recommendedFocusAreas: ["leadership", "systemDesign", "communication"] as FocusAreaId[],
    recommendedWeight: 70,
    voiceStyle: "Tech Mentor · ElevenLabs",
    voiceBadge: "Steady & encouraging",
    highlights: [
      "Dives into your robotics and hackathon projects",
      "Expects metrics on performance and teamwork",
      "Pushes system design fundamentals with follow-ups",
    ],
    jdSignals: ["Collaborative problem solving", "Impact metrics", "System scale awareness"],
  },
  {
    id: "amazon-pm",
    company: "Amazon",
    role: "Product Manager Intern",
    tagline: "Leadership-principles coach drawing out customer obsession stories.",
    recommendedFocusAreas: ["leadership", "productThinking", "communication"] as FocusAreaId[],
    recommendedWeight: 45,
    voiceStyle: "Product Coach · ElevenLabs",
    voiceBadge: "High energy & direct",
    highlights: [
      "Frames questions around ownership and LPs",
      "Challenges you to quantify impact to customers",
      "Explores stakeholder management scenarios",
    ],
    jdSignals: ["Customer obsession", "Bias for action", "Cross-functional collaboration"],
  },
] as const

const additionalPersonas = [
  {
    id: "meta-data",
    company: "Meta",
    role: "Data Analyst Intern",
    tagline: "Insights-driven analyst probing for storytelling with metrics and experimentation.",
    recommendedFocusAreas: ["communication", "productThinking", "adaptability"] as FocusAreaId[],
    recommendedWeight: 40,
    voiceStyle: "Head of Analytics · ElevenLabs",
    voiceBadge: "Curious & data-obsessed",
    highlights: [
      "Challenges you to explain dashboards with business narrative",
      "Pushes for statistical rigor and experiment design",
      "Connects metrics to product strategy and stakeholders",
    ],
    jdSignals: ["Data visualization clarity", "Experimentation mindset", "Cross-team influence"],
  },
  {
    id: "microsoft-cs",
    company: "Microsoft",
    role: "Customer Success Intern",
    tagline: "Customer-centric coach focusing on empathy, onboarding, and impact stories.",
    recommendedFocusAreas: ["communication", "teamwork", "timeManagement"] as FocusAreaId[],
    recommendedWeight: 25,
    voiceStyle: "Success Coach · ElevenLabs",
    voiceBadge: "Empathetic & structured",
    highlights: [
      "Guides you to articulate customer empathy and journey mapping",
      "Examines how you balance multiple accounts and deadlines",
      "Looks for playbooks to handle blockers and escalations",
    ],
    jdSignals: ["Customer advocacy", "Stakeholder coordination", "Process improvement"],
  },
] as const

const allPersonas = [...personaPresets, ...additionalPersonas] as const

const focusAreaOptions: Array<{ id: FocusAreaId; label: string; icon: LucideIcon; blurb: string }> = [
  {
    id: "leadership",
    label: "Leadership Moments",
    icon: Sparkles,
    blurb: "Guide the conversation toward how you rallied a team.",
  },
  {
    id: "adaptability",
    label: "Adaptability & Ambiguity",
    icon: Wand2,
    blurb: "Spotlight times you navigated unclear requirements.",
  },
  {
    id: "teamwork",
    label: "Team Collaboration",
    icon: Building2,
    blurb: "Showcase cross-functional wins and communication.",
  },
  {
    id: "timeManagement",
    label: "Time Management",
    icon: Clock,
    blurb: "Explain how you juggle deadlines without dropping quality.",
  },
  {
    id: "systemDesign",
    label: "System Design",
    icon: BrainCircuit,
    blurb: "Practice architecture thinking for intern-level interviews.",
  },
  {
    id: "productThinking",
    label: "Product Thinking",
    icon: Target,
    blurb: "Explore trade-offs and customer impact decisions.",
  },
  {
    id: "communication",
    label: "Communication Clarity",
    icon: MicVocal,
    blurb: "Tighten storytelling and STAR explanations.",
  },
]

const voiceStyles = [
  {
    id: "mentor",
    label: "Mentor · Calm guidance",
    description: "Measured pace, warm tone. Great for easing nerves before day-of interview.",
    elevelabsTag: "Avery (ElevenLabs)",
  },
  {
    id: "recruiter",
    label: "Recruiter · Energetic",
    description: "Upbeat, keeps momentum high to mirror real phone-screens.",
    elevelabsTag: "Josh (ElevenLabs)",
  },
  {
    id: "principal",
    label: "Principal Engineer · Direct",
    description: "Fast-paced and analytical, tests your confidence under pressure.",
    elevelabsTag: "Cam (ElevenLabs)",
  },
] as const

const gradientClass =
  "bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] text-white shadow-lg shadow-primary/40 animate-gradient"

export default function SetupPage() {
  const router = useRouter()
  const [selectedPersonaId, setSelectedPersonaId] = useState<typeof allPersonas[number]["id"]>(allPersonas[0].id)
  const [technicalWeight, setTechnicalWeight] = useState([allPersonas[0].recommendedWeight])
  const [duration, setDuration] = useState<"short" | "standard">("standard")
  const [voiceStyle, setVoiceStyle] = useState<typeof voiceStyles[number]["id"]>(voiceStyles[0].id)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [focusAreas, setFocusAreas] = useState<Record<FocusAreaId, boolean>>(() => {
    const defaultPersona = allPersonas[0]
    return focusAreaOptions.reduce((acc, option) => {
      acc[option.id] = defaultPersona.recommendedFocusAreas.includes(option.id)
      return acc
    }, {} as Record<FocusAreaId, boolean>)
  })

  const selectedPersona = useMemo(
    () => allPersonas.find((persona) => persona.id === selectedPersonaId) ?? allPersonas[0],
    [selectedPersonaId],
  )

  const personaCarouselRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = personaCarouselRef.current
    if (!el) return

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const tolerance = 4

    setCanScrollLeft(el.scrollLeft > tolerance)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - tolerance)
  }, [])

  useEffect(() => {
    const el = personaCarouselRef.current
    if (!el) return

    const handleScroll = () => updateScrollState()
    updateScrollState()

    el.addEventListener("scroll", handleScroll, { passive: true })

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateScrollState())
      resizeObserver.observe(el)
    } else {
      window.addEventListener("resize", updateScrollState)
      window.addEventListener("orientationchange", updateScrollState)
    }

    return () => {
      el.removeEventListener("scroll", handleScroll)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener("resize", updateScrollState)
        window.removeEventListener("orientationchange", updateScrollState)
      }
    }
  }, [updateScrollState])

  useEffect(() => {
    updateScrollState()
  }, [selectedPersonaId, updateScrollState])

  const scrollCarousel = (direction: "left" | "right") => {
    const el = personaCarouselRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.7
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
  }

  const toggleFocusArea = (id: FocusAreaId) => {
    setFocusAreas((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handlePersonaSelect = (id: typeof allPersonas[number]["id"]) => {
    setSelectedPersonaId(id)
    const persona = allPersonas.find((p) => p.id === id)
    if (persona) {
      setTechnicalWeight([persona.recommendedWeight])
      setVoiceStyle(voiceStyles[0].id)
      setFocusAreas(
        focusAreaOptions.reduce((acc, option) => {
          acc[option.id] = persona.recommendedFocusAreas.includes(option.id)
          return acc
        }, {} as Record<FocusAreaId, boolean>),
      )
    }

    requestAnimationFrame(() => {
      const el = personaCarouselRef.current
      if (!el) return
      const activeCard = el.querySelector<HTMLButtonElement>(`[data-persona="${id}"]`)
      activeCard?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
      updateScrollState()
    })
  }

  const activeVoice = voiceStyles.find((voice) => voice.id === voiceStyle) ?? voiceStyles[0]
  const technicalPercent = technicalWeight[0]
  const behavioralPercent = 100 - technicalPercent
  const selectedFocusAreaIds = useMemo(() => {
    const picks = focusAreaOptions.filter((area) => focusAreas[area.id]).map((area) => area.id)
    if (picks.length > 0) {
      return picks
    }
    return selectedPersona.recommendedFocusAreas as FocusAreaId[]
  }, [focusAreas, selectedPersona.recommendedFocusAreas])

  const handleStartMock = useCallback(async () => {
    if (isStarting) {
      return
    }

    const payload: InterviewSetupPayload = {
      persona: {
        personaId: selectedPersona.id,
        company: selectedPersona.company,
        role: selectedPersona.role,
        focusAreas: selectedFocusAreaIds,
        voiceStyle: activeVoice.label,
        technicalWeight: technicalPercent,
        duration,
        additionalContext: selectedPersona.tagline,
      },
    }

    setIsStarting(true)
    setStartError(null)

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(SETUP_CACHE_KEY, JSON.stringify(payload))
      } catch (error) {
        console.error("Failed to persist setup payload", error)
      }
    }

    try {
      const response = await fetch("/api/generate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => "")
        throw new Error(message || "Gemini could not shape the interview.")
      }

      const data = await response.json().catch(() => null) as { success?: boolean; plan?: unknown; error?: string } | null
      if (!data?.success || !data.plan) {
        throw new Error(data?.error ?? "Gemini returned an incomplete interview plan.")
      }

      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            PLAN_CACHE_KEY,
            JSON.stringify({ ...(data.plan as InterviewPlan), cachePersonaId: payload.persona.personaId, cachedAt: Date.now() }),
          )
        } catch (error) {
          console.warn("Failed to cache interview plan", error)
        }
      }

      router.push("/mock")
    } catch (error) {
      console.error("Failed to prepare interview plan", error)
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Gemini is busy. Try again in a few seconds."
      setStartError(message)
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(PLAN_CACHE_KEY)
      }
    } finally {
      setIsStarting(false)
    }
  }, [
    selectedPersona.id,
    selectedPersona.company,
    selectedPersona.role,
    selectedPersona.tagline,
    selectedFocusAreaIds,
    activeVoice.label,
    technicalPercent,
    duration,
    router,
    isStarting,
  ])

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(79,97,255,0.45),_rgba(12,15,25,0.95))] text-white">
      <header className="border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4b6bff] via-[#805dff] to-[#a855f7] flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="text-white font-semibold text-sm">MI</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight">Mock Interviewer</span>
              <span className="text-xs text-white/60">Step 2 · Powered by Gemini</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <ProgressBar currentStep={2} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <span className="uppercase tracking-[0.2em] text-white/40">Voice</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="space-y-10 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-semibold text-white shadow-sm shadow-[#4f61ff]/30">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Gemini is shaping your interviewer
              </div>
              <h1 className="text-4xl font-semibold tracking-tight leading-tight">
                Customize the vibe, depth, and voice before you hop into the hot seat.
              </h1>
              <p className="text-lg text-white/70 max-w-2xl">
                Pick the company persona, balance technical vs. behavioral, and let Gemini build a script that mirrors the
                interviews you’re walking into.
              </p>
            </div>

            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select a persona</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-white/50">Swipe through presets</span>
              </div>
              <div className="relative">
                <div
                  ref={personaCarouselRef}
                  className={cn(
                    "flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth persona-carousel persona-carousel-mask",
                    "px-4 sm:px-6",
                  )}
                >
                  {allPersonas.map((preset) => {
                    const active = preset.id === selectedPersonaId
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        data-persona={preset.id}
                        onClick={() => handlePersonaSelect(preset.id)}
                        className={cn(
                          "min-w-[280px] snap-center rounded-2xl border px-5 py-6 text-left transition-all",
                          "cursor-pointer hover:shadow-lg hover:ring hover:ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                          active
                            ? "border-transparent bg-gradient-to-br from-[#262a35] to-[#1a1e2b] ring-2 ring-primary shadow-md"
                            : "border-white/10 bg-white/5 hover:border-[#4f61ff]/60 hover:bg-white/10",
                        )}
                      >
                        <div className="flex flex-col gap-4">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center text-xs font-semibold rounded-full border border-gray-300/20 bg-gray-100/10 px-2 py-1 text-white/70",
                              active && "border-primary/40 bg-primary/15 text-white",
                            )}
                          >
                            {active ? "Selected" : "Preview"}
                          </span>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                              {preset.company}
                            </p>
                            <h3 className="text-xl font-semibold leading-snug text-white">{preset.role}</h3>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">{preset.tagline}</p>
                          <ul className="space-y-2 text-sm text-white/70">
                            {preset.highlights.map((highlight) => (
                              <li key={highlight} className="flex items-start gap-2">
                                <Sparkles className="mt-0.5 h-4 w-4 text-[#9aa7ff]" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  className={cn(
                    "absolute -left-10 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white shadow-lg transition hover:bg-white/20 sm:flex",
                    !canScrollLeft && "opacity-40 pointer-events-none",
                  )}
                  aria-label="Scroll to previous persona"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  className={cn(
                    "absolute -right-10 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white shadow-lg transition hover:bg-white/20 sm:flex",
                    !canScrollRight && "opacity-40 pointer-events-none",
                  )}
                  aria-label="Scroll to next persona"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </section>

            <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/30">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Question mix</h2>
                <p className="text-sm text-white/70">
                  Gemini balances technical depth with behavioral storytelling—adjust to match the interview stage.
                </p>
              </div>

              <div className="relative mt-2 h-8">
                <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-[#eef1ff]" />
                <div
                  className="absolute inset-y-2 left-0 rounded-full bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] shadow-md shadow-primary/20"
                  style={{ width: `${technicalPercent}%` }}
                />
                <Slider
                  value={technicalWeight}
                  onValueChange={setTechnicalWeight}
                  max={100}
                  step={1}
                  className="relative z-10 h-full w-full"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Technical</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-white">{technicalPercent}%</span>
                    <span className="text-sm text-white/60">coding, debugging, architecture</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Behavioral</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-white">{behavioralPercent}%</span>
                    <span className="text-sm text-white/60">storytelling, teamwork, leadership</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Emphasize these stories</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Gemini will anchor to your resume
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {focusAreaOptions.map((area) => {
                  const active = focusAreas[area.id]
                  const Icon = area.icon
                  return (
                    <label
                      key={area.id}
                      htmlFor={`focus-${area.id}`}
                      className={`flex h-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        active
                          ? "border-[#4f61ff] bg-white/10 shadow-md shadow-[#4f61ff]/25 ring-1 ring-[#4f61ff]/40"
                          : "border-white/10 bg-white/5 hover:border-[#4f61ff]/60 hover:bg-white/10 hover:shadow-md hover:shadow-[#4f61ff]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              active
                            ? "bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] text-white"
                            : "bg-white/10 text-[#9aa7ff]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{area.label}</p>
                            <p className="text-xs text-white/60">{area.blurb}</p>
                          </div>
                        </div>
                        <Checkbox
                          id={`focus-${area.id}`}
                          checked={active}
                          onCheckedChange={() => toggleFocusArea(area.id)}
                        />
                      </div>
                    </label>
                  )
                })}
              </div>
            </section>

            <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/30">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Pick your interviewer voice</h2>
                <p className="text-sm text-white/70">
                  ElevenLabs will synthesize the vibe—switch based on how intense you want the session to feel.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {voiceStyles.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => setVoiceStyle(voice.id)}
                    className={cn(
                      "flex h-full flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f61ff] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                      voiceStyle === voice.id
                        ? "border-[#4f61ff] bg-white/10 shadow-md shadow-[#4f61ff]/20 ring-1 ring-[#4f61ff]/40"
                        : "border-white/10 bg-white/5 hover:border-[#4f61ff]/60 hover:bg-white/10 hover:shadow-md hover:shadow-[#4f61ff]/20",
                    )}
                  >
                    <div>
                      <p className="font-semibold leading-tight text-white">{voice.label}</p>
                      <p className="mt-2 text-sm text-white/70">{voice.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#9aa7ff]">{voice.elevelabsTag}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {[
                { id: "short", label: "Quick Warm-Up", subtitle: "3 minutes • 3-4 questions", durationLabel: "short" },
                {
                  id: "standard",
                  label: "Full Run-Through",
                  subtitle: "6 minutes • 5-6 questions",
                  durationLabel: "standard",
                },
              ].map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setDuration(block.durationLabel as typeof duration)}
                  className={cn(
                    "flex h-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f61ff] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                    duration === block.durationLabel
                      ? "border-[#4f61ff] bg-white/10 shadow-md shadow-[#4f61ff]/20 ring-1 ring-[#4f61ff]/40"
                      : "border-white/10 bg-white/5 hover:border-[#4f61ff]/60 hover:bg-white/10 hover:shadow-md hover:shadow-[#4f61ff]/20",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        duration === block.durationLabel
                          ? "bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] text-white"
                          : "bg-white/10 text-[#9aa7ff]"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{block.label}</p>
                      <p className="text-sm text-white/70">{block.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-white/60">
                    {duration === block.durationLabel ? "Selected" : "Tap to switch"}
                  </span>
                </button>
              ))}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <Link href="/">
                <Button variant="outline" size="lg">
                  Back
                </Button>
              </Link>
              <Button
                type="button"
                onClick={handleStartMock}
                size="lg"
                disabled={isStarting}
                className={cn(
                  "px-8 py-6 rounded-full font-semibold tracking-tight transition-transform duration-300 focus-visible:scale-[1.02]",
                  gradientClass,
                  isStarting ? "opacity-90 pointer-events-none" : "hover:scale-[1.03]",
                )}
              >
                {isStarting ? (
                  <span className="flex items-center gap-2 text-base">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Prepping your interviewer…
                  </span>
                ) : (
                  <>
                    Start mock interview
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              {startError && (
                <p className="text-sm text-amber-300">{startError}</p>
              )}
            </div>
          </div>

          <aside className="relative isolate animate-slide-up delay-150 lg:sticky lg:top-28 lg:self-start">
            <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#4f61ff]/30 blur-3xl" aria-hidden />
            <div className="absolute -bottom-14 -left-6 h-40 w-40 rounded-full bg-[#38bdf8]/25 blur-3xl" aria-hidden />
            <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[#141c2f]/90 p-7 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live Gemini Preview
                </span>
                <span className="text-xs font-semibold text-white/60">Realtime updates</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">Interview Persona</p>
                  <h3 className="text-2xl font-semibold mt-1">
                    {selectedPersona.company} · {selectedPersona.role}
                  </h3>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">{selectedPersona.tagline}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <MicVocal className="h-4 w-4 text-[#9aa7ff]" />
                    <p className="text-sm font-semibold text-white">{selectedPersona.voiceStyle}</p>
                  </div>
                  <p className="mt-2 text-xs text-white/60">{selectedPersona.voiceBadge}</p>
                  <p className="mt-3 text-xs font-semibold text-[#9aa7ff]">
                    Voice Selection: {activeVoice.label} · {activeVoice.elevelabsTag}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                    Interview cues
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/70">
                    {selectedPersona.jdSignals.map((signal) => (
                      <li key={signal} className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-[#4b6bff] mt-0.5" />
                        <span>{signal}</span>
                      </li>
                    ))}
                    {selectedPersona.id === "amazon-pm" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#f59e0b] mt-0.5" />
                        <span>Lean on STAR stories tied to Amazon Leadership Principles.</span>
                      </li>
                    )}
                    {selectedPersona.id === "google-swe" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#4b6bff] mt-0.5" />
                        <span>Outline your debugging approach step-by-step before diving into code.</span>
                      </li>
                    )}
                    {selectedPersona.id === "meta-data" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#a855f7] mt-0.5" />
                        <span>Explain the why behind metrics and tie insights back to product decisions.</span>
                      </li>
                    )}
                    {selectedPersona.id === "microsoft-cs" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#34d399] mt-0.5" />
                        <span>Walk through how you escalated customer issues and communicated resolutions.</span>
                      </li>
                    )}
                  </ul>
                </div>

              </div>

              <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-semibold uppercase tracking-[0.25em] text-white/60">Session summary</p>
                <div className="mt-3 grid gap-2 text-white/70">
                  <span>• {technicalPercent}% technical · {behavioralPercent}% behavioral</span>
                  <span>
                    • Focus:{" "}
                    {focusAreaOptions
                      .filter((area) => focusAreas[area.id])
                      .map((area) => area.label)
                      .join(", ") || "Customize your focus"}
                  </span>
                  <span>• Duration: {duration === "short" ? "Quick warm-up" : "Full run-through"}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
