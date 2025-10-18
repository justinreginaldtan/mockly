"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { InterviewerAvatar } from "@/components/interviewer-avatar"
import { ControlBar, type ControlTheme } from "@/components/interview/control-bar"
import { InsightsDrawer } from "@/components/interview/insights-drawer"
import { Settings2, ChevronDown } from "lucide-react"
import type { InterviewPlan, InterviewSetupPayload, PersonaConfig } from "@/lib/gemini"
import { SETUP_CACHE_KEY, PLAN_CACHE_KEY } from "@/lib/cache-keys"

const mockQuestions = [
  {
    id: 1,
    text: "Describe a time when you had to make a decision with limited information.",
    jdSignal: "Handling ambiguity",
  },
  {
    id: 2,
    text: "How did you measure success on your robotics project, and what impact did it drive?",
    jdSignal: "Impact metrics and outcomes",
  },
  {
    id: 3,
    text: "Tell me about a moment you had to rally your team around a change in plans.",
    jdSignal: "Leadership & collaboration",
  },
] as const

type ThemeMode = ControlTheme

const themeOptions: Array<{ id: ThemeMode; label: string; description: string }> = [
  { id: "zoom", label: "Zoom Mode", description: "Classic video call styling" },
  { id: "google", label: "Google Meet", description: "Bright and collaborative" },
  { id: "minimal", label: "Minimalist", description: "Focused, distraction-free" },
]

const themeStyles: Record<
  ThemeMode,
  {
    container: string
    questionBubble: string
    questionText: string
    questionMeta: string
    liveBadge: string
    menuButton: string
    menu: string
    menuItem: string
    menuItemActive: string
    videoShell: string
    videoAmbient: string
    videoInner: string
    namePlate: string
    statusPlate: string
    placeholder: string
    subtext: string
    controlTheme: ControlTheme
    preJoinCard: string
    preJoinText: string
  }
