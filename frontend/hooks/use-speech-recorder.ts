"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

interface SpeechRecognitionAlternative {
  transcript: string
  confidence?: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onspeechstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
  onsoundstart: ((event: Event) => void) | null
  onsoundend: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor
    SpeechRecognition?: SpeechRecognitionConstructor
  }
}

export type RecorderStatus = "idle" | "listening" | "stopping" | "error"

export interface SpeechRecorderOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onIntermediate?: (transcript: string) => void
  onFinal?: (transcript: string) => void
  onStarted?: () => void
  onStopped?: () => void
  onError?: (error: string) => void
  autoStopAfterSilenceMs?: number
}

export interface SpeechRecorderState {
  isSupported: boolean
  status: RecorderStatus
  transcript: string
  interimTranscript: string
  error: string | null
  durationMs: number
  isSpeechDetected: boolean
  start: () => boolean
  stop: () => void
  reset: () => void
}

const detectInitialSupport = (): {
  supported: boolean
  ctor: SpeechRecognitionConstructor | null
} => {
  if (typeof window === "undefined") {
    return { supported: false, ctor: null }
  }
  const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
  return { supported: Boolean(ctor), ctor }
}

export function useSpeechRecorder({
  language = "en-US",
  continuous = true,
  interimResults = true,
  onIntermediate,
  onFinal,
  onStarted,
  onStopped,
  onError,
  autoStopAfterSilenceMs = 2000,
}: SpeechRecorderOptions = {}): SpeechRecorderState {
  const initialSupport = useMemo(() => detectInitialSupport(), [])
  const [isSupported, setIsSupported] = useState(initialSupport.supported)
  const [status, setStatus] = useState<RecorderStatus>("idle")
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [isSpeechDetected, setIsSpeechDetected] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const constructorRef = useRef<SpeechRecognitionConstructor | null>(initialSupport.ctor)
  const startedAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const finalTranscriptRef = useRef<string>("")
  const silenceTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    mountedRef.current = true
    if (typeof window !== "undefined") {
      const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
      if (ctor) {
        constructorRef.current = ctor
        setIsSupported(true)
      } else {
        setIsSupported(false)
      }
    }

    return () => {
      mountedRef.current = false
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (silenceTimeoutRef.current !== null) {
        if (typeof window !== "undefined") {
          window.clearTimeout(silenceTimeoutRef.current)
        }
        silenceTimeoutRef.current = null
      }
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onstart = null
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onspeechstart = null
        recognitionRef.current.onspeechend = null
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore abort errors during teardown
        }
        recognitionRef.current = null
      }
    }
  }, [])

  const stopDurationTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const runDurationTimer = useCallback(() => {
    stopDurationTimer()
    const tick = () => {
      if (!mountedRef.current || startedAtRef.current === null) {
        return
      }
      setDurationMs(Date.now() - startedAtRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [stopDurationTimer])
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimeoutRef.current !== null) {
      if (typeof window !== "undefined") {
        window.clearTimeout(silenceTimeoutRef.current)
      }
      silenceTimeoutRef.current = null
    }
  }, [])

  const assignHandlers = useCallback(
    (recognition: SpeechRecognitionInstance) => {
      recognition.onstart = () => {
        if (!mountedRef.current) return
        startedAtRef.current = Date.now()
        finalTranscriptRef.current = ""
        setTranscript("")
        setInterimTranscript("")
        setError(null)
        setIsSpeechDetected(false)
        setStatus("listening")
        runDurationTimer()
        clearSilenceTimer()
        onStarted?.()
      }

      recognition.onspeechstart = () => {
        if (!mountedRef.current) return
        clearSilenceTimer()
        setIsSpeechDetected(true)
      }

      recognition.onspeechend = () => {
        if (!mountedRef.current) return
        clearSilenceTimer()
        setIsSpeechDetected(false)
        if (autoStopAfterSilenceMs > 0 && recognitionRef.current === recognition) {
          if (typeof window !== "undefined") {
            silenceTimeoutRef.current = window.setTimeout(() => {
              if (!mountedRef.current) {
                return
              }
              if (recognitionRef.current !== recognition) {
                return
              }
              setStatus((prev) => (prev === "listening" ? "stopping" : prev))
              try {
                recognition.stop()
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Unexpected error stopping speech recognition."
                setStatus("error")
                setError(message)
                onError?.(message)
              }
            }, autoStopAfterSilenceMs)
          }
        }
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!mountedRef.current) return
        let finalChunk = ""
        let interimChunk = ""

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i]
          const alternative = result.item(0)
          const text = alternative?.transcript ?? ""
          if (!text) continue

          if (result.isFinal) {
            finalChunk += `${text} `
          } else {
            interimChunk += `${text} `
          }
        }

        if (finalChunk) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk}`.trim()
          setTranscript(finalTranscriptRef.current)
          onFinal?.(finalTranscriptRef.current)
        }

        setInterimTranscript(interimChunk.trim())
        if (interimChunk.trim()) {
          onIntermediate?.(interimChunk.trim())
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (!mountedRef.current) return
        clearSilenceTimer()
        
        // Handle "aborted" as a normal state, not an error
        if (event.error === "aborted") {
          setStatus("idle")
          setError(null)
          stopDurationTimer()
          return
        }
        
        let message = "Speech recognition error."
        
        switch (event.error) {
          case "not-allowed":
            message = "Microphone permission denied."
            break
          case "no-speech":
            message = "No speech detected."
            break
          case "audio-capture":
            message = "Microphone not available or in use by another application."
            break
          case "network":
            message = "Network error occurred during speech recognition."
            break
          case "service-not-allowed":
            message = "Speech recognition service not allowed."
            break
          case "bad-grammar":
            message = "Speech recognition grammar error."
            break
          case "language-not-supported":
            message = "Language not supported for speech recognition."
            break
          default:
            message = event.message || `Speech recognition error: ${event.error}`
        }

        console.warn("[SpeechRecorder] Error occurred:", event.error, message)
        setStatus("error")
        setError(message)
        stopDurationTimer()
        onError?.(message)
      }

      recognition.onend = () => {
        if (!mountedRef.current) return
        clearSilenceTimer()
        stopDurationTimer()
        if (startedAtRef.current) {
          setDurationMs(Date.now() - startedAtRef.current)
        }
        recognitionRef.current = null
        startedAtRef.current = null
        setInterimTranscript("")
        setStatus((prev) => (prev === "error" ? "error" : "idle"))
        onStopped?.()
      }
    },
    [
      autoStopAfterSilenceMs,
      clearSilenceTimer,
      onError,
      onFinal,
      onIntermediate,
      onStarted,
      onStopped,
      runDurationTimer,
      stopDurationTimer,
    ],
  )

  const buildRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const ctor = constructorRef.current
    if (!ctor) {
      setIsSupported(false)
      return null
    }

    const recognition = new ctor()
    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = 1

    assignHandlers(recognition)

    recognitionRef.current = recognition
    return recognition
  }, [assignHandlers, continuous, interimResults, language])

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser.")
      return false
    }

    if (status === "listening" || status === "stopping") {
      return false
    }

    try {
      const recognition = buildRecognition()
      if (!recognition) {
        setError("Unable to start speech recognition.")
        return false
      }
      setStatus("listening")
      recognition.start()
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error starting speech recognition."
      setStatus("error")
      setError(message)
      onError?.(message)
      return false
    }
  }, [buildRecognition, isSupported, onError, status])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) {
      return
    }
    clearSilenceTimer()
    setStatus((prev) => (prev === "listening" ? "stopping" : prev))
    try {
      recognition.stop()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error stopping speech recognition."
      setStatus("error")
      setError(message)
      onError?.(message)
    }
  }, [clearSilenceTimer, onError])

  const reset = useCallback(() => {
    finalTranscriptRef.current = ""
    startedAtRef.current = null
    stopDurationTimer()
    clearSilenceTimer()
    setTranscript("")
    setInterimTranscript("")
    setDurationMs(0)
    setError(null)
    setStatus(isSupported ? "idle" : "error")
    setIsSpeechDetected(false)
  }, [clearSilenceTimer, isSupported, stopDurationTimer])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore abort errors on unmount
        }
        recognitionRef.current = null
      }
    }
  }, [])

  return useMemo(
    () => ({
      isSupported,
      status,
      transcript,
      interimTranscript,
      error,
      durationMs,
      isSpeechDetected,
      start,
      stop,
      reset,
    }),
    [
      durationMs,
      error,
      interimTranscript,
      isSpeechDetected,
      isSupported,
      start,
      status,
      stop,
      transcript,
      reset,
    ],
  )
}
