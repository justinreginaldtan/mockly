"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Lightbulb, Mic, MicOff, Video, VideoOff } from "lucide-react"
import EnhancedNavHeader from "@/components/enhanced-nav-header"
import { InsightsDrawer } from "@/components/interview/insights-drawer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PLAN_CACHE_KEY } from "@/lib/cache-keys"
import type { InterviewPlan } from "@/lib/gemini"
import { useSpeechRecorder, type RecorderStatus } from "@/hooks/use-speech-recorder"
import { speakWithBrowserTts, stopBrowserTts } from "@/lib/browser-tts"
import type { ProviderStatusPayload } from "@/lib/provider-status"

type InterviewerStatus = "idle" | "listening" | "thinking"
type ResponseSource = "voice" | "typed"

type ResponseQuality = {
  score: number
  wordCount: number
  strengths: string[]
  improvements: string[]
}

function analyzeResponseQuality(response: string): ResponseQuality {
  const clean = response.trim()
  if (!clean) {
    return {
      score: 0,
      wordCount: 0,
      strengths: [],
      improvements: ["Start with a concrete example from your experience."],
    }
  }

  const words = clean.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  let score = 40
  const strengths: string[] = []
  const improvements: string[] = []

  if (wordCount >= 45) {
    score += 18
    strengths.push("Strong detail depth for follow-up questions.")
  } else if (wordCount >= 25) {
    score += 10
    strengths.push("Good base detail.")
  } else {
    improvements.push("Add more context and action (aim for 40-90 words).")
  }

  const hasStarSignals = /(challenge|situation|task|action|result|impact|outcome)/i.test(clean)
  if (hasStarSignals) {
    score += 16
    strengths.push("Clear STAR-style structure.")
  } else {
    improvements.push("Use a STAR arc: context, action, and measurable result.")
  }

  const hasMetrics = /\b\d+(?:\.\d+)?%?\b/.test(clean)
  if (hasMetrics) {
    score += 14
    strengths.push("Quantified impact with metrics.")
  } else {
    improvements.push("Include one metric (%, time saved, users, revenue, latency, etc.).")
  }

  const ownsWork = /\bI\b|\bmy\b|\bme\b/i.test(clean)
  if (ownsWork) {
    score += 8
    strengths.push("Clear ownership language.")
  } else {
    improvements.push("Use first-person ownership to clarify your contribution.")
  }

  const fillerCount = (clean.match(/\b(um+|uh+|like|you know)\b/gi) || []).length
  if (fillerCount >= 3) {
    score -= 8
    improvements.push("Trim filler words to sound sharper.")
  }

  score = Math.max(0, Math.min(100, score))

  if (improvements.length === 0) {
    improvements.push("Great structure. End with a brief tie-back to the role.")
  }

  return {
    score,
    wordCount,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  }
}