> = {
  zoom: {
    container: "bg-[#0f1117] text-white",
    questionBubble:
      "rounded-full border border-white/10 bg-black/60 px-6 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
    questionText: "text-white",
    questionMeta: "text-white/60",
    liveBadge: "border border-red-500/30 bg-red-500/10 text-red-300",
    menuButton:
      "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors duration-300",
    menu: "mt-2 w-48 rounded-xl border border-white/10 bg-[#161b2a]/95 p-2 text-xs text-white shadow-2xl",
    menuItem:
      "w-full rounded-lg px-3 py-2 text-left text-white/80 hover:bg-white/10 transition-colors duration-200",
    menuItemActive: "bg-white/15 text-white",
    videoShell: "group relative flex-1 max-w-3xl aspect-video isolate",
    videoAmbient: "radial-gradient(circle at center, rgba(59,130,246,0.28) 0%, rgba(15,17,23,0) 70%)",
    videoInner:
      "relative h-full w-full overflow-hidden rounded-[28px] bg-[#11131d] shadow-[inset_0_0_18px_rgba(0,0,0,0.55)] transition duration-500",
    namePlate: "rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white shadow-sm",
    statusPlate: "rounded-full bg-white/15 px-3 py-1 text-xs text-white/80",
    placeholder:
      "flex h-full flex-col items-center justify-center gap-4 text-white/70 transition-colors duration-300",
    subtext: "text-white/60",
    controlTheme: "zoom",
    preJoinCard:
      "w-[90%] max-w-xl rounded-2xl border border-white/10 bg-[#161b2a]/95 px-8 py-10 text-left text-white shadow-2xl shadow-black/40",
    preJoinText: "text-white/70",
  },
  google: {
    container: "bg-gradient-to-br from-[#e8ebf0] to-[#f7f8fa] text-gray-800",
    questionBubble:
      "rounded-full border border-gray-200 bg-white px-6 py-3 shadow-sm transition duration-500",
    questionText: "text-gray-800",
    questionMeta: "text-gray-500",
    liveBadge: "border border-red-400/30 bg-red-100 text-red-500",
    menuButton:
      "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors duration-300",
    menu:
      "mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg shadow-gray-300/50",
    menuItem:
      "w-full rounded-lg px-3 py-2 text-left text-gray-600 hover:bg-gray-100 transition-colors duration-200",
    menuItemActive: "bg-blue-100 text-blue-600",
    videoShell: "group relative flex-1 max-w-3xl aspect-video isolate",
    videoAmbient: "radial-gradient(circle at center, rgba(37,99,235,0.2) 0%, rgba(232,235,240,0) 70%)",
    videoInner:
      "relative h-full w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition duration-500",
    namePlate: "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm",
    statusPlate: "rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600",
    placeholder:
      "flex h-full flex-col items-center justify-center gap-4 text-gray-500 transition-colors duration-300",
    subtext: "text-gray-600",
    controlTheme: "google",
    preJoinCard:
      "w-[90%] max-w-xl rounded-2xl border border-gray-200 bg-white px-8 py-10 text-left text-gray-800 shadow-2xl shadow-gray-300/50",
    preJoinText: "text-gray-600",
  },
  minimal: {
    container: "bg-gradient-to-br from-[#101218] to-[#181a20] text-gray-100",
    questionBubble:
      "rounded-full border border-white/10 bg-white/5 px-6 py-3 shadow-lg backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md",
    questionText: "text-white",
    questionMeta: "text-white/60",
    liveBadge: "border border-red-500/30 bg-red-500/15 text-red-300",
    menuButton:
      "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-100 hover:bg-white/10 transition-colors duration-300",
    menu: "mt-2 w-48 rounded-xl border border-white/10 bg-[#141721]/95 p-2 text-xs text-gray-100 shadow-2xl",
    menuItem:
      "w-full rounded-lg px-3 py-2 text-left text-gray-300 hover:bg-white/10 transition-colors duration-200",
    menuItemActive: "bg-white/15 text-white",
    videoShell: "group relative flex-1 max-w-3xl aspect-video isolate",
    videoAmbient: "radial-gradient(circle at center, rgba(147,197,253,0.25) 0%, rgba(16,18,24,0) 70%)",
    videoInner:
      "relative h-full w-full overflow-hidden rounded-[28px] bg-[#0f131d]/90 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.9)] transition duration-500",
    namePlate: "rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-100",
    statusPlate: "rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300",
    placeholder:
      "flex h-full flex-col items-center justify-center gap-4 text-gray-400 transition-colors duration-300",
    subtext: "text-gray-400",
    controlTheme: "minimal",
    preJoinCard:
      "w-[90%] max-w-xl rounded-2xl border border-white/10 bg-[#121620]/95 px-8 py-10 text-left text-gray-100 shadow-2xl shadow-black/50",
    preJoinText: "text-gray-400",
  },
}

type PlanStatus = "idle" | "loading" | "ready" | "refreshing" | "error"

const PLAN_CACHE_TTL_MS = 2 * 60 * 1000

const formatFocusAreaLabel = (value: string): string =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())

const buildPersonaGreetingLine = (persona: PersonaConfig): string => {
  const primaryFocus = Array.isArray(persona.focusAreas) ? persona.focusAreas[0] : undefined
  const focusCopy = primaryFocus ? formatFocusAreaLabel(primaryFocus) : null
  const context = persona.additionalContext ?? `${persona.company} ${persona.role}`
  if (focusCopy) {
    return `Hey there! I'm channeling a ${context} today. Take a breath—I'm excited to hear your take on ${focusCopy.toLowerCase()}.`
  }

  return `Hey there! I'm channeling a ${context} today. Let's dive into your story when you're ready.`
}

const personaIdentityMap: Record<string, { interviewerName: string; interviewerTitle: string }> = {
  "google-swe": { interviewerName: "Avery Chen", interviewerTitle: "Senior SWE · Google" },
  "amazon-pm": { interviewerName: "Jordan Patel", interviewerTitle: "Product Lead · Amazon" },
  "meta-data": { interviewerName: "Priya Singh", interviewerTitle: "Head of Analytics · Meta" },
  "microsoft-cs": { interviewerName: "Chris Nguyen", interviewerTitle: "Customer Success Lead · Microsoft" },
}

