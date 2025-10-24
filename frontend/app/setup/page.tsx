"use client"

import React, { Suspense } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { LoadingState } from "@/components/loading-states"
import EnhancedNavHeader from "@/components/enhanced-nav-header"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { InterviewPlan, InterviewSetupPayload } from "@/lib/gemini"
import { SETUP_CACHE_KEY, PLAN_CACHE_KEY } from "@/lib/cache-keys"
import { resolvePersonaVoice, VOICE_STYLE_OPTIONS } from "@/lib/voices"

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
    id: "google-analyst",
    company: "Google",
    role: "Data Analyst Intern",
    tagline: "Analytical mentor focused on metrics storytelling and experimentation insights.",
    recommendedFocusAreas: ["communication", "productThinking", "adaptability"] as FocusAreaId[],
    recommendedWeight: 40,
    voiceStyle: "Data Coach · ElevenLabs",
    voiceBadge: "Calm & inquisitive",
    highlights: [
      "Dives into how you turn raw data into clear narratives",
      "Explores experiment design and measurement clarity",
      "Coaches you on stakeholder-ready dashboards",
    ],
    jdSignals: ["Analytical rigor", "Experimentation mindset", "Storytelling with metrics"],
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
    id: "meta-swe",
    company: "Meta",
    role: "Software Engineer",
    tagline: "Principal-level mentor drilling into system design trade-offs and leadership signals.",
    recommendedFocusAreas: ["systemDesign", "leadership", "communication"] as FocusAreaId[],
    recommendedWeight: 65,
    voiceStyle: "Principal Engineer · ElevenLabs",
    voiceBadge: "Direct & technical",
    highlights: [
      "Pushes you to articulate scaling strategies and edge cases",
      "Digs into leadership signals from complex launches",
      "Holds you to crisp reasoning under time pressure",
    ],
    jdSignals: ["Distributed systems depth", "Cross-team leadership", "Resolving ambiguity quickly"],
  },
  {
    id: "cisco-soc",
    company: "Cisco",
    role: "Security Operations Intern",
    tagline: "Incident-response coach focused on calm triage, automation, and crisp exec comms.",
    recommendedFocusAreas: ["timeManagement", "leadership", "communication"] as FocusAreaId[],
    recommendedWeight: 60,
    voiceStyle: "Security Coach · ElevenLabs",
    voiceBadge: "Measured & exacting",
    highlights: [
      "Challenges you on containment decisions and timelines",
      "Pushes automation stories that reduce response time",
      "Keeps follow-ups anchored in stakeholder-ready recommendations",
    ],
    jdSignals: ["Incident response", "Automation storytelling", "Executive communication"],
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

const gradientClass =
  "bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF] text-white shadow-lg shadow-[#FF7A70]/40"

function SetupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recommendedPersonaId = searchParams.get("recommended")
  const defaultPersonaId = useMemo(
    () => allPersonas.find((persona) => persona.id === recommendedPersonaId)?.id ?? allPersonas[0].id,
    [recommendedPersonaId],
  )
  const defaultPersona = useMemo(
    () => allPersonas.find((persona) => persona.id === defaultPersonaId) ?? allPersonas[0],
    [defaultPersonaId],
  )

  const [selectedPersonaId, setSelectedPersonaId] = useState<typeof allPersonas[number]["id"]>(defaultPersona.id)
  const [technicalWeight, setTechnicalWeight] = useState([defaultPersona.recommendedWeight])
  const [duration, setDuration] = useState<"short" | "standard">("standard")
  const [voiceStyle, setVoiceStyle] = useState<string>(() => resolvePersonaVoice(defaultPersona.id).styleId)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [previewingPersonaId, setPreviewingPersonaId] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [focusAreas, setFocusAreas] = useState<Record<FocusAreaId, boolean>>(() => {
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
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
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

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

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
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setPreviewingPersonaId(null)
    setPreviewError(null)
    setSelectedPersonaId(id)
    const persona = allPersonas.find((p) => p.id === id)
    if (persona) {
      setTechnicalWeight([persona.recommendedWeight])
      setVoiceStyle(resolvePersonaVoice(persona.id).styleId)
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

  const handlePreviewVoice = useCallback(
    async (personaId: typeof allPersonas[number]["id"]) => {
      if (previewingPersonaId === personaId) {
        if (previewAudioRef.current) {
          previewAudioRef.current.pause()
          previewAudioRef.current = null
        }
        setPreviewingPersonaId(null)
        return
      }

      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }

      setPreviewError(null)
      setPreviewingPersonaId(personaId)

      try {
        const voiceConfig = resolvePersonaVoice(
          personaId,
          personaId === selectedPersona.id ? voiceStyle : undefined,
        )

        const response = await fetch("/api/voice-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personaId,
            voiceStyleId: voiceConfig.styleId,
            preview: true,
            questionText: voiceConfig.previewText,
          }),
        })

        if (!response.ok) {
          const message = await response.text().catch(() => "")
          throw new Error(message || "Unable to generate preview audio.")
        }

        const data = (await response.json()) as { audioUrl?: string; error?: string }
        if (!data?.audioUrl) {
          throw new Error(data?.error ?? "No audio returned from ElevenLabs.")
        }

        const audio = new Audio(data.audioUrl)
        previewAudioRef.current = audio
        audio.play().catch((error) => {
          throw error
        })
        audio.onended = () => {
          if (previewAudioRef.current === audio) {
            previewAudioRef.current = null
          }
          setPreviewingPersonaId((current) => (current === personaId ? null : current))
        }
        audio.onpause = () => {
          if (previewAudioRef.current === audio) {
            previewAudioRef.current = null
          }
          setPreviewingPersonaId((current) => (current === personaId ? null : current))
        }
      } catch (error) {
        console.error("Voice preview failed", error)
        setPreviewingPersonaId(null)
        setPreviewError(
          error instanceof Error && error.message
            ? error.message
            : "Couldn't play that preview. Try again.",
        )
      }
    },
    [previewingPersonaId, selectedPersona.id, voiceStyle],
  )

  const activeVoiceStyle = useMemo(
    () => resolvePersonaVoice(selectedPersona.id, voiceStyle),
    [selectedPersona.id, voiceStyle],
  )
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

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setPreviewingPersonaId(null)

    const payload: InterviewSetupPayload = {
      persona: {
        personaId: selectedPersona.id,
        company: selectedPersona.company,
        role: selectedPersona.role,
        focusAreas: selectedFocusAreaIds,
        voiceStyle: activeVoiceStyle.label,
        voiceStyleId: activeVoiceStyle.styleId,
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
    activeVoiceStyle.label,
    activeVoiceStyle.styleId,
    technicalPercent,
    duration,
    router,
    isStarting,
  ])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      <EnhancedNavHeader />

      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="space-y-12 animate-slide-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-4 py-1 text-sm font-semibold text-[#777777] shadow-sm">
                <Sparkles className="h-4 w-4 text-[#FF7A70]" />
                Gemini is shaping your interviewer
              </div>
              <h1 className="text-4xl font-semibold tracking-tight leading-tight text-[#1A1A1A]">
                Customize the vibe, depth, and voice before you hop into the hot seat.
              </h1>
              <p className="text-lg text-[#777777] max-w-2xl">
                Pick the company persona, balance technical vs. behavioral, and let Gemini build a script that mirrors the
                interviews you’re walking into.
              </p>
            </div>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Select a persona</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-[#777777]">Swipe through presets</span>
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
                          "cursor-pointer hover:shadow-lg hover:ring hover:ring-[#FF7A70]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A70] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                          active
                            ? "border-[#FF7A70] bg-white shadow-md ring-2 ring-[#FF7A70]/20"
                            : "border-[#EDE5E0] bg-white/95 hover:border-[#FF7A70]/60 hover:bg-white",
                        )}
                      >
                        <div className="flex flex-col gap-4">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center text-xs font-semibold rounded-full border px-2 py-1",
                              active 
                                ? "border-[#FF7A70]/40 bg-[#FF7A70]/15 text-[#FF7A70]" 
                                : "border-[#EDE5E0] bg-[#F3F4F6] text-[#777777]",
                            )}
                          >
                            {active ? "Selected" : "Preview"}
                          </span>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#777777]">
                              {preset.company}
                            </p>
                            <h3 className="text-xl font-semibold leading-snug text-[#1A1A1A]">{preset.role}</h3>
                          </div>
                          <p className="text-sm text-[#777777] leading-relaxed">{preset.tagline}</p>
                          <ul className="space-y-2 text-sm text-[#777777]">
                            {preset.highlights.map((highlight) => (
                              <li key={highlight} className="flex items-start gap-2">
                                <Sparkles className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              handlePreviewVoice(preset.id)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                event.stopPropagation()
                                handlePreviewVoice(preset.id)
                              }
                            }}
                            className={cn(
                              "group inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold transition outline-none",
                              "border-[#EDE5E0] bg-white/95 text-[#777777] hover:border-[#FF7A70] hover:bg-[#FF7A70]/10 focus-visible:ring-2 focus-visible:ring-[#FF7A70]",
                              previewingPersonaId === preset.id && "border-[#FF7A70] bg-[#FF7A70]/20 text-[#FF7A70]",
                            )}
                          >
                            {previewingPersonaId === preset.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MicVocal className="h-3.5 w-3.5 text-[#FF7A70]" />
                            )}
                            <span>{previewingPersonaId === preset.id ? "Stop preview" : "Preview voice"}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  className={cn(
                    "absolute -left-10 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#EDE5E0] bg-white p-2 text-[#777777] shadow-lg transition hover:bg-[#F3F4F6] hover:text-[#1A1A1A] sm:flex",
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
                    "absolute -right-10 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#EDE5E0] bg-white p-2 text-[#777777] shadow-lg transition hover:bg-[#F3F4F6] hover:text-[#1A1A1A] sm:flex",
                    !canScrollRight && "opacity-40 pointer-events-none",
                  )}
                  aria-label="Scroll to next persona"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              {previewError && (
                <p className="mt-2 text-xs text-amber-300">{previewError}</p>
              )}
            </section>

            <section className="grid gap-6 rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-lg shadow-black/10">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Question mix</h2>
                <p className="text-sm text-[#777777]">
                  Gemini balances technical depth with behavioral storytelling—adjust to match the interview stage.
                </p>
              </div>

              <div className="relative mt-2 h-8">
                <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-[#F3F4F6]" />
                <div
                  className="absolute inset-y-2 left-0 rounded-full bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF] shadow-md shadow-[#FF7A70]/20"
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
                <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#777777]">Technical</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-[#1A1A1A]">{technicalPercent}%</span>
                    <span className="text-sm text-[#777777]">coding, debugging, architecture</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#777777]">Behavioral</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-[#1A1A1A]">{behavioralPercent}%</span>
                    <span className="text-sm text-[#777777]">storytelling, teamwork, leadership</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Emphasize these stories</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-[#777777]">
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
                          ? "border-[#FF7A70] bg-[#FF7A70]/10 shadow-md shadow-[#FF7A70]/25 ring-1 ring-[#FF7A70]/40"
                          : "border-[#EDE5E0] bg-white/95 hover:border-[#FF7A70]/60 hover:bg-white hover:shadow-md hover:shadow-[#FF7A70]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              active
                            ? "bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF] text-white"
                            : "bg-[#F3F4F6] text-[#FF7A70]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1A1A1A]">{area.label}</p>
                            <p className="text-xs text-[#777777]">{area.blurb}</p>
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

            <section className="grid gap-6 rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-lg shadow-black/10">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Pick your interviewer voice</h2>
                <p className="text-sm text-[#777777]">
                  ElevenLabs will synthesize the vibe—switch based on how intense you want the session to feel.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {VOICE_STYLE_OPTIONS.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => setVoiceStyle(voice.id)}
                    className={cn(
                      "flex h-full flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A70] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      voiceStyle === voice.id
                        ? "border-[#FF7A70] bg-[#FF7A70]/10 shadow-md shadow-[#FF7A70]/20 ring-1 ring-[#FF7A70]/40"
                        : "border-[#EDE5E0] bg-white/95 hover:border-[#FF7A70]/60 hover:bg-white hover:shadow-md hover:shadow-[#FF7A70]/20",
                    )}
                  >
                    <div>
                      <p className="font-semibold leading-tight text-[#1A1A1A]">{voice.label}</p>
                      <p className="mt-2 text-sm text-[#777777]">{voice.description}</p>
                    </div>
                    {voice.badge && (
                      <span className="text-xs font-semibold text-[#FF7A70]">{voice.badge}</span>
                    )}
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
                    "flex h-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A70] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                    duration === block.durationLabel
                      ? "border-[#FF7A70] bg-[#FF7A70]/10 shadow-md shadow-[#FF7A70]/20 ring-1 ring-[#FF7A70]/40"
                      : "border-[#EDE5E0] bg-white/95 hover:border-[#FF7A70]/60 hover:bg-white hover:shadow-md hover:shadow-[#FF7A70]/20",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        duration === block.durationLabel
                          ? "bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF] text-white"
                          : "bg-[#F3F4F6] text-[#FF7A70]"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{block.label}</p>
                      <p className="text-sm text-[#777777]">{block.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#777777]">
                    {duration === block.durationLabel ? "Selected" : "Tap to switch"}
                  </span>
                </button>
              ))}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
              <Link href="/">
                <Button variant="outline" size="lg">
                  Back
                </Button>
              </Link>
              <Button
                type="button"
                onClick={handleStartMock}
                size="lg"
                loading={isStarting}
                ripple={true}
                variant="gradient"
                className="px-8 py-6 rounded-full font-semibold tracking-tight"
              >
                {isStarting ? "Prepping your interviewer…" : "Start mock interview"}
                {!isStarting && <ChevronRight className="ml-2 h-5 w-5" />}
              </Button>
              {startError && (
                <p className="text-sm text-amber-300">{startError}</p>
              )}
            </div>
          </div>

          <aside className="relative isolate animate-slide-up delay-150 lg:sticky lg:top-28 lg:self-start">
            <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#FF7A70]/30 blur-3xl" aria-hidden />
            <div className="absolute -bottom-14 -left-6 h-40 w-40 rounded-full bg-[#6EC8FF]/25 blur-3xl" aria-hidden />
            <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-[#EDE5E0] bg-white/95 p-7 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FF7A70]/10 px-3 py-1 text-xs font-semibold text-[#FF7A70]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live Gemini Preview
                </span>
                <span className="text-xs font-semibold text-[#777777]">Realtime updates</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#777777]">Interview Persona</p>
                  <h3 className="text-2xl font-semibold mt-1 text-[#1A1A1A]">
                    {selectedPersona.company} · {selectedPersona.role}
                  </h3>
                  <p className="mt-3 text-sm text-[#777777] leading-relaxed">{selectedPersona.tagline}</p>
                </div>

                <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <MicVocal className="h-4 w-4 text-[#FF7A70]" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">{selectedPersona.voiceStyle}</p>
                  </div>
                  <p className="mt-2 text-xs text-[#777777]">{selectedPersona.voiceBadge}</p>
                  <p className="mt-3 text-xs font-semibold text-[#FF7A70]">
                    Voice Selection: {activeVoiceStyle.label}
                    {activeVoiceStyle.badge ? ` · ${activeVoiceStyle.badge}` : ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EDE5E0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#777777]">
                    Interview cues
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#777777]">
                    {selectedPersona.jdSignals.map((signal) => (
                      <li key={signal} className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-[#FF7A70] mt-0.5" />
                        <span>{signal}</span>
                      </li>
                    ))}
                    {selectedPersona.id === "amazon-pm" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#FF7A70] mt-0.5" />
                        <span>Lean on STAR stories tied to Amazon Leadership Principles.</span>
                      </li>
                    )}
                    {selectedPersona.id === "google-analyst" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#FF7A70] mt-0.5" />
                        <span>Explain the story behind your metrics and how you validated the data.</span>
                      </li>
                    )}
                    {selectedPersona.id === "meta-swe" && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-[#FF7A70] mt-0.5" />
                        <span>Walk through the architecture decisions and how you guided teams through trade-offs.</span>
                      </li>
                    )}
                  </ul>
                </div>

              </div>

              <div className="mt-auto rounded-2xl border border-[#EDE5E0] bg-white p-4 text-xs text-[#777777]">
                <p className="font-semibold uppercase tracking-[0.25em] text-[#777777]">Session summary</p>
                <div className="mt-3 grid gap-2 text-[#777777]">
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

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FFF8F5]">
      <div className="text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#FF7A70]/20 border-t-[#FF7A70] mx-auto mb-4"></div>
        <p className="text-lg font-medium text-[#1A1A1A]">Loading setup...</p>
      </div>
    </div>}>
      <SetupPageContent />
    </Suspense>
  )
}
