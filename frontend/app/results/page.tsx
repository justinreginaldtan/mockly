"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  Download,
  Loader2,
  MicVocal,
  RefreshCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"
import { SuccessAnimation } from "@/components/success-animation"
import { StepIndicator } from "@/components/step-indicator"
import { RESPONSES_CACHE_KEY, PLAN_CACHE_KEY, SETUP_CACHE_KEY } from "@/lib/cache-keys"

type EvaluationData = {
  overallScore: number
  jdCoverage: {
    hit: number
    partial: number
    miss: number
  }
  strengths: string[]
  weakAreas: string[]
  evidenceSnippets: Array<{
    quote: string
    signal: string
    strength: boolean
  }>
  upgradePlan: string[]
  followUpQuestions: string[]
}

type QuestionResponse = {
  id: string
  text: string
  response: string
  duration?: number
}

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const hoverVariants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" }
  }
}

export default function ResultsPage() {
  const [showAnimation, setShowAnimation] = useState(true)
  const [showFollowUps, setShowFollowUps] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recapAudioUrl, setRecapAudioUrl] = useState<string | null>(null)
  const [recapLoading, setRecapLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchEvaluation() {
      try {
        // Read responses from correct sessionStorage key
        const cachedResponsesRaw = sessionStorage.getItem(RESPONSES_CACHE_KEY)
        
        if (!cachedResponsesRaw) {
          setError("No interview data found. Please complete an interview first.")
          setLoading(false)
          return
        }

        // Parse responses - format is { cacheKey, responses: Record<questionId, { transcript, durationMs, updatedAt }> }
        const cachedData = JSON.parse(cachedResponsesRaw) as {
          cacheKey?: string
          responses?: Record<string, { transcript: string; durationMs: number; updatedAt: number }>
        }
        
        if (!cachedData.responses || Object.keys(cachedData.responses).length === 0) {
          setError("No interview responses found")
          setLoading(false)
          return
        }

        // Read interview plan to get question text
        const planRaw = sessionStorage.getItem(PLAN_CACHE_KEY)
        if (!planRaw) {
          setError("Interview plan not found. Please complete an interview from the setup page.")
          setLoading(false)
          return
        }

        const plan = JSON.parse(planRaw) as {
          persona?: { company?: string; role?: string; personaId?: string }
          questions: Array<{ id: string; prompt: string; focusArea?: string }>
        }

        // Transform data to API format
        const questions: QuestionResponse[] = plan.questions
          .map((q) => {
            const response = cachedData.responses![q.id]
            if (!response || !response.transcript) return null
            
            return {
              id: q.id,
              text: q.prompt,
              response: response.transcript,
              duration: response.durationMs
            }
          })
          .filter((q): q is QuestionResponse => q !== null)

        if (questions.length === 0) {
          setError("No answered questions found")
          setLoading(false)
          return
        }

        // Get persona info for context
        const personaInfo = plan.persona 
          ? `${plan.persona.company} ${plan.persona.role}` 
          : undefined

        // Call evaluation API
        const response = await fetch('/api/evaluate-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions,
            persona: personaInfo
          })
        })
        
        if (!response.ok) {
          throw new Error('Evaluation failed')
        }
        
        const data = await response.json()
        setEvaluation(data.evaluation)
      } catch (err) {
        console.error('Failed to evaluate interview:', err)
        setError('Failed to load results. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchEvaluation()
  }, [])

  const coverageSegments = useMemo(
    () => {
      if (!evaluation) return []
      return [
        { label: "Strong match", value: evaluation.jdCoverage.hit, color: "bg-emerald-500" },
        { label: "Partial match", value: evaluation.jdCoverage.partial, color: "bg-amber-400" },
        { label: "Not covered", value: evaluation.jdCoverage.miss, color: "bg-rose-400" },
      ]
    },
    [evaluation],
  )

  const handleGenerateFollowUps = () => {
    setShowFollowUps(true)
    setTimeout(() => setShowFollowUps(false), 4000)
  }

  async function generateVoiceRecap() {
    if (!evaluation) return
    
    setRecapLoading(true)
    try {
      // Generate 30-second summary text
      const summaryText = `Your interview performance scored ${evaluation.overallScore} out of 100. Your key strengths include ${evaluation.strengths.slice(0, 2).join(' and ')}. ${evaluation.weakAreas.length > 0 ? `Areas for improvement: ${evaluation.weakAreas[0]}.` : ''} Keep practicing and you'll continue to improve!`
      
      // Call voice API
      const response = await fetch('/api/voice-say', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: summaryText,
          voiceId: 'default'
        })
      })
      
      if (!response.ok) throw new Error('Voice generation failed')
      
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      setRecapAudioUrl(audioUrl)
      
      // Auto-play the recap
      const audio = new Audio(audioUrl)
      audio.play()
    } catch (err) {
      console.error('Voice recap failed:', err)
      alert('Could not generate voice recap. Please try again.')
    } finally {
      setRecapLoading(false)
    }
  }

  function downloadPDF() {
    if (!evaluation) return
    
    // Create printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Interview Results - Mockly</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 30px; }
          .score { font-size: 48px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; }
          .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          ul { list-style-type: disc; padding-left: 20px; }
          li { margin: 8px 0; }
          .evidence { font-style: italic; color: #666; margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #4CAF50; }
        </style>
      </head>
      <body>
        <h1>Mockly Interview Results</h1>
        <div class="score">${evaluation.overallScore}/100</div>
        
        <h2>JD Coverage</h2>
        <div class="section">
          <p>Hit: ${evaluation.jdCoverage.hit}% | Partial: ${evaluation.jdCoverage.partial}% | Miss: ${evaluation.jdCoverage.miss}%</p>
        </div>
        
        <h2>Key Strengths</h2>
        <div class="section">
          <ul>
            ${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        
        <h2>Areas for Improvement</h2>
        <div class="section">
          <ul>
            ${evaluation.weakAreas.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
        
        <h2>Evidence from Your Responses</h2>
        <div class="section">
          ${evaluation.evidenceSnippets.map(e => `
            <div class="evidence">
              "${e.quote}" - <strong>${e.signal}</strong>
            </div>
          `).join('')}
        </div>
        
        <h2>Upgrade Plan</h2>
        <div class="section">
          <ul>
            ${evaluation.upgradePlan.map(u => `<li>${u}</li>`).join('')}
          </ul>
        </div>
        
        <h2>Follow-Up Questions for Practice</h2>
        <div class="section">
          <ul>
            ${evaluation.followUpQuestions.map(q => `<li>${q}</li>`).join('')}
          </ul>
        </div>
        
        <p style="margin-top: 40px; text-align: center; color: #888; font-size: 12px;">
          Generated by Mockly on ${new Date().toLocaleDateString()}
        </p>
      </body>
      </html>
    `
    
    // Open print dialog (saves as PDF)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to download PDF')
      return
    }
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  function handleRestart() {
    // Clear all interview data from sessionStorage
    sessionStorage.removeItem(RESPONSES_CACHE_KEY)
    sessionStorage.removeItem(PLAN_CACHE_KEY)
    sessionStorage.removeItem(SETUP_CACHE_KEY)
    sessionStorage.removeItem('mi:progress')
    
    // Navigate to setup page
    window.location.href = '/setup'
  }

  function handleExportJSON() {
    if (!evaluation) return
    
    try {
      // Read setup and responses for complete export
      const setupRaw = sessionStorage.getItem(SETUP_CACHE_KEY)
      const planRaw = sessionStorage.getItem(PLAN_CACHE_KEY)
      const responsesRaw = sessionStorage.getItem(RESPONSES_CACHE_KEY)
      
      const setup = setupRaw ? JSON.parse(setupRaw) : null
      const plan = planRaw ? JSON.parse(planRaw) : null
      const responses = responsesRaw ? JSON.parse(responsesRaw) : null
      
      const exportData = {
        interview: {
          date: new Date().toISOString(),
          persona: plan?.persona || setup?.persona,
          questions: plan?.questions?.map((q: any) => ({
            id: q.id,
            text: q.prompt,
            focusArea: q.focusArea,
            response: responses?.responses?.[q.id]?.transcript || '(no answer)',
            durationMs: responses?.responses?.[q.id]?.durationMs || 0
          })) || []
        },
        evaluation: {
          overallScore: evaluation.overallScore,
          jdCoverage: evaluation.jdCoverage,
          strengths: evaluation.strengths,
          weakAreas: evaluation.weakAreas,
          evidenceSnippets: evaluation.evidenceSnippets,
          upgradePlan: evaluation.upgradePlan,
          followUpQuestions: evaluation.followUpQuestions
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0'
        }
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mockly-interview-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export interview data')
    }
  }

  const progressSteps = ["Upload", "Review brief", "Mock room", "Coach Card"]

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#FF7A70]" />
          <p className="mt-4 font-body text-lg font-medium text-[#777777]">
            Analyzing your interview performance...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <AlertCircle className="h-16 w-16 text-rose-500" />
          <h2 className="mt-4 font-display text-2xl font-semibold text-[#1A1A1A]">
            {error}
          </h2>
          <p className="mt-2 font-body text-base font-medium text-[#777777]">
            Complete an interview to see your results here.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link href="/setup">
              <Button>Start Interview</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // No evaluation data
  if (!evaluation) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      {showAnimation && <SuccessAnimation onComplete={() => setShowAnimation(false)} />}

      <header className="sticky top-0 z-30 border-b border-[#EDE5E0] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-3 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#E0D6CF] bg-white/90 shadow-[0_10px_24px_-16px_rgba(26,26,26,0.45)]">
              <span className="font-display text-sm font-semibold text-[#1A1A1A]">Mock</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-semibold tracking-tight text-[#1A1A1A]">Mockly</span>
              <span className="text-xs font-body font-medium text-[#777777]">Step 4 · Coach Card recap</span>
            </div>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <ProgressBar currentStep={4} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-[#777777]">
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">Gemini</span>
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <motion.main
        className="mx-auto max-w-screen-lg space-y-12 px-2 py-16 md:px-8 md:py-24"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <StepIndicator steps={progressSteps} currentIndex={3} />
        <motion.section
          className="relative isolate overflow-hidden rounded-[32px] border border-[#EDE5E0] bg-white/95 px-8 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-10 top-8 h-48 w-48 rounded-full bg-[#FF7A70]/8 blur-[120px]" />
            <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/4 translate-y-1/4 rounded-full bg-[#FF7A70]/10 blur-[140px]" />
          </div>
          <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#777777]">
                <Sparkles className="h-4 w-4 text-[#FF7A70]" />
                Gemini analysis
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1A1A1A] md:text-4xl lg:text-5xl">
                {evaluation.overallScore >= 90 ? "Outstanding performance!" : evaluation.overallScore >= 70 ? "You're interview-ready." : "Keep practicing!"}
              </h1>
              <p className="max-w-2xl font-body text-base font-medium leading-relaxed max-sm:text-sm max-sm:leading-snug md:text-lg">
                Gemini analyzed your interview responses. Use this feedback to strengthen your preparation.
              </p>
            </div>
            <div className="relative isolate flex h-40 w-40 items-center justify-center">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[#FF7A70]/10 blur-3xl" />
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[28px] border border-[#EDE5E0] bg-white/95 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
                <span className="text-xs font-body font-semibold uppercase tracking-[0.35em] text-[#777777]">Score</span>
                <span className="mt-3 font-display text-5xl font-semibold text-[#1A1A1A]">
                  {evaluation.overallScore}
                </span>
                <span className="text-xs font-body font-medium text-[#777777]">out of 100</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
            whileHover="hover"
            variants={hoverVariants}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#FF7A70]">
                  <TrendingUp className="h-4 w-4" />
                  JD coverage breakdown
                </div>
                <p className="font-body text-sm font-medium">
                  Gemini highlighted where your responses hit the mark and where to reinforce them.
                </p>
              </div>
              <Button variant="outline" size="sm">
                View raw Gemini output
              </Button>
            </div>

            <div className="mt-8 space-y-5">
              {coverageSegments.map((segment, index) => (
                <div key={segment.label} className="space-y-3 animate-fade-up" style={{ animationDelay: `${0.1 * index}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-body text-sm font-medium text-[#1A1A1A]">
                      <span className={`inline-flex h-2 w-2 rounded-full ${segment.color}`} />
                      {segment.label}
                    </div>
                    <span className="font-body text-sm font-semibold text-[#FF7A70]">{segment.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3E9E3]">
                    <div className={`h-full ${segment.color}`} style={{ width: `${segment.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.aside 
            className="animate-fade-up delay-100 space-y-4 rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
            whileHover="hover"
            variants={hoverVariants}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#FF7A70]">
              <BadgeCheck className="h-4 w-4" />
              Quick wins
            </div>
            <ul className="space-y-3 font-body text-sm font-medium">
              {evaluation.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 font-body text-sm font-semibold text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Focus next
              </div>
              <p className="mt-2 font-body text-sm font-medium">
                {evaluation.weakAreas.length > 0 ? evaluation.weakAreas.join(' · ') : 'Keep up the great work!'}
              </p>
            </div>
          </motion.aside>
        </motion.section>

        <motion.section
          className="grid gap-8 lg:grid-cols-2"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {evaluation.evidenceSnippets.map((snippet, index) => (
            <motion.div
              key={index}
              className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
              style={{ animationDelay: `${0.05 * index}s` }}
              whileHover="hover"
              variants={hoverVariants}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      snippet.strength ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {snippet.strength ? "Strong match" : "Needs work"}
                  </span>
                  <span className="font-display text-sm font-semibold text-[#1A1A1A]">{snippet.signal}</span>
                </div>
                <span className="text-xs font-body font-semibold uppercase tracking-[0.35em] text-[#777777]">
                  Gemini cite
                </span>
              </div>
              <p className="mt-4 font-body text-sm font-medium leading-relaxed italic">
                "{snippet.quote}"
              </p>
              <div className="mt-4 rounded-2xl bg-[#FFF2ED] px-4 py-3 text-xs font-body font-semibold text-[#FF7A70]">
                {snippet.strength ? 'Positive signal' : 'Area for improvement'}
              </div>
            </motion.div>
          ))}
        </motion.section>

        <motion.section 
          className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
            whileHover="hover"
            variants={hoverVariants}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 font-body text-sm font-semibold text-[#FF7A70]">
                <BarChart3 className="h-4 w-4" />
                Gemini upgrade plan
              </div>
              <Button variant="outline" size="sm">
                Copy to clipboard
              </Button>
            </div>
            <ul className="mt-6 space-y-4">
              {evaluation.upgradePlan.map((tip, idx) => (
                <li key={idx} className="rounded-2xl border border-[#EDE5E0] bg-white px-4 py-3">
                  <span className="font-display text-sm font-semibold text-[#1A1A1A]">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.aside 
            className="animate-fade-up delay-100 space-y-4 rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
            whileHover="hover"
            variants={hoverVariants}
          >
            <div className="flex items-center gap-2 font-body text-sm font-semibold text-[#FF7A70]">
              <MicVocal className="h-4 w-4" />
              ElevenLabs coach recap
            </div>
            <p className="font-body text-sm font-medium leading-relaxed">
              Hear a 30-second voice note summarizing your performance for a quick refresh before the real interview.
            </p>
            <Button 
              disabled={recapLoading} 
              onClick={generateVoiceRecap} 
              className="w-full"
            >
              {recapLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating audio…
                </>
              ) : recapAudioUrl ? (
                "🔊 Play recap again"
              ) : (
                "🎧 Generate voice recap"
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download report PDF
            </Button>
          </motion.aside>
        </motion.section>

        <motion.section 
          className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover="hover"
          variants={hoverVariants}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-body text-sm font-semibold text-[#FF7A70]">
                <RefreshCcw className="h-4 w-4" />
                Practice weak areas
              </div>
              <p className="font-body text-sm font-medium">
                Gemini spun up follow-ups targeting the JD signals that need another rep.
              </p>
            </div>
            <Button variant="outline" onClick={handleGenerateFollowUps}>
              Generate follow-up questions
            </Button>
          </div>

          {showFollowUps ? (
            <div className="mt-6 grid gap-3 rounded-2xl border border-[#EDE5E0] bg-white px-6 py-5">
              {evaluation.followUpQuestions.map((item, index) => (
                <div key={index} className="flex items-start gap-3 font-body text-sm font-medium">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#FF7A70]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#EDE5E0] px-6 py-10 text-center font-body text-sm font-medium text-[#777777]">
              Follow-up prompts will appear here once generated.
            </div>
          )}
        </motion.section>

        <motion.section 
          className="animate-fade-up rounded-2xl border border-[#EDE5E0] bg-white/95 px-8 py-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover="hover"
          variants={hoverVariants}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#777777]">
                Next steps
              </div>
              <h2 className="font-display text-xl font-semibold text-[#1A1A1A] md:text-2xl">Keep your momentum going</h2>
              <p className="font-body text-sm font-medium">
                Start a new interview with a fresh persona or revisit the setup to fine-tune Gemini’s focus.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/">
                <Button variant="outline">Start new interview</Button>
              </Link>
              <Link href="/setup">
                <Button className="group">
                  Run another drill
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  )
}
