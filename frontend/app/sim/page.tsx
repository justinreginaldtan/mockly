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
  tips?: string[]
  idealResponse?: string
}

export default function SimPage() {
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
  const devActivationTimerRef = useRef<number | null>(null)
  const devInactivityTimerRef = useRef<number | null>(null)
  const keysDownRef = useRef<{ d: boolean; b: boolean }>({ d: false, b: false })
  const pendingScenarioRef = useRef<AbortController | null>(null)
  const pendingTtsRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isGeneratingScenarioRef = useRef<boolean>(false)
  const firstInteractionHandledRef = useRef<boolean>(false)

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
  }, [canRecord, audioFinished, isListening, start, stop, reset, transcript, handleFirstUserInteraction, micPermissionGranted, initializeMicrophone])

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFF8F5]">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
                Customer Simulation
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Practice handling real customer scenarios with instant coaching
              </p>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onClick={handleClickToStart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Click to Start
            </motion.button>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-sm text-gray-500 mt-6"
            >
              Click anywhere to begin your first scenario
            </motion.p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Simulation</h1>
          <p className="text-sm text-muted-foreground">Practice handling real customer scenarios with instant coaching.</p>
        </motion.div>

        <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-[#6b7280]">Difficulty: {difficultyLabel(difficulty)}</div>
              <div className="text-xs font-medium text-muted-foreground">Current customer prompt</div>
              <div className="mt-2 whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-[15px] leading-relaxed">
                {loadingScenario ? "Loading scenario..." : prompt || "—"}
              </div>
            </div>
            <div className="shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fetchScenario()}
                disabled={loadingScenario || ttsLoading}
              >
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
              <span>Listening... click mic to stop</span>
            ) : transcript ? (
              <span>Response recorded. Click mic to re-record.</span>
            ) : audioFinished ? (
              <span>Click mic to start recording</span>
            ) : (
              <span>Preparing scenario...</span>
            )}
          </div>
          {transcript.trim() ? (
            <div className="mt-1 max-w-lg text-center text-xs text-muted-foreground">
              {transcript}
            </div>
          ) : null}
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
              tips={feedback.tips}
              idealResponse={feedback.idealResponse}
              onNext={onNextScenario}
            />
          </div>
        )}
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