export default function MockInterviewPage() {
  const router = useRouter()

  const [isCameraOn, setIsCameraOn] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null)
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceFallbackActive, setVoiceFallbackActive] = useState(false)
  const [providerStatus, setProviderStatus] = useState<ProviderStatusPayload | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)

  const [showQuestionTransition, setShowQuestionTransition] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showResponseToast, setShowResponseToast] = useState(false)
  const [responseGateError, setResponseGateError] = useState<string | null>(null)
  const [typedDraft, setTypedDraft] = useState("")
  const [interviewerStatus, setInterviewerStatus] = useState<InterviewerStatus>("idle")
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({})
  const [responseSources, setResponseSources] = useState<Record<string, ResponseSource>>({})
  const [responseDurations, setResponseDurations] = useState<Record<string, number>>({})

  const [isClient, setIsClient] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasPlayedCurrentQuestion = useRef(false)
  const previousRecorderStatusRef = useRef<RecorderStatus>("idle")
  const toastTimerRef = useRef<number | null>(null)

  const {
    isSupported: isSpeechSupported,
    status: recorderStatus,
    transcript,
    interimTranscript,
    error: recorderError,
    durationMs,
    start: startRecorder,
    stop: stopRecorder,
    reset: resetRecorder,
  } = useSpeechRecorder({
    onFinal: (finalTranscript) => {
      if (!currentQuestion) return
      const clean = finalTranscript.trim()
      if (!clean) return

      setQuestionResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: clean,
      }))
      setResponseSources((prev) => ({
        ...prev,
        [currentQuestion.id]: "voice",
      }))
      setTypedDraft(clean)
    },
  })

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const cached = sessionStorage.getItem(PLAN_CACHE_KEY) ?? localStorage.getItem(PLAN_CACHE_KEY)

        if (cached) {
          const parsed = JSON.parse(cached) as InterviewPlan
          setInterviewPlan(parsed)
          setPlanLoading(false)
          return
        }

        const fallbackPlan: InterviewPlan = {
          questions: [
            { id: "1", prompt: "Tell me about yourself and your background." },
            { id: "2", prompt: "What interests you most about this role?" },
            { id: "3", prompt: "Describe a challenging project you worked on recently." },
            { id: "4", prompt: "How do you handle working under pressure?" },
            { id: "5", prompt: "What questions do you have for us?" },
          ],
          persona: {
            personaId: "professional",
            company: "TechCorp",
            role: "Senior Engineering Manager",
            focusAreas: ["Technical", "Behavioral"],
            technicalWeight: 60,
            duration: "standard",
            voiceStyleId: "professional",
          },
        }

        setInterviewPlan(fallbackPlan)
        setPlanLoading(false)
      } catch (error) {
        console.error("Failed to load interview plan", error)
        setPlanError("Failed to load interview plan.")
        setPlanLoading(false)
      }
    }

    void loadPlan()
  }, [])

  useEffect(() => {
    let active = true
    void fetch("/api/provider-status")
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setProviderStatus(data as ProviderStatusPayload)
        }
      })
      .catch(() => {
        if (active) {
          setProviderStatus(null)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const questions = useMemo(() => interviewPlan?.questions ?? [], [interviewPlan?.questions])
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const currentQuestionId = currentQuestion?.id ?? ""
  const currentQuestionText = currentQuestion?.prompt ?? ""

  const currentResponse = useMemo(() => {
    if (!currentQuestionId) return ""
    return questionResponses[currentQuestionId] ?? ""
  }, [currentQuestionId, questionResponses])

  const hasCurrentResponse = currentResponse.trim().length > 0
  const currentSource = currentQuestionId ? responseSources[currentQuestionId] : undefined

  const responseQuality = useMemo(() => analyzeResponseQuality(currentResponse), [currentResponse])

  const liveInsights = useMemo(() => {
    const focusAreas = interviewPlan?.persona?.focusAreas ?? []
    const tips: string[] = []

    if (focusAreas.length > 0) {
      tips.push(`Anchor this answer to ${focusAreas.slice(0, 2).join(" + ")}.`)
    }

    if (!hasCurrentResponse) {
      tips.push("Open with context, then your action, then measurable impact.")
    } else {
      tips.push(...responseQuality.improvements)
    }

    tips.push("Close by connecting your impact to this role's needs.")

    return Array.from(new Set(tips)).slice(0, 4)
  }, [hasCurrentResponse, interviewPlan?.persona?.focusAreas, responseQuality.improvements])

  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0
  const responseCount = useMemo(
    () => Object.values(questionResponses).filter((value) => value.trim().length > 0).length,
    [questionResponses],
  )

  useEffect(() => {
    resetRecorder()
    setResponseGateError(null)
    hasPlayedCurrentQuestion.current = false
    setTypedDraft(currentQuestionId ? (questionResponses[currentQuestionId] ?? "") : "")
  }, [currentQuestionId, questionResponses, resetRecorder])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (toastTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(toastTimerRef.current)
      }
      stopBrowserTts()
    }
  }, [])

  useEffect(() => {
    const previous = previousRecorderStatusRef.current

    if ((previous === "listening" || previous === "stopping") && recorderStatus === "idle") {
      if (currentQuestionId && (questionResponses[currentQuestionId] ?? transcript).trim()) {
        setShowResponseToast(true)
        if (typeof window !== "undefined") {
          if (toastTimerRef.current !== null) {
            window.clearTimeout(toastTimerRef.current)
          }
          toastTimerRef.current = window.setTimeout(() => {
            setShowResponseToast(false)
            toastTimerRef.current = null
          }, 1800)
        }

        setResponseDurations((prev) => ({
          ...prev,
          [currentQuestionId]: Math.max(0, Math.round(durationMs)),
        }))
      }
    }

    if (recorderStatus === "listening") {
      setInterviewerStatus("listening")
    } else if (recorderStatus === "stopping") {
      setInterviewerStatus("thinking")
    } else if (recorderStatus === "error") {
      setInterviewerStatus("idle")
    } else if (recorderStatus === "idle" && !isVoicePlaying) {
      setInterviewerStatus("idle")
    }

    previousRecorderStatusRef.current = recorderStatus
  }, [currentQuestionId, durationMs, isVoicePlaying, questionResponses, recorderStatus, transcript])

  const playQuestionVoice = useCallback(async () => {
    if (!currentQuestion || !interviewPlan?.persona) return

    try {
      setIsVoicePlaying(true)
      setVoiceError(null)
      setVoiceFallbackActive(false)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      stopBrowserTts()

      hasPlayedCurrentQuestion.current = true

      const response = await fetch("/api/voice-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: interviewPlan.persona.personaId,
          voiceStyleId: interviewPlan.persona.voiceStyleId || "professional",
          questionText: currentQuestion.prompt,
          questionId: currentQuestion.id,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            audioUrl?: string
            message?: string
            fallbackAvailable?: boolean
          }
        | null

      if (!response.ok || !payload?.audioUrl) {
        if (payload?.fallbackAvailable) {
          setVoiceFallbackActive(true)
          setVoiceError("Voice fallback active (browser TTS).")
          await speakWithBrowserTts(currentQuestion.prompt)
          setIsVoicePlaying(false)
          return
        }
        throw new Error(payload?.message || "Failed to generate voice")
      }

      const audio = new Audio(payload.audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsVoicePlaying(false)
        audioRef.current = null
      }

      audio.onerror = () => {
        setIsVoicePlaying(false)
        setVoiceError("Failed to play audio")
        audioRef.current = null
      }

      await audio.play()
    } catch (error) {
      console.error("Voice playback failed", error)
      setIsVoicePlaying(false)
      setVoiceError("Voice playback failed")
    }
  }, [currentQuestion, interviewPlan?.persona])

  useEffect(() => {
    if (!currentQuestion || !interviewPlan?.persona || hasPlayedCurrentQuestion.current) {
      return
    }

    hasPlayedCurrentQuestion.current = true
    void playQuestionVoice()
  }, [currentQuestion, interviewPlan?.persona, playQuestionVoice])

  const handleMicToggle = useCallback(() => {
    if (isClient && !isSpeechSupported) {
      return
    }

    setResponseGateError(null)

    if (recorderStatus === "listening" || recorderStatus === "stopping") {
      stopRecorder()
      return
    }

    if (recorderStatus === "error") {
      resetRecorder()
    }

    startRecorder()
  }, [isClient, isSpeechSupported, recorderStatus, resetRecorder, startRecorder, stopRecorder])

  const handleTypedDraftChange = useCallback(
    (value: string) => {
      if (!currentQuestionId) return
      setTypedDraft(value)
      setQuestionResponses((prev) => ({
        ...prev,
        [currentQuestionId]: value,
      }))
      setResponseSources((prev) => ({
        ...prev,
        [currentQuestionId]: "typed",
      }))
      setResponseGateError(null)
    },
    [currentQuestionId],
  )

  const handleUseTypedResponse = useCallback(() => {
    if (!currentQuestionId) return

    const cleaned = typedDraft.trim()
    if (!cleaned) {
      setResponseGateError("Add a typed response before continuing.")
      return
    }

    setQuestionResponses((prev) => ({
      ...prev,
      [currentQuestionId]: cleaned,
    }))
    setResponseSources((prev) => ({
      ...prev,
      [currentQuestionId]: "typed",
    }))

    setShowResponseToast(true)
    if (typeof window !== "undefined") {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current)
      }
      toastTimerRef.current = window.setTimeout(() => {
        setShowResponseToast(false)
        toastTimerRef.current = null
      }, 1800)
    }
  }, [currentQuestionId, typedDraft])

  const handleNextQuestion = useCallback(() => {
    if (!currentQuestion || currentQuestionIndex >= totalQuestions - 1) {
      return
    }

    if (!hasCurrentResponse) {
      setResponseGateError("Record or type a response before moving to the next question.")
      return
    }

    if (recorderStatus === "listening" || recorderStatus === "stopping") {
      stopRecorder()
    }

    setIsTransitioning(true)
    setShowQuestionTransition(true)

    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1)
      setInterviewerStatus("thinking")
    }, 70)

    setTimeout(() => {
      setShowQuestionTransition(false)
      setIsTransitioning(false)
      if (!isVoicePlaying) {
        setInterviewerStatus("idle")
      }
    }, 360)
  }, [currentQuestion, currentQuestionIndex, hasCurrentResponse, isVoicePlaying, recorderStatus, stopRecorder, totalQuestions])

  const handleFinishInterview = useCallback(() => {
    if (!hasCurrentResponse) {
      setResponseGateError("Add a response for this question before finishing.")
      return
    }

    const responsesData = {
      questions: questions.map((question) => ({
        id: question.id,
        text: question.prompt,
        response: (questionResponses[question.id] ?? "").trim(),
        duration: responseDurations[question.id] ?? 0,
      })),
      persona: interviewPlan?.persona?.personaId,
    }

    sessionStorage.setItem("mockly_interview_responses", JSON.stringify(responsesData))
    router.push("/results")
  }, [hasCurrentResponse, interviewPlan?.persona?.personaId, questionResponses, questions, responseDurations, router])

  const questionVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  }

  const voiceUnavailable = isClient && !isSpeechSupported

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      <EnhancedNavHeader />

      <main className="flex flex-1">
        <div className="flex flex-1 flex-col">
          <div className="border-b border-[#EDE5E0] bg-white/95 px-6 py-3">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <div className="text-sm text-[#777777]">
                Question {Math.min(currentQuestionIndex + 1, Math.max(totalQuestions, 1))} of {Math.max(totalQuestions, 1)}
              </div>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="h-full rounded-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="mx-auto mt-2 flex max-w-4xl flex-wrap gap-2 text-xs font-semibold">
              {providerStatus && (
                <>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      providerStatus.llm.mode === "live"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {providerStatus.llm.mode === "live" ? "Live AI" : "AI Fallback"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      voiceFallbackActive || providerStatus.voice.mode !== "live"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {voiceFallbackActive || providerStatus.voice.mode !== "live"
                      ? "Voice Fallback Active"
                      : "Live Voice"}
                  </span>
                </>
              )}
              {voiceUnavailable && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                  Voice Input Unavailable
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-8">
            <AnimatePresence>
              {showQuestionTransition && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.05 }}
                  className="fixed inset-0 z-10 bg-white"
                />
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                variants={questionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeOut", delay: showQuestionTransition ? 0.3 : 0 }}
                className="w-full max-w-3xl"
              >
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  {planLoading ? (
                    <div className="space-y-4">
                      <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-6 animate-pulse rounded bg-slate-200" />
                      <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                    </div>
                  ) : planError ? (
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <span className="font-semibold text-red-600">!</span>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">Something went wrong</h3>
                      <p className="mb-6 text-slate-600">{planError}</p>
                      <Button onClick={() => router.push("/setup")}>Back to Setup</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 text-left">
                            <h2 className="text-2xl font-medium leading-relaxed text-slate-900">{currentQuestionText}</h2>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={playQuestionVoice}
                              disabled={!currentQuestion || !interviewPlan?.persona || isVoicePlaying}
                              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <div className={cn("h-2 w-2 rounded-full", isVoicePlaying ? "animate-pulse bg-blue-600" : "bg-slate-300")} />
                              {isVoicePlaying ? "Playing..." : "Replay"}
                            </button>
                            <button
                              onClick={() => setDrawerOpen(true)}
                              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Lightbulb className="h-4 w-4" />
                              Insights
                            </button>
                          </div>
                        </div>

                        {voiceError && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-left">
                            <p className="text-sm text-red-700">{voiceError}</p>
                          </div>
                        )}

                        {recorderError && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                            <p className="text-sm text-amber-800">{recorderError}</p>
                          </div>
                        )}

                        {responseGateError && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                            <p className="text-sm font-medium text-amber-800">{responseGateError}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              recorderStatus === "listening"
                                ? "animate-pulse bg-blue-600"
                                : hasCurrentResponse
                                  ? "bg-emerald-500"
                                  : "bg-slate-300",
                            )}
                          />
                          <span>
                            {voiceUnavailable
                              ? "Voice input unavailable here. Use typed response below."
                              : recorderStatus === "listening"
                                ? "Listening... click again to stop."
                                : recorderStatus === "stopping"
                                  ? "Finalizing transcript..."
                                  : hasCurrentResponse
                                    ? "Response captured. You can continue or edit."
                                    : "Record or type your answer when ready."}
                          </span>
                        </div>
                      </div>

                      {(interimTranscript || transcript) && recorderStatus !== "idle" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-left"
                        >
                          <div className="mb-1 text-sm font-semibold text-blue-700">Live transcript</div>
                          <div className="text-slate-900">{(transcript || interimTranscript).trim()}</div>
                        </motion.div>
                      )}

                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-left">
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                          <span className="font-semibold text-slate-700">Answer workspace</span>
                          <span>{responseQuality.wordCount} words</span>
                        </div>
                        <textarea
                          value={typedDraft}
                          onChange={(event) => handleTypedDraftChange(event.target.value)}
                          placeholder="Type your response here if voice is unavailable or if you want to edit before continuing..."
                          className="min-h-[124px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={handleUseTypedResponse} disabled={!typedDraft.trim()}>
                            Save typed response
                          </Button>
                          {hasCurrentResponse && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              Using {currentSource === "voice" ? "voice" : "typed"} response
                            </span>
                          )}
                        </div>
                      </div>

                      {hasCurrentResponse && (
                        <div className="rounded-lg border border-[#EDE5E0] bg-white p-4 text-left">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">Response quality</p>
                            <p className="text-sm font-semibold text-blue-700">{responseQuality.score}/100</p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF]"
                              style={{ width: `${responseQuality.score}%` }}
                            />
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Doing well</p>
                              {responseQuality.strengths.map((item) => (
                                <p key={item} className="mt-1 text-sm text-slate-700">
                                  {item}
                                </p>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Upgrade next</p>
                              {responseQuality.improvements.map((item) => (
                                <p key={item} className="mt-1 text-sm text-slate-700">
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-t border-slate-200 bg-white p-6">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <motion.button
                  onClick={handleMicToggle}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  disabled={planLoading || Boolean(planError) || voiceUnavailable}
                  className={cn(
                    "relative flex items-center space-x-3 overflow-hidden rounded-full px-6 py-3 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
                    recorderStatus === "listening" || recorderStatus === "stopping"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                  title={
                    voiceUnavailable
                      ? "Voice input unavailable in this browser"
                      : recorderStatus === "listening" || recorderStatus === "stopping"
                        ? "Click to stop recording"
                        : "Click to start recording"
                  }
                >
                  {recorderStatus === "listening" || recorderStatus === "stopping" ? (
                    <>
                      <div className="relative">
                        <Mic className="h-5 w-5" />
                        {recorderStatus === "listening" && (
                          <motion.div
                            className="absolute -inset-1 rounded-full bg-blue-600"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <span>{recorderStatus === "stopping" ? "Finishing..." : "Stop recording"}</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-5 w-5" />
                      <span>{voiceUnavailable ? "Voice unavailable" : "Record answer"}</span>
                    </>
                  )}
                </motion.button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                    <Button
                      onClick={handleNextQuestion}
                      variant="outline"
                      className="relative overflow-hidden px-6 py-3"
                      disabled={isTransitioning || !hasCurrentResponse || planLoading || Boolean(planError)}
                    >
                      {isTransitioning && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      <span className="relative z-10">{isTransitioning ? "Loading..." : "Continue"}</span>
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    onClick={handleFinishInterview}
                    disabled={!hasCurrentResponse || planLoading || Boolean(planError)}
                    className="bg-emerald-600 px-6 py-3 hover:bg-emerald-700"
                  >
                    Finish Interview
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-80 flex-col border-l border-slate-200 bg-white">
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="space-y-4 text-center">
              <div className="relative">
                <motion.div
                  className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-slate-200 bg-slate-100"
                  variants={pulseVariants}
                  animate="pulse"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600">
                    <span className="text-2xl font-semibold text-white">{interviewPlan?.persona?.role?.[0] || "I"}</span>
                  </div>
                </motion.div>

                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-emerald-500">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-white"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                <AnimatePresence>
                  {interviewerStatus !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 transform"
                    >
                      <div className="rounded-full bg-slate-800 px-2 py-1 text-xs text-white">
                        {interviewerStatus === "listening" ? "listening..." : "thinking..."}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">{interviewPlan?.persona?.role || "Interviewer"}</h3>
                <p className="text-sm text-slate-600">
                  {interviewPlan?.persona?.role} at {interviewPlan?.persona?.company}
                </p>
              </div>

              <div className="rounded-lg border border-[#EDE5E0] bg-[#FFFDFC] px-3 py-2 text-left text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Session progress</p>
                <p className="mt-1">Responses captured: {responseCount}/{Math.max(totalQuestions, 1)}</p>
                <p className="mt-1">Current response source: {currentSource === "voice" ? "Voice" : currentSource === "typed" ? "Typed" : "Not saved"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-6">
            <motion.div
              className={cn(
                "relative flex aspect-video items-center justify-center overflow-hidden rounded-lg",
                isCameraOn ? "border-2 border-blue-500/30 shadow-lg" : "bg-slate-100",
              )}
              animate={
                isCameraOn
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(59, 130, 246, 0.4)",
                        "0 0 0 4px rgba(59, 130, 246, 0.1)",
                        "0 0 0 0 rgba(59, 130, 246, 0.4)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isCameraOn ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <span className="text-lg font-semibold text-white">You</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <VideoOff className="h-8 w-8 text-slate-400" />
                  <span className="text-sm text-slate-500">Camera paused</span>
                </div>
              )}

              <div className="absolute right-2 top-2">
                <button
                  onClick={() => setIsCameraOn((prev) => !prev)}
                  className={cn(
                    "rounded-full p-2 transition-colors hover:scale-110",
                    isCameraOn ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-600 text-white hover:bg-slate-700",
                  )}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showResponseToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="flex items-center space-x-2 rounded-lg bg-emerald-500 px-4 py-3 text-white shadow-lg">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Response saved</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        voiceLabel={`${interviewPlan?.persona?.role || "Interviewer"} · ${interviewPlan?.persona?.company || "Mockly"}`}
        insights={liveInsights}
      />
    </div>
  )
}