const getPersonaIdentity = (persona: PersonaConfig) =>
  personaIdentityMap[persona.personaId] ?? {
    interviewerName: `${persona.company} Interviewer`,
    interviewerTitle: `${persona.role} · ${persona.company}`,
  }

const fallbackPersona: PersonaConfig = {
  personaId: "google-swe",
  company: "Google",
  role: "Software Engineering Intern",
  focusAreas: ["leadership", "systemDesign", "communication"],
  technicalWeight: 70,
  duration: "standard",
  voiceStyle: "Calm technical mentor · ElevenLabs",
  additionalContext: "Fallback persona configuration without live Gemini data.",
}

const fallbackPlan: InterviewPlan = {
  persona: fallbackPersona,
  questions: mockQuestions.map((question) => ({
    id: String(question.id),
    prompt: question.text,
    focusArea: question.jdSignal,
    followUps: [],
  })),
  guidance: "Lead with STAR stories and quantify the impact behind each response.",
}

const defaultInsights = [
  "Lead with the STAR framework so every answer hits situation through result.",
  "Quantify your outcomes—mention accuracy gains, time saved, or adoption metrics.",
  "Call out how you clarified ambiguous requirements and aligned stakeholders.",
]

const buildFallbackPlan = (persona: PersonaConfig): InterviewPlan => ({
  persona: {
    ...fallbackPersona,
    ...persona,
    focusAreas: persona.focusAreas?.length ? persona.focusAreas : fallbackPersona.focusAreas,
    technicalWeight:
      typeof persona.technicalWeight === "number" ? persona.technicalWeight : fallbackPersona.technicalWeight,
    duration: persona.duration ?? fallbackPersona.duration,
    voiceStyle: persona.voiceStyle ?? fallbackPersona.voiceStyle,
    additionalContext: persona.additionalContext ?? fallbackPersona.additionalContext,
  },
  questions: fallbackPlan.questions,
  guidance: fallbackPlan.guidance,
})

