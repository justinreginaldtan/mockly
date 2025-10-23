"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import NextLink from "next/link"
import { cn } from "@/lib/utils"
import { InterviewerAvatar } from "@/components/interviewer-avatar"
import { ControlBar, type ControlTheme } from "@/components/interview/control-bar"
import { InsightsDrawer } from "@/components/interview/insights-drawer"
import { Settings2, ChevronDown, ChevronRight, Square, Timer, ArrowLeft } from "lucide-react"
import type { InterviewPlan, InterviewSetupPayload, PersonaConfig } from "@/lib/gemini"
import { SETUP_CACHE_KEY, PLAN_CACHE_KEY } from "@/lib/cache-keys"
import { resolvePersonaVoice } from "@/lib/voices"
import { useSpeechRecorder, type RecorderStatus } from "@/hooks/use-speech-recorder"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { Waveform } from "@/components/waveform"
import { StepIndicator } from "@/components/step-indicator"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"

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
  { id: "zoom", label: "Studio", description: "Polished call environment" },
  { id: "google", label: "Collaborative", description: "Bright and inviting" },
  { id: "minimal", label: "Focus", description: "Distraction-free stage" },
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
      "rounded-full border border-white/10 bg-black/60 px-6 py-3 shadow-lg supports-[backdrop-filter]:backdrop-blur-md",
    questionText: "font-display text-sm font-semibold text-white md:text-base",
    questionMeta: "font-body text-xs text-white/60 md:text-sm",
    liveBadge: "border border-red-500/30 bg-red-500/10 text-red-300",
    menuButton:
      "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[#94A3B8]/40",
    menu: "mt-2 w-48 rounded-xl border border-white/10 bg-[#161b2a]/95 p-2 text-xs text-white shadow-2xl",
    menuItem:
      "w-full rounded-lg px-3 py-2 text-left text-white/80 transition-colors duration-200 hover:bg-white/10",
    menuItemActive: "bg-white/15 text-white",
    videoShell: "group relative flex-1 max-w-3xl aspect-video isolate",
    videoAmbient: "radial-gradient(circle at center, rgba(59,130,246,0.28) 0%, rgba(15,17,23,0) 70%)",
    videoInner:
      "relative h-full w-full overflow-hidden rounded-[28px] bg-[#11131d] shadow-[inset_0_0_18px_rgba(0,0,0,0.55)] transition duration-500",
    namePlate: "rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white shadow-sm",
    statusPlate: "rounded-full bg-white/15 px-3 py-1 text-xs text-white/70",
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
    questionText: "font-display text-sm font-semibold text-gray-800 md:text-base",
    questionMeta: "font-body text-xs text-gray-500 md:text-sm",
    liveBadge: "border border-red-400/30 bg-red-100 text-red-500",
    menuButton:
      "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors duration-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#94A3B8]/40",
    menu: "mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg shadow-gray-300/50",
    menuItem:
      "w-full rounded-lg px-3 py-2 text-left text-gray-600 transition-colors duration-200 hover:bg-gray-100",
    menuItemActive: "bg-blue-100 text-blue-600",
    videoShell: "group relative flex-1 max-w-3xl aspect-video isolate",
    videoAmbient: "radial-gradient(circle at center, rgba(37,99,235,0.2) 0%, rgba(232,235,240,0) 70%)",
    videoInner:
      "relative h-full w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition duration-500",
    namePlate: "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm",
    statusPlate: "rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500",
    placeholder:
      "flex h-full flex-col items-center justify-center gap-4 text-gray-400 transition-colors duration-300",
    subtext: "text-gray-500",
    controlTheme: "google",
    preJoinCard:
      "w-[90%] max-w-xl rounded-2xl border border-gray-200 bg-white px-8 py-10 text-left text-gray-800 shadow-xl shadow-gray-300/40",
    preJoinText: "text-gray-600",
  },
  minimal: {
    container: "bg-[#101218] text-gray-100",
    questionBubble:
      "rounded-full border border-white/10 bg-white/5 px-6 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
    questionText: "font-display text-sm font-semibold text-gray-100 md:text-base",
    questionMeta: "font-body text-xs text-gray-400 md:text-sm",
    liveBadge: "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    menuButton:
      "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-100 transition-colors duration-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#94A3B8]/40",
    menu: "mt-2 w-48 rounded-xl border border-white/10 bg-[#141721]/95 p-2 text-xs text-gray-100 shadow-2xl",
    menuItem:
      "w-full rounded-lg px-3 py-2 text-left text-gray-300 transition-colors duration-200 hover:bg-white/10",
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

const formatFocusAreaLabel = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .map((item) => formatFocusAreaLabel(item))
      .filter(Boolean)
      .join(", ")
  }
  if (typeof value !== "string") {
    return ""
  }
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

