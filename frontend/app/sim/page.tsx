"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"
import CoachCard from "@/components/CoachCard"
import { MicButton } from "@/components/mic-button"
import { Waveform } from "@/components/waveform"
import { useSpeechRecorder } from "@/hooks/use-speech-recorder"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/loading-states"
import EnhancedNavHeader from "@/components/enhanced-nav-header"

type EvaluationFeedback = {
  empathy: number
  clarity: number
  resolution: number
  tip: string
  summary?: string
  tips?: string[]
  idealResponse?: string
}

export default function SimPage() {
  useKeyboardNavigation()
  
  const [prompt, setPrompt] = useState<string>("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "nightmare">("easy")
  const [loadingScenario, setLoadingScenario] = useState<boolean>(false)
  const [ttsLoading, setTtsLoading] = useState<boolean>(false)
  const [evaluating, setEvaluating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<EvaluationFeedback | null>(null)
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false)
  const [audioFinished, setAudioFinished] = useState<boolean>(false)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [userInteractionRequired, setUserInteractionRequired] = useState<boolean>(true)
  const [queuedAudioUrl, setQueuedAudioUrl] = useState<string | null>(null)
  const [perfectScoresMode, setPerfectScoresMode] = useState<boolean>(false)
  const [showClickToStart, setShowClickToStart] = useState<boolean>(true)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false)
  const [nightmareMode, setNightmareMode] = useState<boolean>(false)
  const [nightmareIntensity, setNightmareIntensity] = useState<number>(0)
  const [audioChaos, setAudioChaos] = useState<boolean>(false)
  const [visualEffects, setVisualEffects] = useState<boolean>(false)
  const devActivationTimerRef = useRef<number | null>(null)
  const devInactivityTimerRef = useRef<number | null>(null)
  const keysDownRef = useRef<{ d: boolean; b: boolean }>({ d: false, b: false })
  const pendingScenarioRef = useRef<AbortController | null>(null)
  const pendingTtsRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isGeneratingScenarioRef = useRef<boolean>(false)
  const firstInteractionHandledRef = useRef<boolean>(false)
  const nightmareAudioRefs = useRef<HTMLAudioElement[]>([])
  const nightmareTimeoutRef = useRef<number | null>(null)
  const visualEffectTimeoutRef = useRef<number | null>(null)

  // Only initialize speech recorder after first user interaction and audio finishes
  const shouldInitializeRecorder = !showClickToStart && firstInteractionHandledRef.current && audioFinished

  // Initialize microphone stream
  const initializeMicrophone = useCallback(async () => {
    if (micPermissionGranted || micStream) {
      console.log("[Sim] Microphone already initialized")
      return micStream
    }

    try {
      console.log("[Sim] Requesting microphone permission...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      console.log("[Sim] Microphone stream obtained successfully")
      setMicStream(stream)
      setMicPermissionGranted(true)
      return stream
    } catch (error) {
      console.error("[Sim] Failed to get microphone access:", error)
      setMicPermissionGranted(false)
      return null
    }
  }, [micPermissionGranted, micStream])

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
  } = useSpeechRecorder({ 
    language: "en-US", 
    continuous: true, 
    interimResults: true,
    autoStopAfterSilenceMs: 1500, // 1.5 seconds for better speech detection
    onStarted: () => {
      console.log("[Sim] Speech recording started - microphone stream active")
    },
    onStopped: () => {
      console.log("[Sim] Speech recording stopped - transcript captured")
    },
    onFinal: (text) => {
      console.log("[Sim] Final transcript captured:", text)
      console.log("[Sim] Transcript length:", text.length, "words:", text.split(/\s+/).length)
    },
    onIntermediate: (text) => {
      console.log("[Sim] Interim transcript:", text)
    },
    onError: (error) => {
      console.error("[Sim] Speech recorder error:", error)
    },
  })

  const isListening = status === "listening"

  // Debug status changes
  useEffect(() => {
    console.log("[Sim] Speech recorder status:", status)
  }, [status])

  const canRecord = useMemo(() => {
    return isSupported && 
           !loadingScenario && 
           !ttsLoading && 
           !evaluating && 
           audioFinished && 
           !showClickToStart &&
           shouldInitializeRecorder &&
           micPermissionGranted
  }, [isSupported, loadingScenario, ttsLoading, evaluating, audioFinished, showClickToStart, shouldInitializeRecorder, micPermissionGranted])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch {}
      audioRef.current = null
    }
  }, [])



  const handleFirstUserInteraction = useCallback(async () => {
    if (userInteractionRequired && !firstInteractionHandledRef.current) {
      console.log("[Sim] First user interaction detected - initializing microphone and playing audio")
      firstInteractionHandledRef.current = true
      setUserInteractionRequired(false)
      
      // Initialize microphone stream
      await initializeMicrophone()
      
      // Play the prepared audio immediately in this user event
      if (audioRef.current) {
        console.log("[Sim] Playing prepared audio immediately in user interaction")
        try {
          await audioRef.current.play()
          console.log("[Sim] Audio play() resolved successfully in user interaction")
        } catch (error) {
          console.error("[Sim] Audio play() rejected in user interaction:", error)
          setAudioFinished(true) // Enable mic even if play fails
        }
      } else {
        // If no prepared audio, enable mic immediately
        console.log("[Sim] No prepared audio - enabling mic immediately")
        setAudioFinished(true)
      }
    }
  }, [userInteractionRequired, initializeMicrophone])

  const fetchScenario = useCallback(async (overrideDifficulty?: "easy" | "medium" | "hard" | "nightmare") => {
    // Prevent multiple simultaneous calls
    if (isGeneratingScenarioRef.current) {
      console.log("[Sim] fetchScenario already in progress, skipping")
      return
    }

    isGeneratingScenarioRef.current = true
    setError(null)
    setFeedback(null)
    setLoadingScenario(true)
    setAudioFinished(false)
    // Only set userInteractionRequired to false for subsequent scenarios (not the first one)
    if (firstInteractionHandledRef.current) {
      setUserInteractionRequired(false)
    }
    stopAudio()
    // Reset speech recorder for new scenario
    if (shouldInitializeRecorder) {
    reset()
    }

    // Cancel any pending scenario request
    if (pendingScenarioRef.current) {
      pendingScenarioRef.current.abort()
      pendingScenarioRef.current = null
    }
    if (pendingTtsRef.current) {
      pendingTtsRef.current.abort()
      pendingTtsRef.current = null
    }

    // Clear any pending debounce
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const currentDifficulty = overrideDifficulty ?? difficulty
    const newScenarioId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    setScenarioId(newScenarioId)
    console.log(`[Sim] fetchScenario called with difficulty: ${currentDifficulty}, scenarioId: ${newScenarioId}`)

    try {
      const body = { difficulty: currentDifficulty }
      const scenarioController = new AbortController()
      pendingScenarioRef.current = scenarioController

      console.log(`[Sim] POST /api/generate-scenario with body:`, body)
      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: scenarioController.signal,
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to load scenario.")
        throw new Error(msg || "Failed to load scenario.")
      }
      const data = await res.json()
      const scenarioPrompt = data?.prompt as string | undefined
      if (!scenarioPrompt) throw new Error("No scenario prompt returned.")
      setPrompt(scenarioPrompt)
      pendingScenarioRef.current = null
      console.log(`[Sim] Scenario generated (${newScenarioId}): ${scenarioPrompt.substring(0, 50)}...`)

      setTtsLoading(true)
      const ttsController = new AbortController()
      pendingTtsRef.current = ttsController
      console.log(`[Sim] POST /api/voice-say with text: ${scenarioPrompt.substring(0, 30)}...`)
      const tts = await fetch("/api/voice-say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scenarioPrompt, voice: "mentor" }),
        signal: ttsController.signal,
      })
      if (tts.ok) {
        const blob = await tts.blob()
        const audioUrl = URL.createObjectURL(blob)
        console.log(`[Sim] TTS audio generated (${blob.size} bytes), creating object URL: ${audioUrl}`)
               
               // Play audio immediately for subsequent scenarios
               console.log("[Sim] Playing subsequent scenario audio")
               setAudioFinished(false)
               const el = new Audio(audioUrl)
               audioRef.current = el
               
               el.addEventListener('loadstart', () => console.log("[Sim] Audio loading started"))
               el.addEventListener('canplay', () => console.log("[Sim] Audio can play"))
               el.addEventListener('play', () => console.log("[Sim] Audio playback started"))
               el.addEventListener('ended', () => {
                 console.log("[Sim] Audio playback ended - enabling mic")
                 setAudioFinished(true)
               })
               el.addEventListener('error', (e) => {
                 console.error("[Sim] Audio playback error:", e)
                 setAudioFinished(true) // Enable mic even if audio fails
               })
               
               // Play immediately
               el.play().then(() => {
                 console.log("[Sim] Audio play() resolved successfully")
               }).catch((error) => {
                 console.error("[Sim] Audio play() rejected:", error)
                 setAudioFinished(true) // Enable mic even if play fails
               })
      } else {
        // Non-fatal: allow user to proceed even if TTS fails
        const msg = await tts.text().catch(() => "TTS failed")
        console.warn("TTS failed", msg)
               setAudioFinished(true) // Enable mic if TTS fails
      }
      pendingTtsRef.current = null
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        console.log("[Sim] fetchScenario aborted")
        return
      }
      const msg = e instanceof Error ? e.message : "Unexpected error loading scenario."
      setError(msg)
      setAudioFinished(true) // Enable mic even if scenario generation fails
    } finally {
      setLoadingScenario(false)
      setTtsLoading(false)
      pendingScenarioRef.current = null
      pendingTtsRef.current = null
      isGeneratingScenarioRef.current = false
    }
  }, [difficulty, reset, stopAudio])

  const evaluateResponse = useCallback(async () => {
    console.log("[Sim] evaluateResponse called with:", { 
      hasTranscript: !!transcript, 
      transcriptLength: transcript?.length || 0,
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      scenarioId 
    })
    
    if (!transcript) {
      console.log("[Sim] No transcript available for evaluation")
      return
    }
    
    if (!prompt) {
      console.log("[Sim] No prompt available for evaluation")
      return
    }
    console.log(`[Sim] Evaluating response for scenario ${scenarioId}, transcript: "${transcript}"`)
    setError(null)
    setEvaluating(true)
    try {
      const payload = { 
        question: prompt, 
        answer: transcript,
        demoPerfect: perfectScoresMode
      }
      console.log("[Sim] Submitting evaluation payload:", payload)
      console.log("[Sim] transcript captured: true")
      
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      console.log("[Sim] Evaluation API response status:", res.status)
      
      if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to evaluate.")
        console.error("[Sim] Evaluation API error:", res.status, msg)
        throw new Error(msg || "Failed to evaluate.")
      }
      
      const evaluation = await res.json()
      console.log("[Sim] Evaluation response received:", evaluation)
      const empathy = clampPercent(Number(evaluation.empathy))
      const clarity = clampPercent(Number(evaluation.clarity))
      const resolution = clampPercent(Number(evaluation.resolution))
      const tip: string = String(
        evaluation.tip ?? "Acknowledge the customer's feelings and propose a clear next step.",
      )
      const summary: string | undefined = evaluation.summary || undefined
      const tips: string[] | undefined = Array.isArray(evaluation.tips) && evaluation.tips.length > 0 
        ? evaluation.tips.filter((t: unknown) => typeof t === "string" && t.trim()).slice(0, 3)
        : undefined
      const idealResponse: string | undefined = evaluation.idealResponse || undefined

      console.log(`[Sim] Feedback received for scenario ${scenarioId}: empathy=${empathy}, clarity=${clarity}, resolution=${resolution}`)
      console.log("[Sim] feedback received: true")
      
      const evaluationData = { empathy, clarity, resolution, tip, summary, tips, idealResponse }
      console.log("[Sim] Setting feedback state:", evaluationData)
      setFeedback(evaluationData)
      console.log("[Sim] Feedback set, CoachCard should now display")

      decideNextScenario({ empathy, resolution, difficulty })
    } catch (e) {
      console.error("[Sim] Evaluation failed:", e)
      const msg = e instanceof Error ? e.message : "Unexpected error during evaluation."
      console.error("[Sim] Setting error state:", msg)
      setError(msg)
    } finally {
      console.log("[Sim] Evaluation finished, setting evaluating to false")
      setEvaluating(false)
    }
  }, [prompt, transcript, scenarioId, perfectScoresMode, difficulty])

  // Initialize speech recorder on mount (no auto-start)
  useEffect(() => {
    console.log("[Sim] Component mounted, checking speech support:", isSupported)
    if (isSupported) {
      console.log("[Sim] Speech recognition supported, mic ready when audio finishes")
    } else {
      console.warn("[Sim] Speech recognition not supported in this browser")
    }
  }, [isSupported])

  // Cleanup microphone stream on unmount
  useEffect(() => {
    return () => {
      if (micStream) {
        console.log("[Sim] Cleaning up microphone stream")
        micStream.getTracks().forEach(track => track.stop())
        setMicStream(null)
      }
    }
  }, [micStream])


  // Don't auto-fetch first scenario - wait for user click

  // When recording stops (status goes from listening -> idle) and we have a transcript, evaluate
  const previousStatusRef = useRef(status)
  const evaluationTriggeredRef = useRef(false)
  useEffect(() => {
    const prev = previousStatusRef.current
    console.log("[Sim] Status change:", { 
      prev, 
      current: status, 
      hasTranscript: !!transcript.trim(), 
      transcriptLength: transcript.length,
      evaluationTriggered: evaluationTriggeredRef.current 
    })
    
    if ((prev === "listening" || prev === "stopping") && status === "idle" && transcript.trim() && !evaluationTriggeredRef.current) {
      console.log("[Sim] Recording stopped. Final transcript:", transcript)
      console.log("[Sim] Transcript length:", transcript.length, "words:", transcript.split(/\s+/).length)
      evaluationTriggeredRef.current = true
      console.log("[Sim] Triggering evaluation...")
      evaluateResponse()
    }
    // Reset evaluation trigger when new recording starts
    if (status === "listening") {
      evaluationTriggeredRef.current = false
    }
    previousStatusRef.current = status
  }, [evaluateResponse, status, transcript])

  const onMicClick = useCallback(async () => {
    console.log(`[Sim] Mic clicked - canRecord: ${canRecord}, audioFinished: ${audioFinished}, isListening: ${isListening}`)
    
    // Prevent clicks during status transition
    if (status === "stopping") {
      console.log("[Sim] Mic click ignored - status is stopping")
      return
    }
    
    // Handle first user interaction
    await handleFirstUserInteraction()
    
    if (!canRecord) {
      console.log("[Sim] Mic click ignored - canRecord is false")
      return
    }
    
    if (isListening) {
      console.log("[Sim] Stopping speech recording")
      console.log("[Sim] Current transcript before stop:", transcript)
      stop()
    } else {
      console.log("[Sim] Starting speech recording")
      console.log("[Sim] Resetting previous transcript:", transcript)
      
      // Ensure microphone is initialized before starting
      if (!micPermissionGranted) {
        console.log("[Sim] Initializing microphone before recording")
        await initializeMicrophone()
      }
      
      reset() // Clear previous transcript before starting new recording
      const success = start()
      if (!success) {
        console.error("[Sim] Failed to start speech recording")
      } else {
        console.log("[Sim] Speech recording started successfully")
      }
    }
  }, [canRecord, audioFinished, isListening, status, start, stop, reset, transcript, handleFirstUserInteraction, micPermissionGranted, initializeMicrophone])

  const onNextScenario = useCallback(() => {
    console.log("[Sim] Next scenario requested - clearing transcript and resetting states")
    
    // Clear transcript and feedback for fresh start
    reset()
    setFeedback(null)
    setError(null)
    
    // Reset audio and mic states
    setAudioFinished(false)
    
    // Fetch new scenario
    fetchScenario()
  }, [fetchScenario, reset])

  const handleClickToStart = useCallback(async () => {
    console.log("[Sim] Click to start - generating first scenario and initializing microphone")
    setShowClickToStart(false)
    setUserInteractionRequired(false)
    firstInteractionHandledRef.current = true
    
    // Initialize microphone stream
    await initializeMicrophone()
    
    // Generate first scenario immediately in user event
    console.log("[Sim] Generating first scenario in user event")
    const currentDifficulty = difficulty
    const newScenarioId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    setScenarioId(newScenarioId)
    console.log(`[Sim] First scenario ID: ${newScenarioId}`)
    
    try {
      // Generate scenario
      setLoadingScenario(true)
      setError(null)
      setFeedback(null)
      
      const scenarioRes = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: currentDifficulty }),
      })
      
      if (!scenarioRes.ok) {
        const msg = await scenarioRes.text().catch(() => "Failed to load scenario.")
        throw new Error(msg || "Failed to load scenario.")
      }
      
      const scenarioData = await scenarioRes.json()
      const scenarioPrompt = scenarioData?.prompt as string | undefined
      if (!scenarioPrompt) throw new Error("No scenario prompt returned.")
      
      setPrompt(scenarioPrompt)
      console.log(`[Sim] First scenario generated: ${scenarioPrompt.substring(0, 50)}...`)
      
      // Generate TTS audio
      setTtsLoading(true)
      console.log(`[Sim] Generating TTS audio for first scenario`)
      const ttsRes = await fetch("/api/voice-say", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scenarioPrompt, voice: "mentor" }),
      })
      
      if (ttsRes.ok) {
        const blob = await ttsRes.blob()
        const audioUrl = URL.createObjectURL(blob)
        console.log(`[Sim] TTS audio generated (${blob.size} bytes)`)
        
        // Play audio immediately in user event
        console.log("[Sim] Playing first scenario audio in user event")
        setAudioFinished(false)
        const el = new Audio(audioUrl)
        audioRef.current = el
        
        el.addEventListener('loadstart', () => console.log("[Sim] First scenario audio loading started"))
        el.addEventListener('canplay', () => console.log("[Sim] First scenario audio can play"))
        el.addEventListener('play', () => {
          console.log("[Sim] First scenario audio playback started")
          console.log("[Sim] audioStarted: true")
        })
        el.addEventListener('ended', () => {
          console.log("[Sim] First scenario audio playback ended - enabling mic")
          console.log("[Sim] micReady: true")
          setAudioFinished(true)
        })
        el.addEventListener('error', (e) => {
          console.error("[Sim] First scenario audio playback error:", e)
          setAudioFinished(true) // Enable mic even if audio fails
        })
        
        // Play immediately in user event
        await el.play()
        console.log("[Sim] First scenario audio play() resolved successfully")
        
      } else {
        const msg = await ttsRes.text().catch(() => "TTS failed")
        console.warn("[Sim] First scenario TTS failed", msg)
        setAudioFinished(true) // Enable mic if TTS fails
      }
      
    } catch (error) {
      console.error("[Sim] First scenario generation failed:", error)
      const msg = error instanceof Error ? error.message : "Unexpected error loading scenario."
      setError(msg)
      setAudioFinished(true) // Enable mic even if scenario generation fails
    } finally {
      setLoadingScenario(false)
      setTtsLoading(false)
    }
  }, [initializeMicrophone, difficulty])

  // Dev Controls: detect holding 'd' and 'b' for 1 second
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") keysDownRef.current.d = true
      if (e.key.toLowerCase() === "b") keysDownRef.current.b = true
      if (keysDownRef.current.d && keysDownRef.current.b && devActivationTimerRef.current === null) {
        devActivationTimerRef.current = window.setTimeout(() => {
          setShowDevPanel(true)
          resetDevInactivityTimer()
        }, 1000)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") keysDownRef.current.d = false
      if (e.key.toLowerCase() === "b") keysDownRef.current.b = false
      if (!keysDownRef.current.d || !keysDownRef.current.b) {
        if (devActivationTimerRef.current !== null) {
          window.clearTimeout(devActivationTimerRef.current)
          devActivationTimerRef.current = null
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      if (devActivationTimerRef.current !== null) {
        window.clearTimeout(devActivationTimerRef.current)
        devActivationTimerRef.current = null
      }
      if (devInactivityTimerRef.current !== null) {
        window.clearTimeout(devInactivityTimerRef.current)
        devInactivityTimerRef.current = null
      }
    }
  }, [])

  function resetDevInactivityTimer() {
    if (devInactivityTimerRef.current !== null) {
      window.clearTimeout(devInactivityTimerRef.current)
      devInactivityTimerRef.current = null
    }
    devInactivityTimerRef.current = window.setTimeout(() => setShowDevPanel(false), 10000)
  }

  function adjustDifficulty(direction: "harder" | "easier") {
    // Clear any pending debounce
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    setDifficulty((prev) => {
      const next = nextDifficulty(prev, direction)
      if (next !== prev) {
        console.log(`[Sim] Manual difficulty change: ${prev} -> ${next}`)
        // Debounce the scenario fetch to prevent rapid calls
        debounceTimerRef.current = window.setTimeout(() => {
          fetchScenario(next)
        }, 300)
      }
      return next
    })
  }

  function resetDifficulty() {
    // Clear any pending debounce
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    setDifficulty(() => {
      const next: typeof difficulty = "easy"
      console.log(`[Sim] Difficulty reset -> ${next}`)
      // Debounce the scenario fetch to prevent rapid calls
      debounceTimerRef.current = window.setTimeout(() => {
        fetchScenario(next)
      }, 300)
      return next
    })
  }

  function decideNextScenario({
    empathy,
    resolution,
    difficulty: current,
  }: {
    empathy: number
    resolution: number
    difficulty: typeof difficulty
  }) {
    let direction: "harder" | "easier" | "same" = "same"
    if (empathy >= 75 && resolution >= 75) direction = "harder"
    else if (empathy < 40 || resolution < 40) direction = "easier"
    const next = nextDifficulty(current, direction)
    console.log(`[Sim] Difficulty decision: ${current} --(${direction})-> ${next}`)
    if (next !== current) {
      setDifficulty(next)
      // Debounce the scenario fetch to prevent rapid calls
      debounceTimerRef.current = window.setTimeout(() => {
        fetchScenario(next)
      }, 300)
    }
  }

  return (
    <div 
      className="min-h-screen w-full bg-[#FFF8F5]"
      onClick={handleFirstUserInteraction}
    >
      {/* Click to Start Overlay */}
        {showClickToStart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#FFF8F5] via-[#FDFCFB] to-[#FFF0EA]">
            {/* Mode Switcher Button */}
            <div className="absolute top-6 right-6">
              <Link href="/setup">
                <Button variant="outline" size="sm" className="group border-[#FF7A70]/30 hover:bg-[#FFE7E4] hover:border-[#FF7A70]">
                  Try Job Interview Mode
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            
            <div className="text-center max-w-2xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-12"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] rounded-full blur-3xl opacity-20 scale-150"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FF7A70] to-[#FF9F70] rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[#1A1A1A] to-[#4A4A4A] bg-clip-text text-transparent mb-4">
                      Ready to Train?
                    </h1>
                    <p className="text-xl text-[#666666] leading-relaxed">
                      Your AI customer is waiting with realistic scenarios that adapt to your skill level. 
                      Get instant feedback on empathy, clarity, and resolution.
                    </p>
                  </div>
                </div>
        </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                onClick={handleClickToStart}
                className="group relative bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] hover:from-[#FF6B60] hover:to-[#FF8F60] text-white font-bold py-6 px-12 rounded-2xl text-xl shadow-[0_8px_32px_rgba(255,122,112,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,122,112,0.4)] focus:outline-none focus:ring-4 focus:ring-[#FF7A70]/30"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Training Session
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </motion.button>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 flex items-center justify-center gap-8 text-sm text-[#666666]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Real-time voice analysis</span>
              </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Adaptive difficulty</span>
            </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Instant feedback</span>
                </div>
              </motion.div>
            </div>
          </div>
        )}

      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F5] via-[#FDFCFB] to-[#FFF0EA]">
        <EnhancedNavHeader />

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Left Column - Scenario & Controls */}
            <div className="lg:col-span-2 space-y-8">
              {/* Scenario Card */}
              {loadingScenario && (
                <LoadingState
                  type="ai"
                  message="Generating scenario..."
                  submessage="Our AI is crafting a realistic customer interaction for you"
                  size="lg"
                />
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-6 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600">⚠️</span>
                    </div>
                    <p className="font-medium text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}

              {prompt && !loadingScenario && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A70]/5 to-[#FF9F70]/5"></div>
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FF7A70] to-[#FF9F70] flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#1A1A1A]">Customer Scenario</h3>
                          <p className="text-sm text-[#666666]">Listen carefully and respond naturally</p>
                        </div>
                      </div>
              <Button
                size="sm"
                        variant="outline"
                onClick={() => fetchScenario()}
                disabled={loadingScenario || ttsLoading}
                        className="bg-white/80 hover:bg-white"
              >
                        {loadingScenario || ttsLoading ? "Refreshing..." : "New Scenario"}
              </Button>
            </div>
                    <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-[#E9ECEF]">
                      <p className="text-[#1A1A1A] leading-relaxed font-medium">"{prompt}"</p>
          </div>
        </div>
                </motion.div>
              )}

              {/* Your Response Card */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6EC8FF]/5 to-[#7ED2B8]/5"></div>
                  <div className="relative p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#6EC8FF] to-[#7ED2B8] flex items-center justify-center">
                        <span className="text-lg">🎤</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Your Response</h3>
                        <p className="text-sm text-[#666666]">How you handled the customer interaction</p>
                      </div>
                    </div>
                    <div className="bg-[#F0F9FF] rounded-2xl p-6 border border-[#BFDBFE]">
                      <p className="text-[#1A1A1A] leading-relaxed font-medium">"{transcript}"</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Microphone Controls */}
              <div className="flex flex-col items-center space-y-8">
                <div className="relative">
          <Waveform isActive={isListening || isSpeechDetected} />
                  <MicButton
                    isListening={isListening}
                    onClick={onMicClick}
                    disabled={!canRecord}
                  />
                  {isListening && (
                    <div className="absolute inset-0 rounded-full border-4 border-[#FF7A70]/30 animate-ping"></div>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-medium text-[#1A1A1A] mb-2">
            {recorderError ? (
                      <span className="text-red-600 flex items-center gap-2">
                        <span>⚠️</span> {recorderError}
                      </span>
            ) : isListening ? (
                      <span className="flex items-center gap-2 text-[#FF7A70]">
                        <div className="w-2 h-2 rounded-full bg-[#FF7A70] animate-pulse"></div>
                        Listening... click to stop
                      </span>
            ) : transcript ? (
                      <span className="flex items-center gap-2 text-[#7ED2B8]">
                        <span>✅</span> Response recorded. Click to re-record.
                      </span>
                    ) : audioFinished ? (
                      <span className="flex items-center gap-2 text-[#6EC8FF]">
                        <span>🎤</span> Click to start recording
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-[#666666]">
                        <div className="w-2 h-2 rounded-full bg-[#666666] animate-pulse"></div>
                        Preparing scenario...
                      </span>
            )}
          </div>
            </div>
              </div>
        </div>

            {/* Right Column - Feedback & Progress */}
            <div className="space-y-6">
              {/* Performance Metrics */}
              {feedback && !evaluating && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7ED2B8]/5 to-[#6EC8FF]/5"></div>
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#7ED2B8] to-[#6EC8FF] flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Performance</h3>
                        <p className="text-sm text-[#666666]">Your latest scores</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1A1A1A]">Empathy</span>
                        <span className="text-lg font-bold text-[#FF7A70]">{feedback.empathy}%</span>
                      </div>
                      <div className="w-full bg-[#F3E9E3] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${feedback.empathy}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1A1A1A]">Clarity</span>
                        <span className="text-lg font-bold text-[#6EC8FF]">{feedback.clarity}%</span>
                      </div>
                      <div className="w-full bg-[#F3E9E3] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#6EC8FF] to-[#7ED2B8] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${feedback.clarity}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1A1A1A]">Resolution</span>
                        <span className="text-lg font-bold text-[#7ED2B8]">{feedback.resolution}%</span>
                      </div>
                      <div className="w-full bg-[#F3E9E3] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#7ED2B8] to-[#6EC8FF] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${feedback.resolution}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Training Tips */}
              <div className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A70]/5 to-[#FF9F70]/5"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FF7A70] to-[#FF9F70] flex items-center justify-center">
                      <span className="text-lg">💡</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">Training Tips</h3>
                  </div>
                  <div className="space-y-3 text-sm text-[#666666]">
                    <div className="flex items-start gap-3">
                      <span className="text-[#FF7A70] mt-1">•</span>
                      <span>Listen actively and acknowledge the customer's concerns</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#FF7A70] mt-1">•</span>
                      <span>Speak clearly and use simple, understandable language</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#FF7A70] mt-1">•</span>
                      <span>Focus on finding a solution that works for both parties</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#FF7A70] mt-1">•</span>
                      <span>Stay calm and professional, even with difficult customers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Loading */}
        {evaluating && (
            <div className="mt-8 flex justify-center">
              <LoadingState
                type="analysis"
                message="Analyzing your response..."
                submessage="Gemini is providing detailed feedback on your performance"
                size="md"
              />
            </div>
        )}

          {/* CoachCard - Full Width */}
        {feedback && !evaluating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
            <CoachCard
              empathy={feedback.empathy}
              clarity={feedback.clarity}
              resolution={feedback.resolution}
              tip={feedback.tip}
              summary={feedback.summary}
                tips={feedback.tips}
                idealResponse={feedback.idealResponse}
              onNext={onNextScenario}
            />
            </motion.div>
        )}
        </div>
      </div>
        {showDevPanel && (
          <div
            className="fixed bottom-4 right-4 z-50 w-64 rounded-lg border bg-white p-3 text-xs shadow-lg"
            onMouseMove={resetDevInactivityTimer}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Dev Controls</span>
              <button
                className="rounded px-2 py-1 text-[10px] text-[#6b7280] hover:bg-muted"
                onClick={() => setShowDevPanel(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-2 text-[#6b7280]">Current: {difficultyLabel(difficulty)}</div>
            
            {/* Perfect Scores Toggle */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[#6b7280]">Perfect Scores:</span>
              <button
                className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                  perfectScoresMode 
                    ? "bg-green-100 text-green-700 hover:bg-green-200" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setPerfectScoresMode(!perfectScoresMode)
                  console.log(`[Sim] Perfect scores mode: ${!perfectScoresMode}`)
                }}
              >
                {perfectScoresMode ? "ON" : "OFF"}
              </button>
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <button
                className="rounded bg-[#eef2ff] px-2 py-1 text-[#1f2937] hover:opacity-90"
                onClick={() => adjustDifficulty("harder")}
              >
                ↑ harder
              </button>
              <button
                className="rounded bg-[#fee2e2] px-2 py-1 text-[#1f2937] hover:opacity-90"
                onClick={() => adjustDifficulty("easier")}
              >
                ↓ easier
              </button>
              <button
                className="ml-auto rounded bg-[#f3f4f6] px-2 py-1 text-[#1f2937] hover:opacity-90"
                onClick={() => resetDifficulty()}
              >
                reset
              </button>
            </div>
          </div>
        )}
      </div>
  )
}

function clampPercent(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

function difficultyLabel(d: "easy" | "medium" | "hard" | "nightmare"): string {
  switch (d) {
    case "easy":
      return "Easy"
    case "medium":
      return "Medium"
    case "hard":
      return "Hard"
    case "nightmare":
      return "Nightmare"
    default:
      return "Medium"
  }
}

function nextDifficulty(
  current: "easy" | "medium" | "hard" | "nightmare",
  direction: "harder" | "easier" | "same",
): "easy" | "medium" | "hard" | "nightmare" {
  const order: Array<"easy" | "medium" | "hard" | "nightmare"> = ["easy", "medium", "hard", "nightmare"]
  const idx = order.indexOf(current)
  if (direction === "same") return current
  if (direction === "harder") return order[Math.min(order.length - 1, idx + 1)]
  return order[Math.max(0, idx - 1)]
}


