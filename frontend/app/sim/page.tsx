"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import CoachCard from "@/components/CoachCard"
import { MicButton } from "@/components/mic-button"
import { Waveform } from "@/components/waveform"
import { useSpeechRecorder } from "@/hooks/use-speech-recorder"
import { Button } from "@/components/ui/button"

type EvaluationFeedback = {
  empathy: number
  clarity: number
  resolution: number
  tip: string
  summary?: string
}

export default function SimPage() {
  const [prompt, setPrompt] = useState<string>("")
  const [loadingScenario, setLoadingScenario] = useState<boolean>(false)
  const [ttsLoading, setTtsLoading] = useState<boolean>(false)
  const [evaluating, setEvaluating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<EvaluationFeedback | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const {
    isSupported,
    status,
    transcript,
    interimTranscript,
    error: recorderError,
    isSpeechDetected,
    start,
    stop,
    reset,
  } = useSpeechRecorder({ language: "en-US", continuous: false, interimResults: true })

  const isListening = status === "listening"

  const canRecord = useMemo(() => isSupported && !loadingScenario && !ttsLoading && !evaluating, [isSupported, loadingScenario, ttsLoading, evaluating])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch {}
      audioRef.current = null
    }
  }, [])

  const playAudioUrl = useCallback((audioUrl: string | null) => {
    stopAudio()
    if (!audioUrl) return
    const el = new Audio(audioUrl)
    audioRef.current = el
    el.play().catch(() => {})
  }, [stopAudio])

  const fetchScenario = useCallback(async () => {
    setError(null)
    setFeedback(null)
    setLoadingScenario(true)
    stopAudio()
    reset()
    try {
      const body = { difficulty: "easy" }

      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to load scenario.")
        throw new Error(msg || "Failed to load scenario.")
      }
      const data = await res.json()
      const scenarioPrompt = data?.prompt as string | undefined
      if (!scenarioPrompt) throw new Error("No scenario prompt returned.")
      setPrompt(scenarioPrompt)

      setTtsLoading(true)
      const tts = await fetch("/api/voice-say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scenarioPrompt, voice: "mentor" }),
      })
      if (tts.ok) {
        const blob = await tts.blob()
        playAudioUrl(URL.createObjectURL(blob))
      } else {
        // Non-fatal: allow user to proceed even if TTS fails
        const msg = await tts.text().catch(() => "TTS failed")
        console.warn("TTS failed", msg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error loading scenario."
      setError(msg)
    } finally {
      setLoadingScenario(false)
      setTtsLoading(false)
    }
  }, [playAudioUrl, reset, stopAudio])

  const evaluateResponse = useCallback(async () => {
    if (!transcript) return
    setError(null)
    setEvaluating(true)
    try {
      const payload = { question: prompt, answer: transcript }
      console.log("[Sim] Submitting evaluation payload:", payload)
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to evaluate.")
        throw new Error(msg || "Failed to evaluate.")
      }
      const evaluation = await res.json()
      console.log("[Sim] Evaluation response:", evaluation)
      const empathy = clampPercent(Number(evaluation.empathy))
      const clarity = clampPercent(Number(evaluation.clarity))
      const resolution = clampPercent(Number(evaluation.resolution))
      const tip: string = String(
        evaluation.tip ?? "Acknowledge the customer's feelings and propose a clear next step.",
      )
      const summary: string | undefined = evaluation.summary || undefined

      setFeedback({ empathy, clarity, resolution, tip, summary })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error during evaluation."
      setError(msg)
    } finally {
      setEvaluating(false)
    }
  }, [prompt, transcript])

  // Start with first scenario
  useEffect(() => {
    fetchScenario()
  }, [fetchScenario])

  // When recording stops (status goes from listening -> idle) and we have a transcript, evaluate
  const previousStatusRef = useRef(status)
  useEffect(() => {
    const prev = previousStatusRef.current
    if (prev === "listening" && status === "idle" && transcript.trim()) {
      console.log("[Sim] Recording stopped. Transcript:", transcript)
      evaluateResponse()
    }
    previousStatusRef.current = status
  }, [evaluateResponse, status, transcript])

  const onMicClick = useCallback(() => {
    if (!canRecord) return
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [canRecord, isListening, start, stop])

  const onNextScenario = useCallback(() => {
    fetchScenario()
  }, [fetchScenario])

  return (
    <div className="min-h-screen w-full bg-[#FFF8F5]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Simulation</h1>
          <p className="text-sm text-muted-foreground">Practice handling real customer scenarios with instant coaching.</p>
        </motion.div>

        <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-muted-foreground">Current customer prompt</div>
              <div className="mt-2 whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-[15px] leading-relaxed">
                {loadingScenario ? "Loading scenario..." : prompt || "—"}
              </div>
            </div>
            <div className="shrink-0">
              <Button size="sm" variant="secondary" onClick={fetchScenario} disabled={loadingScenario || ttsLoading}>
                {loadingScenario || ttsLoading ? "Refreshing..." : "New Prompt"}
              </Button>
            </div>
          </div>
          {error ? (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col items-center gap-6">
          <Waveform isActive={isListening || isSpeechDetected} />
          <MicButton isListening={isListening} onClick={onMicClick} />
          <div className="text-xs text-muted-foreground">
            {recorderError ? (
              <span className="text-red-600">{recorderError}</span>
            ) : isListening ? (
              <span>Listening... speak now</span>
            ) : transcript ? (
              <span>Recorded. Tap mic to re-record.</span>
            ) : (
              <span>Tap the mic to respond</span>
            )}
          </div>
        </div>

        {evaluating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-center">
            <div className="rounded-lg border bg-white px-6 py-4 text-sm shadow-sm">Evaluating response…</div>
          </motion.div>
        )}

        {feedback && !evaluating && (
          <div className="mt-8">
            <CoachCard
              empathy={feedback.empathy}
              clarity={feedback.clarity}
              resolution={feedback.resolution}
              tip={feedback.tip}
              summary={feedback.summary}
              onNext={onNextScenario}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function clampPercent(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}