const PLAN_CACHE_KEY = "mi:plan"
const PROGRESS_CACHE_KEY = "mi:progress"
const RESPONSES_CACHE_KEY = "mi:responses"

type QuestionResponseRecord = {
  transcript: string
  durationMs: number
  updatedAt: number
}

const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) {
    return "0:00"
  }
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

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
  "google-analyst": { interviewerName: "Avery Chen", interviewerTitle: "Analytics Mentor · Google" },
  "amazon-pm": { interviewerName: "Jordan Patel", interviewerTitle: "Product Lead · Amazon" },
  "meta-swe": { interviewerName: "Arjun Patel", interviewerTitle: "Principal Engineer · Meta" },
}

const getPersonaIdentity = (persona: PersonaConfig) =>
  personaIdentityMap[persona.personaId] ?? {
    interviewerName: `${persona.company} Interviewer`,
    interviewerTitle: `${persona.role} · ${persona.company}`,
  }

const fallbackPersona: PersonaConfig = {
  personaId: "google-analyst",
  company: "Google",
  role: "Data Analyst Intern",
  focusAreas: ["communication", "productThinking", "adaptability"],
  technicalWeight: 40,
  duration: "standard",
  voiceStyle: "Calm metrics mentor · ElevenLabs",
  voiceStyleId: "mentor",
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
    voiceStyleId: persona.voiceStyleId ?? fallbackPersona.voiceStyleId,
    additionalContext: persona.additionalContext ?? fallbackPersona.additionalContext,
  },
  questions: fallbackPlan.questions,
  guidance: fallbackPlan.guidance,
})

