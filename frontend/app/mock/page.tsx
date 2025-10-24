"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import NextLink from "next/link"
import { cn } from "@/lib/utils"
import { InterviewerAvatar } from "@/components/interviewer-avatar"
import { InsightsDrawer } from "@/components/interview/insights-drawer"
import EnhancedNavHeader from "@/components/enhanced-nav-header"
import { Mic, MicOff, Video, VideoOff, MessageSquare, Maximize2, LogOut, ArrowLeft, Volume2, Check } from "lucide-react"
import type { InterviewPlan, InterviewSetupPayload, PersonaConfig } from "@/lib/gemini"
import { SETUP_CACHE_KEY, PLAN_CACHE_KEY } from "@/lib/cache-keys"
import { resolvePersonaVoice } from "@/lib/voices"
import { useSpeechRecorder } from "@/hooks/use-speech-recorder"
import { Waveform } from "@/components/waveform"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

// Clean, minimal theme system
const theme = {
  background: "bg-slate-50",
  surface: "bg-white",
  surfaceElevated: "bg-white shadow-sm",
  text: "text-slate-900",
  textSecondary: "text-slate-600",
  textMuted: "text-slate-500",
  border: "border-slate-200",
  accent: "bg-blue-600",
  accentHover: "hover:bg-blue-700",
  accentText: "text-white",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
}

interface MockInterviewPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function MockInterviewPage({ searchParams }: MockInterviewPageProps) {
  const router = useRouter()
  