export default function MockInterviewPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [theme, setTheme] = useState<ThemeMode>("zoom")
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null)
  const [planStatus, setPlanStatus] = useState<PlanStatus>("idle")
  const [planError, setPlanError] = useState<string | null>(null)
  const [fallbackPlanState, setFallbackPlanState] = useState<InterviewPlan | null>(null)
  const [isGreetingActive, setIsGreetingActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const currentTheme = themeStyles[theme]
  const selectedThemeOption = themeOptions.find((option) => option.id === theme)
  const handleThemeSelect = useCallback((mode: ThemeMode) => {
    setTheme(mode)
    setThemeMenuOpen(false)
  }, [])

  const activePlan = interviewPlan ?? fallbackPlanState
  const questions = activePlan?.questions?.length ? activePlan.questions : []
  const hasPlan = questions.length > 0
  const totalQuestions = questions.length
  const clampedIndex = hasPlan ? Math.min(currentQuestionIndex, Math.max(totalQuestions - 1, 0)) : 0
  const currentQuestion = hasPlan ? questions[clampedIndex] ?? questions[0] : null
  const currentQuestionPrompt = currentQuestion?.prompt ?? ""
  const currentQuestionFocus = currentQuestion?.focusArea ?? ""
  const displayFocusArea = currentQuestionFocus ? formatFocusAreaLabel(currentQuestionFocus) : ""
  const planLoading = planStatus === "idle" || planStatus === "loading"
  const questionPositionLabel = hasPlan ? `Question ${clampedIndex + 1} of ${totalQuestions}` : ""
  const questionHeading = planLoading
    ? "Gemini is shaping your interviewer…"
    : hasPlan
      ? currentQuestionPrompt
      : "No questions available."
  const questionMetaText = planLoading
    ? "Loading AI-tailored questions based on your setup choices."
    : hasPlan
      ? `JD anchor: ${displayFocusArea}`
      : ""
  const personaSource = activePlan?.persona ?? fallbackPersona
  const personaVoiceLabel = personaSource.voiceStyle ?? fallbackPlan.persona.voiceStyle!
  const personaInsights = useMemo(() => {
    if (!activePlan?.guidance) return defaultInsights
    return [activePlan.guidance, ...defaultInsights.filter((tip) => tip !== activePlan.guidance)]
  }, [activePlan])
  const personaGreetingLine = useMemo(() => buildPersonaGreetingLine(personaSource), [personaSource])
  const personaIdentity = useMemo(() => getPersonaIdentity(personaSource), [personaSource])

  useEffect(() => {
    if (showIntro) {
      setIsGreetingActive(false)
      return
    }

    if (planLoading || !hasPlan) {
      return
    }

    setIsGreetingActive(true)
    const timer = window.setTimeout(() => setIsGreetingActive(false), 3400)
    return () => window.clearTimeout(timer)
  }, [showIntro, planLoading, hasPlan, activePlan?.persona?.personaId])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const stored = window.sessionStorage.getItem(SETUP_CACHE_KEY)

    if (!stored) {
      setPlanError("Setup details missing. Using demo questions.")
      setFallbackPlanState(fallbackPlan)
      setInterviewPlan(null)
      setCurrentQuestionIndex(0)
      setPlanStatus("error")
      return
    }

    let payload: InterviewSetupPayload | null = null
    try {
      payload = JSON.parse(stored) as InterviewSetupPayload
    } catch (error) {
      console.error("Failed to parse stored setup payload", error)
      setPlanError("Invalid setup data. Using demo questions.")
      setFallbackPlanState(fallbackPlan)
      setInterviewPlan(null)
      setCurrentQuestionIndex(0)
      setPlanStatus("error")
      return
    }

    if (!payload?.persona) {
      setPlanError("Incomplete setup data. Using demo questions.")
      setFallbackPlanState(fallbackPlan)
      setInterviewPlan(null)
      setCurrentQuestionIndex(0)
      setPlanStatus("error")
      return
    }

    const controller = new AbortController()
    let usedCachedPlan = false
    let shouldFetch = true
    setPlanStatus((current) => (current === "ready" ? "refreshing" : "loading"))
    setPlanError(null)

    const cachedPlanRaw = window.sessionStorage.getItem(PLAN_CACHE_KEY)
    if (cachedPlanRaw) {
      try {
        const cachedPlan = JSON.parse(cachedPlanRaw) as InterviewPlan & { cachePersonaId?: string; cachedAt?: number }
        const personaId = cachedPlan.persona?.personaId ?? (cachedPlan as { cachePersonaId?: string }).cachePersonaId
        const cachedAt = typeof cachedPlan.cachedAt === "number" ? cachedPlan.cachedAt : 0
        const isFresh = cachedAt > 0 && Date.now() - cachedAt < PLAN_CACHE_TTL_MS
        if (personaId && personaId === payload.persona.personaId) {
          setInterviewPlan(cachedPlan)
          setFallbackPlanState(null)
          setCurrentQuestionIndex(0)
          if (isFresh) {
            setPlanStatus("ready")
            shouldFetch = false
          } else {
            setPlanStatus("refreshing")
            usedCachedPlan = true
          }
        } else {
          window.sessionStorage.removeItem(PLAN_CACHE_KEY)
        }
      } catch (error) {
        console.warn("Failed to read cached interview plan", error)
        window.sessionStorage.removeItem(PLAN_CACHE_KEY)
      }
    }

    if (!shouldFetch) {
      return () => {
        controller.abort("teardown")
      }
    }

    fetch("/api/generate-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || "Failed to generate interview plan")
        }
        return response.json()
      })
      .then((data) => {
        if (data?.success && data.plan) {
          const generatedPlan = data.plan as InterviewPlan
          setInterviewPlan(generatedPlan)
          setFallbackPlanState(null)
          setPlanError(null)
          setPlanStatus("ready")
          setCurrentQuestionIndex(0)
          try {
            window.sessionStorage.setItem(
              PLAN_CACHE_KEY,
              JSON.stringify({ ...generatedPlan, cachePersonaId: payload!.persona.personaId, cachedAt: Date.now() }),
            )
          } catch (error) {
            console.warn("Failed to cache interview plan", error)
          }
        } else {
          setPlanError(data?.error ?? "Unable to generate questions. Using demo fallback.")
          if (usedCachedPlan) {
            setPlanStatus("ready")
          } else {
            const fallbackGenerated = buildFallbackPlan(payload!.persona)
            setFallbackPlanState(fallbackGenerated)
            setInterviewPlan(null)
            setCurrentQuestionIndex(0)
            window.sessionStorage.removeItem(PLAN_CACHE_KEY)
            setPlanStatus("error")
          }
        }
      })
      .catch((error) => {
        if (error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "AbortError") {
          return
        }
        if (typeof error === "object" && error && "message" in error && typeof (error as { message?: string }).message === "string") {
          const message = (error as { message: string }).message
          if (message.toLowerCase().includes("aborted")) {
            return
          }
        }
        console.error("Failed to fetch interview plan", error)
        if (usedCachedPlan) {
          setPlanError("Unable to refresh Gemini questions. Using saved plan.")
          setPlanStatus("ready")
        } else {
          setPlanError("Unable to reach Gemini. Using demo questions.")
          const fallbackGenerated = buildFallbackPlan(payload!.persona)
          setFallbackPlanState(fallbackGenerated)
          setInterviewPlan(null)
          setCurrentQuestionIndex(0)
          window.sessionStorage.removeItem(PLAN_CACHE_KEY)
          setPlanStatus("error")
        }
      })

    return () => {
      controller.abort("teardown")
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const enableCamera = async () => {
      if (!isCameraOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        return
      }

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera not supported in this browser")
          setIsCameraOn(false)
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        setCameraError(null)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (error) {
        setCameraError("Camera permission denied")
        setIsCameraOn(false)
      }
    }

    enableCamera()

    return () => {
      cancelled = true
    }
  }, [isCameraOn])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Fullscreen toggle failed", error)
    }
  }, [])

  const handleExit = useCallback(() => {
    router.push("/results")
  }, [router])

  const containerClasses = cn(
    "relative min-h-screen w-full flex flex-col items-center justify-center transition-transform duration-500 ease-out",
    currentTheme.container,
    isFullscreen && "scale-[1.02]",
  )
  const questionBubbleClasses = cn(
    "absolute top-8 left-1/2 z-20 w-[90%] max-w-2xl -translate-x-1/2 text-center transition-opacity duration-300",
    currentTheme.questionBubble,
    showIntro ? "pointer-events-none opacity-0" : "opacity-100",
  )
  const questionTextClass = cn("text-sm font-semibold md:text-base transition-colors duration-300", currentTheme.questionText)
  const questionMetaClass = cn("text-xs md:text-sm transition-colors duration-300", currentTheme.questionMeta)
  const liveBadgeClass = cn(
    "absolute left-6 top-6 z-30 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors duration-300",
    currentTheme.liveBadge,
  )
  const menuButtonClass = cn(currentTheme.menuButton, "transition-colors duration-300")
  const menuDropdownClass = cn(
    "absolute right-0 top-full z-30 origin-top-right flex flex-col gap-1",
    currentTheme.menu,
  )
  const menuItemBaseClass = cn("transition-colors duration-200", currentTheme.menuItem)
  const videoShellClass = cn(
    "group relative flex-1 max-w-3xl transition-all duration-500 ease-out",
    currentTheme.videoShell,
  )
  const videoAmbientStyle = { background: currentTheme.videoAmbient }
  const videoInnerClass = cn(
    "relative h-full w-full overflow-hidden transition-all duration-500",
    currentTheme.videoInner,
  )
  const namePlateClass = cn("flex items-center gap-2 transition-colors duration-300", currentTheme.namePlate)
  const statusPlateClass = cn("transition-colors duration-300", currentTheme.statusPlate)
  const placeholderClass = cn("transition-colors duration-300", currentTheme.placeholder)
  const subtextClass = cn("text-sm", currentTheme.subtext)
  const preJoinCardClass = cn("transition-all duration-500", currentTheme.preJoinCard)
  const preJoinTextClass = cn("text-sm transition-colors duration-300", currentTheme.preJoinText)
  const introOverlayClass =
    theme === "google"
      ? "bg-black/30 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-sm"
      : "bg-black/60 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-sm"
  const introAccentClass = theme === "google" ? "text-blue-600" : "text-[#4b6bff]"
  const introInfoBoxClass =
    theme === "google"
      ? "rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-sm"
      : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
  const introHighlightTextClass = theme === "google" ? "font-medium text-gray-900" : "font-medium text-white"
  const introFooterTextClass = theme === "google" ? "text-xs text-gray-500" : "text-xs text-white/50"
  const joinButtonClass =
    theme === "google"
      ? "rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600/90"
      : "rounded-full bg-[#4b6bff] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#4b6bff]/30 transition hover:bg-[#4b6bff]/90"

  return (
    <div className={containerClasses}>
      <InsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        voiceLabel={personaVoiceLabel}
        insights={personaInsights}
      />

      <div className="absolute top-6 right-6 z-30">
        <div className="relative">
          <button
            type="button"
            onClick={() => setThemeMenuOpen((prev) => !prev)}
            className={menuButtonClass}
            aria-haspopup="true"
            aria-expanded={themeMenuOpen}
          >
            <Settings2 className="h-4 w-4" />
            <span>{selectedThemeOption?.label ?? "Theme"}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", themeMenuOpen && "rotate-180")}
            />
          </button>
          {themeMenuOpen && (
            <div className={menuDropdownClass}>
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleThemeSelect(option.id)}
                  className={cn(menuItemBaseClass, option.id === theme && currentTheme.menuItemActive)}
                >
                  <span className="block text-[0.75rem] font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[0.68rem] opacity-70">{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!showIntro && !planLoading && hasPlan && (
        <div className={liveBadgeClass}>
          <span className="inline-flex h-2 w-2 rounded-full bg-current animate-pulse" aria-hidden="true" />
          Live · {questionPositionLabel}
        </div>
      )}

      <div className={questionBubbleClasses}>
        {isGreetingActive && !planLoading && (
          <div
            className={cn(
              "mb-3 text-center text-[0.7rem] uppercase tracking-[0.35em] opacity-80",
              currentTheme.questionMeta,
            )}
          >
            {personaIdentity.interviewerName} says
            <p className={cn("mt-2 text-sm italic leading-relaxed normal-case tracking-normal", currentTheme.questionText)}>
              {personaGreetingLine}
            </p>
          </div>
        )}
        {!planLoading && questionPositionLabel && (
          <p className={cn("mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.35em] opacity-70", currentTheme.questionMeta)}>
            {questionPositionLabel}
          </p>
        )}
        <p className={questionTextClass}>
          {planLoading ? (
            <span
              className="inline-flex h-5 w-48 animate-pulse rounded-full opacity-40 sm:w-64"
              style={{ backgroundColor: "currentColor" }}
            />
          ) : (
            questionHeading
          )}
        </p>
        <p className={questionMetaClass}>
          {planLoading ? (
            <span
              className="inline-flex h-3 w-40 animate-pulse rounded-full opacity-30 sm:w-52"
              style={{ backgroundColor: "currentColor" }}
            />
          ) : (
            questionMetaText
          )}
        </p>
        {planLoading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs opacity-80">
            <span className="h-2 w-2 animate-ping rounded-full bg-current/80" aria-hidden="true" />
            <span>Contacting Gemini…</span>
          </div>
        )}
        {planStatus === "refreshing" && !planLoading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs opacity-80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden="true" />
            <span>Prepping your interviewer with fresh follow-ups…</span>
          </div>
        )}
        {planStatus === "error" && planError && !planLoading && (
          <p className="mt-2 text-xs text-amber-300">{planError}</p>
        )}
      </div>

      <div
        className={cn(
          "w-full max-w-6xl px-4 transition-all duration-500 ease-out",
          showIntro ? "pointer-events-none opacity-0 translate-y-8" : "opacity-100 translate-y-0",
        )}
      >
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
          <div className={videoShellClass}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] opacity-70 blur-3xl transition-opacity duration-500"
              style={videoAmbientStyle}
            />
            <div className={videoInnerClass}>
              <div className="absolute inset-0 flex items-center justify-center">
                <InterviewerAvatar isSpeaking={!isMuted} />
              </div>
              <div className={cn("absolute top-5 left-5", namePlateClass)}>{personaIdentity.interviewerName}</div>
              <div className={cn("absolute bottom-5 left-5", statusPlateClass)}>{personaIdentity.interviewerTitle}</div>
            </div>
          </div>

          <div className={videoShellClass}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] opacity-60 blur-3xl transition-opacity duration-500"
              style={videoAmbientStyle}
            />
            <div className={videoInnerClass}>
              {cameraError || !isCameraOn ? (
                <div className={placeholderClass}>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-current/30 text-lg font-semibold">
                    You
                  </div>
                  <p className={cn("px-4 text-center", subtextClass)}>{cameraError ?? "Camera off"}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  autoPlay
                  className="h-full w-full object-cover transition-shadow duration-500"
                />
              )}
              <div className={cn("absolute top-5 left-5", namePlateClass)}>You</div>
              <div className={cn("absolute bottom-5 left-5", statusPlateClass)}>
                {isMuted ? "Mic muted" : "Mic live"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(showIntro && "opacity-0 pointer-events-none", "transition-opacity duration-300")}>
        <ControlBar
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          isCameraOn={isCameraOn}
          onToggleCamera={() => setIsCameraOn((prev) => !prev)}
          insightsOpen={drawerOpen}
          onToggleInsights={() => setDrawerOpen((prev) => !prev)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onExit={handleExit}
          theme={currentTheme.controlTheme}
        />
      </div>

      {showIntro && (
        <div className={cn("absolute inset-0 z-30 flex items-center justify-center", introOverlayClass)}>
          <div className={preJoinCardClass}>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.3em]", introAccentClass)}>Session preview</p>
            <h2 className="mt-3 text-2xl font-semibold">Ready for your mock interview?</h2>
            <p className={cn("mt-3", preJoinTextClass)}>
              {planLoading
                ? "Gemini is shaping your interviewer—personalized questions will appear as soon as you join."
                : `We matched you with a ${personaSource.company} ${personaSource.role} persona using your setup choices.`}
            </p>
            <div className={cn("mt-6 space-y-3", introInfoBoxClass)}>
              <div>
                <span className={introHighlightTextClass}>First question:</span>{" "}
                {hasPlan ? currentQuestionPrompt : "Generating…"}
              </div>
              <div>
                <span className={introHighlightTextClass}>Focus:</span>{" "}
                {hasPlan ? displayFocusArea : "Calibrating interviewer cues…"}
              </div>
              <div>
                <span className={introHighlightTextClass}>Interviewer:</span> {personaIdentity.interviewerName}
              </div>
              <div>
                <span className={introHighlightTextClass}>Voice persona:</span> {personaVoiceLabel}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className={introFooterTextClass}>
                You can adjust mic/camera once you join. Gemini insights are available anytime via the button on the call surface.
              </p>
              <button onClick={() => setShowIntro(false)} className={joinButtonClass}>
                Join interview
              </button>
            </div>
            {planStatus === "error" && planError && (
              <p className="mt-3 text-xs text-amber-300">{planError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