export default function MockInterviewPage() {
  const router = useRouter()
  useKeyboardNavigation()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questionStatuses, setQuestionStatuses] = useState<Array<"pending" | "active" | "answered">>([])
  const [activeFollowUp, setActiveFollowUp] = useState<{ questionId: string; prompt: string } | null>(null)
  const [followUpHistory, setFollowUpHistory] = useState<Record<string, number>>({})
  const [showAgenda, setShowAgenda] = useState(false)
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
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)
  const [greetingCompleted, setGreetingCompleted] = useState(false)
  const [questionResponses, setQuestionResponses] = useState<Record<string, QuestionResponseRecord>>({})
  const [pendingRecorderStart, setPendingRecorderStart] = useState(false)
  const [recorderError, setRecorderError] = useState<string | null>(null)
  const [showUnmuteHint, setShowUnmuteHint] = useState(false)
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false)
  const [textAnswer, setTextAnswer] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const greetingAudioRef = useRef<HTMLAudioElement | null>(null)
  const questionAudioRef = useRef<HTMLAudioElement | null>(null)
  const followUpAudioRef = useRef<HTMLAudioElement | null>(null)
  const greetingFetchKeyRef = useRef<string | null>(null)
  const greetingPlaybackRef = useRef(false)
  const speechCacheRef = useRef<Map<string, string>>(new Map())
  const personaInitRef = useRef<string | null>(null)
  const lastSpokenQuestionRef = useRef<string | null>(null)
  const currentQuestionIndexRef = useRef(0)
  const questionsRef = useRef<Array<InterviewPlan["questions"][number]>>([])
  const responsesRef = useRef<Record<string, QuestionResponseRecord>>({})
  const activeQuestionIdRef = useRef<string | null>(null)
  const lastRecorderStatusRef = useRef<RecorderStatus>("idle")
  const [greetingAudioUrl, setGreetingAudioUrl] = useState<string | null>(null)

  const currentTheme = themeStyles[theme]
  const selectedThemeOption = themeOptions.find((option) => option.id === theme)
  const handleThemeSelect = useCallback((mode: ThemeMode) => {
    setTheme(mode)
    setThemeMenuOpen(false)
  }, [])

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex
  }, [currentQuestionIndex])

  const activePlan = interviewPlan ?? fallbackPlanState
  const questions = useMemo(() => (activePlan?.questions?.length ? activePlan.questions : []), [activePlan])
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])
  useEffect(() => {
    responsesRef.current = questionResponses
  }, [questionResponses])
  const hasPlan = questions.length > 0
  const totalQuestions = questions.length
  const clampedIndex = hasPlan ? Math.min(currentQuestionIndex, Math.max(totalQuestions - 1, 0)) : 0
  const currentQuestion = hasPlan ? questions[clampedIndex] ?? questions[0] : null
  const currentQuestionPrompt = currentQuestion?.prompt ?? ""
  const currentQuestionFocus = currentQuestion?.focusArea ?? ""
  const currentQuestionId = currentQuestion?.id ?? ""
  useEffect(() => {
    activeQuestionIdRef.current = currentQuestionId || null
  }, [currentQuestionId])
  const personaSource = activePlan?.persona ?? fallbackPersona
  const personaVoiceProfile = useMemo(
    () => resolvePersonaVoice(personaSource.personaId, personaSource.voiceStyleId),
    [personaSource.personaId, personaSource.voiceStyleId],
  )
  const personaVoiceLabel = personaVoiceProfile.label ?? personaSource.voiceStyle ?? fallbackPlan.persona.voiceStyle!
  const personaInsights = useMemo(() => {
    if (!activePlan?.guidance) return defaultInsights
    return [activePlan.guidance, ...defaultInsights.filter((tip) => tip !== activePlan.guidance)]
  }, [activePlan])
  const personaGreetingLine = useMemo(() => {
    return personaVoiceProfile.greetingText ?? buildPersonaGreetingLine(personaSource)
  }, [personaVoiceProfile, personaSource])
  const personaIdentity = useMemo(() => getPersonaIdentity(personaSource), [personaSource])
  const personaPlanKey = useMemo(
    () => `${personaSource.personaId}:${questions.length}`,
    [personaSource.personaId, questions.length],
  )

  const handleRecorderStart = useCallback(() => {
    setRecorderError(null)
  }, [])

  const handleRecorderError = useCallback((message: string) => {
    setRecorderError(message)
  }, [])

  const speechRecorder = useSpeechRecorder({
    language: "en-US",
    continuous: true,
    interimResults: true,
    onStarted: handleRecorderStart,
    onError: handleRecorderError,
  })
  const {
    isSupported: isSpeechSupported,
    status: recorderStatus,
    transcript: recorderTranscript,
    interimTranscript: recorderInterim,
    error: recorderHookError,
    durationMs: recorderDurationMs,
    isSpeechDetected,
    start: startRecorder,
    stop: stopRecorder,
    reset: resetRecorder,
  } = speechRecorder

  const activeResponse = currentQuestionId ? questionResponses[currentQuestionId] : undefined
  const liveTranscript = useMemo(() => {
    const base = recorderTranscript.trim()
    const interim = recorderInterim.trim()
    if (interim) {
      return `${base ? `${base} ` : ""}${interim}`
    }
    return base
  }, [recorderInterim, recorderTranscript])
  const isMicLive = !isMuted && recorderStatus === "listening"
  const hasTranscript = Boolean(activeResponse?.transcript?.length)
  const displayedDurationMs = isMicLive
    ? recorderDurationMs
    : activeResponse?.durationMs ?? recorderDurationMs
  const shouldShowTextFallback = recorderStatus === "error" && 
    recorderError && 
    (recorderError.toLowerCase().includes("denied") || 
     recorderError.toLowerCase().includes("not-allowed") || 
     recorderError.toLowerCase().includes("not available") ||
     recorderError.toLowerCase().includes("unavailable"))
  const micStatusLabel = useMemo(() => {
    if (recorderStatus === "error") {
      return "Mic unavailable"
    }
    if (isMicLive) {
      return "Mic live"
    }
    if (isMuted) {
      return "Mic muted"
    }
    if (hasTranscript) {
      return "Response captured"
    }
    return "Mic ready"
  }, [hasTranscript, isMicLive, isMuted, recorderStatus])
  const consumedFollowUps = currentQuestionId ? followUpHistory[currentQuestionId] ?? 0 : 0
  const remainingFollowUps = currentQuestion ? (currentQuestion.followUps?.length ?? 0) - consumedFollowUps : 0
  const answeredCount = Math.min(currentQuestionIndex, totalQuestions)
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const progressLabel = hasPlan ? `Question ${clampedIndex + 1} of ${totalQuestions}` : ""
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
  const isFinalQuestion = hasPlan && clampedIndex === totalQuestions - 1
  const advanceButtonLabel = activeFollowUp
    ? "Ready to move on"
    : remainingFollowUps > 0
      ? "Continue"
      : isFinalQuestion
        ? "Wrap up interview"
        : "Ready for next question"
  const advanceButtonDisabled = planLoading || !hasPlan || recorderStatus === "listening"
  const agendaToggleLabel = showAgenda ? "Hide agenda" : "View agenda"
  const progressSteps = ["Upload", "Review brief", "Mock room", "Coach Card"]

  useEffect(() => {
    if (recorderHookError) {
      setRecorderError(recorderHookError)
    }
  }, [recorderHookError])

  useEffect(() => {
    if (!hasPlan) {
      setQuestionStatuses([])
      setFollowUpHistory({})
      setActiveFollowUp(null)
      return
    }

    if (personaInitRef.current !== personaPlanKey) {
      personaInitRef.current = personaPlanKey
      setCurrentQuestionIndex(0)
      setFollowUpHistory({})
      setActiveFollowUp(null)
      setShowAgenda(false)
      lastSpokenQuestionRef.current = null
      setGreetingCompleted(false)
      setQuestionResponses({})
      responsesRef.current = {}
      setShowUnmuteHint(false)
    }
  }, [hasPlan, personaPlanKey])

  useEffect(() => {
    if (!hasPlan || typeof window === "undefined") {
      return
    }
    if (Object.keys(questionResponses).length > 0) {
      return
    }
    try {
      const raw = window.sessionStorage.getItem(RESPONSES_CACHE_KEY)
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw) as {
        cacheKey?: string
        responses?: Record<string, QuestionResponseRecord>
      } | null
      if (!parsed || parsed.cacheKey !== personaPlanKey || !parsed.responses) {
        return
      }
      const restored = parsed.responses
      if (Object.keys(restored).length === 0) {
        return
      }
      setQuestionResponses(restored)
      responsesRef.current = restored
    } catch (error) {
      console.warn("Failed to restore cached responses", error)
    }
  }, [hasPlan, personaPlanKey, questionResponses])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      const payload = {
        cacheKey: personaPlanKey,
        responses: questionResponses,
        updatedAt: Date.now(),
      }
      window.sessionStorage.setItem(RESPONSES_CACHE_KEY, JSON.stringify(payload))
    } catch (error) {
      console.warn("Failed to persist responses", error)
    }
  }, [personaPlanKey, questionResponses])

  useEffect(() => {
    if (!hasPlan) {
      setQuestionStatuses([])
      return
    }

    setQuestionStatuses(
      questions.map((_, idx) => {
        if (idx < currentQuestionIndex) return "answered"
        if (idx === currentQuestionIndex) return "active"
        return "pending"
      }),
    )
  }, [hasPlan, questions, currentQuestionIndex])

  useEffect(() => {
    if (followUpAudioRef.current) {
      followUpAudioRef.current.pause()
      followUpAudioRef.current = null
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause()
      questionAudioRef.current = null
    }
    setActiveFollowUp(null)
    setIsVoicePlaying(false)
  }, [currentQuestionIndex])

  useEffect(() => {
    if (
      !pendingRecorderStart ||
      showIntro ||
      planLoading ||
      isVoicePlaying ||
      recorderStatus === "listening" ||
      !currentQuestionId ||
      !isSpeechSupported
    ) {
      return
    }

    if (isMuted) {
      setShowUnmuteHint(true)
      return
    }

    const started = startRecorder()
    if (!started) {
      setPendingRecorderStart(false)
    } else {
      activeQuestionIdRef.current = currentQuestionId
      setRecorderError(null)
      setPendingRecorderStart(false)
      setShowUnmuteHint(false)
    }
  }, [
    currentQuestionId,
    isMuted,
    isSpeechSupported,
    isVoicePlaying,
    pendingRecorderStart,
    planLoading,
    recorderStatus,
    showIntro,
    startRecorder,
  ])

  useEffect(() => {
    if (isMuted && recorderStatus === "listening") {
      stopRecorder()
    }
  }, [isMuted, recorderStatus, stopRecorder])

  useEffect(() => {
    if (isMicLive) {
      setShowUnmuteHint(false)
    }
  }, [isMicLive])

  useEffect(() => {
    const previous = lastRecorderStatusRef.current
    if (
      (previous === "listening" || previous === "stopping") &&
      recorderStatus === "idle" &&
      currentQuestionId
    ) {
      const finalTranscript = recorderTranscript.trim()
      const duration = recorderDurationMs
      setQuestionResponses((prev) => {
        const existing = prev[currentQuestionId]
        if (!finalTranscript) {
          if (!existing) {
            return prev
          }
          const next = { ...prev }
          delete next[currentQuestionId]
          return next
        }

        const nextRecord: QuestionResponseRecord = {
          transcript: finalTranscript,
          durationMs: duration,
          updatedAt: Date.now(),
        }
        if (
          existing &&
          existing.transcript === nextRecord.transcript &&
          existing.durationMs === nextRecord.durationMs
        ) {
          return prev
        }
        
        // Telemetry: Track question answered
        console.log('[Telemetry] onQuestionAnswered', {
          questionId: currentQuestionId,
          answerLength: finalTranscript.length,
          isVoice: true,
          durationMs: duration,
          timestamp: Date.now()
        })
        
        return { ...prev, [currentQuestionId]: nextRecord }
      })
      resetRecorder()
    }
    lastRecorderStatusRef.current = recorderStatus
  }, [currentQuestionId, recorderDurationMs, recorderStatus, recorderTranscript, resetRecorder])

  const requestPersonaSpeech = useCallback(
    async (text: string): Promise<string | null> => {
      const trimmed = text?.trim()
      if (!trimmed) return null
      const cacheKey = `${personaSource.personaId}:${personaSource.voiceStyleId ?? "default"}:${trimmed}`
      const cached = speechCacheRef.current.get(cacheKey)
      if (cached) {
        return cached
      }

      try {
        const response = await fetch("/api/voice-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personaId: personaSource.personaId,
            voiceStyleId: personaSource.voiceStyleId,
            questionText: trimmed,
          }),
        })

        if (!response.ok) {
          const message = await response.text().catch(() => "")
          throw new Error(message || "Unable to fetch persona speech")
        }

        const data = (await response.json()) as { audioUrl?: string | null; mocked?: boolean }
        if (!data?.audioUrl) {
          return null
        }

        speechCacheRef.current.set(cacheKey, data.audioUrl)
        return data.audioUrl
      } catch (error) {
        console.error("Persona speech request failed", error)
        return null
      }
    },
    [personaSource.personaId, personaSource.voiceStyleId],
  )

  const resolvedVoiceId = useMemo(
    () => personaVoiceProfile.elevenLabsVoiceId,
    [personaSource.personaId, personaSource.voiceStyleId],
  )

  const cleanupAudio = useCallback((audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onpause = null
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const playQuestionPrompt = useCallback(
    async (prompt: string, questionId: string | null | undefined) => {
      if (!prompt?.trim() || !questionId) {
        return
      }

      if (recorderStatus === "listening") {
        stopRecorder()
      }
      setPendingRecorderStart(false)

      cleanupAudio(questionAudioRef)
      cleanupAudio(followUpAudioRef)

      const audioUrl = await requestPersonaSpeech(prompt)
      if (!audioUrl) {
        setPendingRecorderStart(true)
        if (isMuted) {
          setShowUnmuteHint(true)
        }
        return
      }

      const audio = new Audio(audioUrl)
      questionAudioRef.current = audio
      setIsVoicePlaying(true)
      lastSpokenQuestionRef.current = questionId

      audio.play().catch((error) => {
        console.error("Failed to play question prompt", error)
        if (questionAudioRef.current === audio) {
          questionAudioRef.current = null
        }
        setIsVoicePlaying(false)
        if (lastSpokenQuestionRef.current === questionId) {
          lastSpokenQuestionRef.current = null
        }
      })

      const reset = () => {
        if (questionAudioRef.current === audio) {
          questionAudioRef.current = null
        }
        setIsVoicePlaying(false)
        if (lastSpokenQuestionRef.current === questionId) {
          lastSpokenQuestionRef.current = null
        }
        setPendingRecorderStart(true)
        if (isMuted) {
          setShowUnmuteHint(true)
        }
      }

      audio.onended = reset
      audio.onpause = reset
    },
    [isMuted, recorderStatus, requestPersonaSpeech, stopRecorder, cleanupAudio],
  )

  const playFollowUpLine = useCallback(
    async (prompt: string) => {
      if (!prompt?.trim()) {
        return
      }

      if (recorderStatus === "listening") {
        stopRecorder()
      }
      setPendingRecorderStart(false)

      cleanupAudio(followUpAudioRef)

      const audioUrl = await requestPersonaSpeech(prompt)
      if (!audioUrl) {
        setIsVoicePlaying(false)
        setPendingRecorderStart(true)
        if (isMuted) {
          setShowUnmuteHint(true)
        }
        return
      }

      const audio = new Audio(audioUrl)
      followUpAudioRef.current = audio
      setIsVoicePlaying(true)

      audio.play().catch((error) => {
        console.error("Failed to play follow-up line", error)
        if (followUpAudioRef.current === audio) {
          followUpAudioRef.current = null
        }
        setIsVoicePlaying(false)
      })

      const reset = () => {
        if (followUpAudioRef.current === audio) {
          followUpAudioRef.current = null
        }
        setIsVoicePlaying(false)
        setPendingRecorderStart(true)
        if (isMuted) {
          setShowUnmuteHint(true)
        }
      }

      audio.onended = reset
      audio.onpause = reset
    },
    [isMuted, recorderStatus, requestPersonaSpeech, stopRecorder, cleanupAudio],
  )

  const handleAdvance = useCallback(async () => {
    if (!hasPlan || !questions.length) {
      return
    }

    const question = questions[currentQuestionIndex]
    if (!question) {
      return
    }

    setPendingRecorderStart(false)

    const followUps = Array.isArray(question.followUps) ? question.followUps : []
    const consumed = followUpHistory[question.id] ?? 0

    if (questionAudioRef.current) {
      questionAudioRef.current.pause()
      questionAudioRef.current = null
    }

    if (activeFollowUp && activeFollowUp.questionId === question.id) {
      if (followUpAudioRef.current) {
        followUpAudioRef.current.pause()
        followUpAudioRef.current = null
      }
      setActiveFollowUp(null)
      setIsVoicePlaying(false)
    } else if (followUps.length > consumed) {
      const nextFollowUp = followUps[consumed]
      if (nextFollowUp) {
        setActiveFollowUp({ questionId: question.id, prompt: nextFollowUp })
        setFollowUpHistory((prev) => ({ ...prev, [question.id]: consumed + 1 }))
        await playFollowUpLine(nextFollowUp)
      }
      return
    }

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      lastSpokenQuestionRef.current = null
    } else {
      // Telemetry: Track interview completion
      const answeredCount = Object.keys(questionResponses).length
      const totalQuestions = questions.length
      console.log('[Telemetry] onFinishInterview', {
        totalQuestions,
        answeredCount,
        timestamp: Date.now()
      })
      
      router.push("/results")
    }
  }, [activeFollowUp, currentQuestionIndex, followUpHistory, hasPlan, playFollowUpLine, questions, questionResponses, router])

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      if (next) {
        stopRecorder()
        setShowUnmuteHint(false)
      } else {
        setRecorderError(null)
        setShowUnmuteHint(false)
        if (!isVoicePlaying && recorderStatus !== "listening") {
          setPendingRecorderStart(true)
        }
      }
      return next
    })
  }, [isVoicePlaying, recorderStatus, stopRecorder])

  useEffect(() => {
    if (!hasPlan || planLoading || showIntro || isGreetingActive || !greetingCompleted) {
      return
    }

    const question = questions[currentQuestionIndex]
    if (!question) {
      return
    }

    if (lastSpokenQuestionRef.current === question.id || questionAudioRef.current) {
      return
    }

    void playQuestionPrompt(question.prompt ?? "", question.id)
  }, [currentQuestionIndex, greetingCompleted, hasPlan, isGreetingActive, playQuestionPrompt, questions, showIntro])

  useEffect(() => {
    if (showIntro) {
      setIsGreetingActive(false)
      setPendingRecorderStart(false)
      setShowUnmuteHint(false)
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
        if (personaId && personaId === payload!.persona.personaId) {
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
            setPlanStatus("error")
            const fallbackGenerated = buildFallbackPlan(payload!.persona)
            setFallbackPlanState(fallbackGenerated)
            setInterviewPlan(null)
            setCurrentQuestionIndex(0)
            window.sessionStorage.removeItem(PLAN_CACHE_KEY)
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
    if (!hasPlan) {
      setGreetingAudioUrl(null)
      greetingFetchKeyRef.current = null
      greetingPlaybackRef.current = false
      return
    }

    const key = `${personaSource.personaId}-${personaSource.voiceStyleId ?? "default"}`
    if (greetingFetchKeyRef.current === key && greetingAudioUrl) {
      return
    }

    let cancelled = false
    greetingFetchKeyRef.current = key
    greetingPlaybackRef.current = false

    requestPersonaSpeech(personaGreetingLine).then((audioUrl) => {
      if (cancelled) return
      setGreetingAudioUrl(audioUrl)
    })

    return () => {
      cancelled = true
    }
  }, [hasPlan, personaSource.personaId, personaSource.voiceStyleId, personaGreetingLine, requestPersonaSpeech, greetingAudioUrl])

  useEffect(() => {
    if (showIntro || planLoading || !hasPlan) {
      if (showIntro) {
        greetingPlaybackRef.current = false
        if (greetingAudioRef.current) {
          greetingAudioRef.current.pause()
          greetingAudioRef.current = null
        }
        setIsVoicePlaying(false)
      }
      return
    }

    if (greetingPlaybackRef.current) {
      return
    }

    const playGreeting = async () => {
      greetingPlaybackRef.current = true
      setGreetingCompleted(false)
      try {
        cleanupAudio(greetingAudioRef)
        
        let audioUrl = greetingAudioUrl
        if (!audioUrl) {
          audioUrl = await requestPersonaSpeech(personaGreetingLine)
          if (audioUrl) {
            setGreetingAudioUrl(audioUrl)
          } else {
            setIsVoicePlaying(false)
            setIsGreetingActive(false)
            setGreetingCompleted(true)
            return
          }
        }

        const audio = new Audio(audioUrl)
        greetingAudioRef.current = audio
        setIsVoicePlaying(true)
        setIsGreetingActive(true)

        audio.play().catch((error) => {
          console.error("Failed to play greeting audio", error)
          if (greetingAudioRef.current === audio) {
            greetingAudioRef.current = null
          }
          setIsVoicePlaying(false)
          setIsGreetingActive(false)
          setGreetingCompleted(true)
        })

        const reset = () => {
          if (greetingAudioRef.current === audio) {
            greetingAudioRef.current = null
          }
          setIsVoicePlaying(false)
          setIsGreetingActive(false)
          lastSpokenQuestionRef.current = null
          setGreetingCompleted(true)
        }

        audio.onended = reset
        audio.onpause = reset
      } catch (error) {
        console.error("Greeting playback error", error)
        setIsVoicePlaying(false)
        setIsGreetingActive(false)
        setGreetingCompleted(true)
      }
    }

    void playGreeting()
  }, [showIntro, planLoading, hasPlan, greetingAudioUrl, personaGreetingLine, playQuestionPrompt, requestPersonaSpeech, cleanupAudio])

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

  const handleJoinInterview = useCallback(() => {
    // Telemetry: Track interview start
    console.log('[Telemetry] onStartInterview', {
      personaId: personaSource?.personaId,
      questionCount: questions.length,
      timestamp: Date.now()
    })
    setShowIntro(false)
  }, [personaSource?.personaId, questions.length])

  const containerClasses = cn(
    "relative min-h-screen w-full flex flex-col items-center justify-start px-3 py-16 transition-transform duration-500 ease-out md:px-8",
    currentTheme.container,
    isFullscreen && "scale-[1.02]",
  )
  const questionBubbleClasses = cn(
    "absolute top-6 left-1/2 z-20 w-[92%] max-w-2xl -translate-x-1/2 text-center transition-opacity duration-300 md:top-8",
    currentTheme.questionBubble,
    showIntro ? "pointer-events-none opacity-0" : "opacity-100",
  )
  const questionTextClass = cn("transition-colors duration-300", currentTheme.questionText)
  const questionMetaClass = cn("transition-colors duration-300", currentTheme.questionMeta)
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
  const advanceButtonClass = cn(
    currentTheme.menuButton,
    "w-full justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60",
  )

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      cleanupAudio(greetingAudioRef)
      cleanupAudio(questionAudioRef)
      cleanupAudio(followUpAudioRef)
    }
  }, [cleanupAudio])

  return (
    <div className={containerClasses}>
      <StepIndicator steps={progressSteps} currentIndex={2} className="top-4 w-full max-w-3xl" />
      <InsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        voiceLabel={personaVoiceLabel}
        insights={personaInsights}
      />

      {!isSpeechSupported && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 px-6 text-center backdrop-blur-xl">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/15 bg-[#141c2f]/95 px-8 py-10 text-white shadow-2xl shadow-black/40">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Voice practice</p>
            <h2 className="text-2xl font-semibold">Use Chrome or Edge for live speech</h2>
            <p className="text-sm text-white/70">
              Real-time capture relies on the Web Speech API. Reopen Mock Interviewer in the latest Chrome or Microsoft Edge to continue.
            </p>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-30">
        <NextLink href="/setup">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition-all hover:bg-black/40 hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Setup</span>
          </button>
        </NextLink>
      </div>

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
      {showAgenda && hasPlan && (
        <div className="absolute right-6 top-24 z-30 w-64 rounded-2xl border border-white/15 bg-white/10 p-4 text-left text-xs shadow-xl shadow-black/30 backdrop-blur">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70">Agenda</p>
          <div className="mt-3 space-y-2">
            {questions.map((question, idx) => {
              const status = questionStatuses[idx] ?? "pending"
              const canNavigate = idx <= clampedIndex
              const label = idx === clampedIndex ? "Current" : status === "answered" ? "Answered" : "Pending"
              const response = questionResponses[question.id ?? ""]
              const transcriptCaptured = Boolean(response?.transcript)
              return (
                <div
                  key={question.id ?? idx}
                  role="button"
                  tabIndex={canNavigate ? 0 : -1}
                  aria-disabled={!canNavigate}
                  onClick={() => {
                    if (!canNavigate) return
                    setShowAgenda(false)
                    setCurrentQuestionIndex(idx)
                  }}
                  onKeyDown={(event) => {
                    if (!canNavigate) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setShowAgenda(false)
                      setCurrentQuestionIndex(idx)
                    }
                  }}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left transition outline-none",
                    canNavigate
                      ? "border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
                      : "border-white/5 bg-white/5 cursor-not-allowed opacity-60",
                    idx === clampedIndex && "ring-1 ring-white/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-semibold text-white">Q{idx + 1}</span>
                    <span className="text-[0.55rem] uppercase tracking-[0.25em] text-white/60">{label}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[0.7rem] text-white/70">{question.prompt}</p>
                  {transcriptCaptured && (
                    <p className="mt-1 text-[0.6rem] text-emerald-300">
                      Captured · {formatDuration(response?.durationMs ?? 0)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!showIntro && !planLoading && hasPlan && (
        <div className={liveBadgeClass}>
          <span className="inline-flex h-2 w-2 rounded-full bg-current animate-pulse" aria-hidden="true" />
          Live · {questionPositionLabel}
        </div>
      )}

      <div className={questionBubbleClasses}>
        {!planLoading && hasPlan && (
          <div className="mb-2 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.35em]">
            <span className={cn("font-semibold", currentTheme.questionMeta)}>{progressLabel}</span>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowAgenda((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setShowAgenda((prev) => !prev)
                }
              }}
              className={cn(
                "rounded-full px-3 py-1 text-[0.6rem] font-semibold transition outline-none",
                "border border-transparent",
                showAgenda
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40",
              )}
            >
              {agendaToggleLabel}
            </div>
          </div>
        )}
        {isGreetingActive && !planLoading && (
          <div
            className={cn(
              "mb-2 text-center text-[0.7rem] uppercase tracking-[0.35em] opacity-80",
              currentTheme.questionMeta,
            )}
          >
            {personaIdentity.interviewerName} says
            <p className={cn("mt-2 text-sm italic leading-relaxed normal-case tracking-normal", currentTheme.questionText)}>
              {personaGreetingLine}
            </p>
          </div>
        )}
        <p className={cn("text-[15px] font-medium leading-snug", currentTheme.questionText)}>
          {planLoading ? (
            <span
              className="inline-flex h-5 w-48 animate-pulse rounded-full opacity-40 sm:w-64"
              style={{ backgroundColor: "currentColor" }}
            />
          ) : (
            questionHeading
          )}
        </p>
        <p className={cn("mt-1 text-[11px] opacity-80", currentTheme.questionMeta)}>
          {planLoading ? (
            <span
              className="inline-flex h-3 w-40 animate-pulse rounded-full opacity-30 sm:w-52"
              style={{ backgroundColor: "currentColor" }}
            />
          ) : (
            questionMetaText
          )}
        </p>
        {!planLoading && hasPlan && (isMicLive || liveTranscript || hasTranscript) && (
          <div className="mt-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left">
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">Your response</p>
              <button
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                className="text-[11px] underline text-white/70 hover:text-white/90 transition-colors"
              >
                {isTranscriptExpanded ? "▼ Hide" : "▶ Show"}
              </button>
            </div>
            {isTranscriptExpanded && (
              <p className={cn("mt-2 text-[12px] leading-relaxed max-h-[60px] overflow-y-auto", currentTheme.questionText)}>
                {isMicLive
                  ? liveTranscript || "Listening…"
                  : hasTranscript
                    ? activeResponse?.transcript
                    : "Waiting for your answer…"}
              </p>
            )}
          </div>
        )}
        {recorderError && !planLoading && (
          <p className="mt-3 text-xs text-amber-300">{recorderError}</p>
        )}
        {planLoading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs opacity-80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current/80" aria-hidden="true" />
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
        {activeFollowUp && !planLoading && (
          <div className="mt-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">Follow-up</p>
            <p className={cn("mt-2 text-sm font-medium", currentTheme.questionText)}>{activeFollowUp.prompt}</p>
          </div>
        )}
      </div>

      {/* Progress bar moved outside of bubble */}
      {!showIntro && !planLoading && hasPlan && (
        <div className="absolute top-[calc(100%-8rem)] left-1/2 -translate-x-1/2 w-[92%] max-w-2xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/80 transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

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
                <InterviewerAvatar isSpeaking={isVoicePlaying} />
              </div>
              <div className={cn("absolute top-5 left-5", namePlateClass)}>{personaIdentity.interviewerName}</div>
              <div className={cn("absolute bottom-5 left-5", statusPlateClass)}>
                {isVoicePlaying ? "Now speaking" : personaIdentity.interviewerTitle}
              </div>
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
                  className="h-full w-full -scale-x-100 object-cover transition-shadow duration-500"
                />
              )}
              <div className={cn("absolute top-5 left-5", namePlateClass)}>You</div>
              <div className={cn("absolute bottom-5 left-5", statusPlateClass)}>
                {micStatusLabel}
              </div>
              {(
                isMicLive
              ) && (
                <div className="pointer-events-none absolute inset-x-10 bottom-10 flex justify-center">
                  <Waveform isActive />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cn(!showIntro && "opacity-0 pointer-events-none", "transition-opacity duration-300")}>
        <div
          className={cn(
            "absolute inset-0 z-30 flex items-center justify-center",
            introOverlayClass,
          )}
        >
          {/* Mode Switcher Button */}
          <div className="absolute top-6 right-6">
            <Link href="/sim">
              <Button variant="outline" size="sm" className="group border-white/30 hover:bg-white/10 text-white">
                Try CS Training →
              </Button>
            </Link>
          </div>
          
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
              <button onClick={handleJoinInterview} className={joinButtonClass}>
                Join interview
              </button>
            </div>
            {planStatus === "error" && planError && (
              <p className="mt-3 text-xs text-amber-300">{planError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