  // Core state
  const [showIntro, setShowIntro] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null)
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)
  const [planLoading, setPlanLoading] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)

  // Enhanced state for realism
  const [micState, setMicState] = useState<'muted' | 'listening' | 'recording' | 'finished'>('muted')
  const [showQuestionTransition, setShowQuestionTransition] = useState(false)
  const [showResponseToast, setShowResponseToast] = useState(false)
  const [interviewerStatus, setInterviewerStatus] = useState<'idle' | 'listening' | 'thinking'>('idle')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({})

  // Speech recording
  const { isSupported: isSpeechSupported, status: recorderStatus, transcript, start: startRecorder, stop: stopRecorder, reset: resetRecorder } = useSpeechRecorder({
    onFinal: (finalTranscript) => {
      console.log("Final transcript:", finalTranscript)
      // Save response to state
      if (currentQuestion && finalTranscript.trim()) {
        setQuestionResponses(prev => ({
          ...prev,
          [currentQuestion.id]: finalTranscript.trim()
        }))
      }
    }
  })

  // Load interview plan
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const cached = localStorage.getItem(PLAN_CACHE_KEY)
      if (cached) {
          const plan = JSON.parse(cached) as InterviewPlan
          setInterviewPlan(plan)
          setPlanLoading(false)
    } else {
          // Fallback to mock data for demo
          const mockPlan: InterviewPlan = {
            questions: [
              {
                id: "1",
                prompt: "Tell me about yourself and your background."
              },
              {
                id: "2", 
                prompt: "What interests you most about this role?"
              },
              {
                id: "3",
                prompt: "Describe a challenging project you've worked on recently."
              },
              {
                id: "4",
                prompt: "How do you handle working under pressure?"
              },
              {
                id: "5",
                prompt: "What questions do you have for us?"
              }
            ],
            persona: {
              personaId: "professional",
              company: "TechCorp",
              role: "Senior Engineering Manager",
              focusAreas: ["Technical", "Behavioral"],
              technicalWeight: 60,
              duration: "standard",
              voiceStyleId: "professional"
            }
          }
          setInterviewPlan(mockPlan)
          setPlanLoading(false)
        }
      } catch (error) {
        console.error("Failed to load interview plan:", error)
        setPlanError("Failed to load interview plan")
        setPlanLoading(false)
      }
    }

    loadPlan()
  }, [])

  const questions = interviewPlan?.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const currentQuestionText = currentQuestion?.prompt || ""
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  // Motion variants for realistic transitions
  const questionVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 }
  }

  const progressVariants = {
    initial: { width: 0 },
    animate: { width: "100%" }
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  }

  const handleToggleMute = useCallback(() => {
    if (micState === 'muted') {
      setIsMuted(false)
      setMicState('listening')
      setInterviewerStatus('listening')
      startRecorder()
      
      // Simulate recording after a brief delay
      setTimeout(() => {
        setMicState('recording')
      }, 300)
          } else {
      setIsMuted(true)
      setMicState('finished')
      setInterviewerStatus('thinking')
        stopRecorder()
      
      // Show response toast
      setShowResponseToast(true)
      setTimeout(() => setShowResponseToast(false), 2000)
      
      // Reset to muted after a delay
      setTimeout(() => {
        setMicState('muted')
        setInterviewerStatus('idle')
      }, 1000)
    }
  }, [micState, startRecorder, stopRecorder])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setIsTransitioning(true)
      setShowQuestionTransition(true)
      
      // Clear the transcript from previous question
      resetRecorder()
      
      // Brief fade to white
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
        setInterviewerStatus('thinking')
      }, 50)
      
      // Show new question after delay
      setTimeout(() => {
        setShowQuestionTransition(false)
        setIsTransitioning(false)
        setInterviewerStatus('idle')
      }, 350)
    }
  }, [currentQuestionIndex, totalQuestions, resetRecorder])

  const handleFinishInterview = useCallback(() => {
    // Save responses to session storage
    const responsesData = {
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.prompt,
        response: questionResponses[q.id] || "",
        duration: 0
      })),
      persona: interviewPlan?.persona?.personaId
    }
    
    sessionStorage.setItem('mockly_interview_responses', JSON.stringify(responsesData))
      router.push("/results")
  }, [questions, questionResponses, interviewPlan, router])

  const handleExit = useCallback(() => {
    router.push("/setup")
  }, [router])

  // Handle speech support check without causing hydration mismatch
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset transcript when question changes
  useEffect(() => {
    resetRecorder()
  }, [currentQuestionIndex, resetRecorder])

  // Don't render if speech not supported (only on client)
  if (isClient && !isSpeechSupported) {
  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Voice Recognition Required</h2>
          <p className="text-slate-600 mb-6">
            This interview requires voice recognition. Please use Chrome or Edge for the best experience.
          </p>
          <Button onClick={() => router.push("/setup")} className="w-full">
            Back to Setup
          </Button>
          </div>
        </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      <EnhancedNavHeader />

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Interview Content */}
        <div className="flex-1 flex flex-col">
          {/* Question Progress */}
          <div className="bg-white/95 border-b border-[#EDE5E0] px-6 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="text-sm text-[#777777]">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
              <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          {/* Question Card - Visual Anchor */}
          <div className="flex-1 flex items-center justify-center p-8">
            {/* Transition overlay */}
            <AnimatePresence>
              {showQuestionTransition && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.05 }}
                  className="fixed inset-0 bg-white z-10"
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
                transition={{ 
                  duration: 0.4, 
                  ease: "easeOut",
                  delay: showQuestionTransition ? 0.3 : 0
                }}
                className="max-w-2xl w-full"
              >
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                  {planLoading ? (
                    <div className="space-y-4">
                      <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse mx-auto"></div>
                      <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mx-auto"></div>
                  </div>
                  ) : planError ? (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-600 font-semibold">!</span>
                </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
                      <p className="text-slate-600 mb-6">{planError}</p>
                      <Button onClick={() => router.push("/setup")}>Back to Setup</Button>
          </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Question */}
                      <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-slate-900 leading-relaxed">
                          {currentQuestionText}
                        </h2>
                        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span>
                            {micState === 'muted' ? 'Take a breath — start when you\'re ready' : 
                             micState === 'listening' ? 'Mic will activate when you unmute' :
                             micState === 'recording' ? 'Listening...' : 'Response recorded'}
                          </span>
        </div>
        </div>

                      {/* Transcript Display */}
                      {transcript && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-slate-50 rounded-lg p-4 text-left"
                        >
                          <div className="text-sm text-slate-600 mb-1">Your response:</div>
                          <div className="text-slate-900">{transcript}</div>
                        </motion.div>
                      )}
          </div>
        )}
            </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Control Bar */}
          <div className="bg-white border-t border-slate-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-4">
                {/* Mic Control */}
                <motion.button
                  onClick={handleToggleMute}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
            className={cn(
                    "flex items-center space-x-3 px-6 py-3 rounded-full font-medium transition-all duration-200 relative overflow-hidden",
                    micState === 'muted' 
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                  title={micState === 'muted' ? 'Click to start recording' : 'Click to stop recording'}
                >
                  {micState === 'muted' ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>Unmute to answer</span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Mic className="w-5 h-5" />
                        {(micState === 'listening' || micState === 'recording') && (
                          <motion.div
                            className="absolute -inset-1 bg-blue-600 rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
            </div>
                      <span>
                        {micState === 'listening' ? 'Starting...' :
                         micState === 'recording' ? 'Recording...' : 'Processing...'}
                      </span>
                      {/* Decibel bar simulation */}
                      {micState === 'recording' && (
                        <div className="flex items-center space-x-1 ml-2">
                          {[1, 2, 3, 2, 1].map((height, i) => (
                            <motion.div
                              key={i}
                              className="bg-white rounded-full"
                              style={{ width: '2px', height: `${height * 4}px` }}
                              animate={{ scaleY: [1, 1.5, 1] }}
                              transition={{ 
                                duration: 0.6, 
                                repeat: Infinity, 
                                delay: i * 0.1,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
          </div>
        )}
                    </>
                  )}
                </motion.button>

                {/* Continue Button */}
                {currentQuestionIndex < totalQuestions - 1 && (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      onClick={handleNextQuestion}
                      variant="outline"
                      className="px-6 py-3 relative overflow-hidden"
                      disabled={isTransitioning}
                    >
                      {isTransitioning && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      <span className="relative z-10">
                        {isTransitioning ? 'Loading...' : 'Continue'}
                      </span>
                    </Button>
                  </motion.div>
                )}

                {/* Finish Button */}
                {currentQuestionIndex === totalQuestions - 1 && (
                  <Button
                    onClick={handleFinishInterview}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Finish Interview
                  </Button>
                )}
              </div>
              </div>
            </div>
          </div>

        {/* Sidebar - Interviewer */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          {/* Interviewer Avatar */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="relative">
                <motion.div 
                  className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-4 border-slate-200"
                  variants={pulseVariants}
                  animate="pulse"
                >
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-2xl">
                      {interviewPlan?.persona?.role?.[0] || "S"}
                    </span>
                  </div>
                </motion.div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                  <motion.div 
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
              </div>
                
                {/* Status indicator */}
                <AnimatePresence>
                  {interviewerStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-full">
                        {interviewerStatus === 'listening' ? 'listening...' :
                         interviewerStatus === 'thinking' ? 'thinking...' : ''}
                </div>
                    </motion.div>
              )}
                </AnimatePresence>
            </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {interviewPlan?.persona?.role || "Senior Engineering Manager"}
                </h3>
                <p className="text-sm text-slate-600">
                  {interviewPlan?.persona?.role} at {interviewPlan?.persona?.company}
                </p>
          </div>
        </div>
      </div>

          {/* Your Video */}
          <div className="p-6 border-t border-slate-200">
            <motion.div 
          className={cn(
                "rounded-lg aspect-video flex items-center justify-center relative overflow-hidden",
                isCameraOn ? "border-2 border-blue-500/30 shadow-lg" : "bg-slate-100"
              )}
              animate={isCameraOn ? {
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.4)",
                  "0 0 0 4px rgba(59, 130, 246, 0.1)",
                  "0 0 0 0 rgba(59, 130, 246, 0.4)"
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isCameraOn ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">You</span>
          </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <VideoOff className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-500">Camera initializing...</span>
              </div>
          )}
              <div className="absolute top-2 right-2">
          <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
          className={cn(
                    "p-2 rounded-full transition-colors hover:scale-110",
                    isCameraOn ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-600 text-white hover:bg-slate-700"
                  )}
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
              </div>
            </motion.div>
              </div>
              </div>
      </main>

      {/* Response Toast */}
      <AnimatePresence>
        {showResponseToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Response recorded ✓</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights Drawer */}
      <InsightsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        voiceLabel="Professional"
        insights={[
          "Focus on specific examples and outcomes",
          "Use the STAR method for behavioral questions",
          "Ask thoughtful questions about the role"
        ]}
      />
    </div>
  )
}
