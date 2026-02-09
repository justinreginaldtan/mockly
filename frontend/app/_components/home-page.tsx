"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react"
import { ArrowRight, BarChart3, CheckCircle2, FileText, Link2, MicVocal, Sparkles, Target } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import Hero, { HeroProps } from "@/components/Hero"
import { StepIndicator } from "@/components/step-indicator"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"

const SAMPLE_COMPANY_NAME = "TechCorp Customer Service"
const SAMPLE_TRAINING_SCENARIOS = `Customer Service Training Scenarios

Welcome to TechCorp's customer service excellence program. These scenarios are designed to help you master real-world customer interactions across different difficulty levels.

Training Focus Areas:
- Empathy and emotional intelligence
- Clear communication and problem-solving
- Resolution strategies and follow-up
- Handling difficult customers
- Product knowledge and troubleshooting

Scenario Types:
1. Technical Support - Help customers with product issues
2. Billing Inquiries - Resolve payment and account questions  
3. Returns & Refunds - Process returns and handle complaints
4. Product Information - Provide guidance on features and usage
5. Escalation Management - Know when and how to escalate issues

Performance Metrics:
- Empathy Score: How well you understand and address customer emotions
- Clarity Score: How clearly you communicate solutions
- Resolution Score: How effectively you solve the customer's problem

Each scenario adapts to your skill level, getting more challenging as you improve. The AI customer will respond naturally to your approach, testing your ability to handle various personality types and situations.`

const primaryCtaClass =
  "rounded-xl px-8 py-4 bg-[#FF6F65] text-white font-medium shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#ff6157] hover:shadow-[0_4px_28px_rgba(0,0,0,0.12)] focus-visible:ring-offset-[#FFF8F5]"

const outlineButtonClass =
  "rounded-xl px-6 py-3 border border-[#EDE5E0] bg-white text-sm font-medium text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-200 hover:bg-[#FFF2ED] hover:shadow-[0_4px_28px_rgba(0,0,0,0.08)] focus-visible:ring-offset-[#FFF8F5]"

const stepActionButtonClass =
  "rounded-xl px-8 py-4 bg-[#1A1A1A] text-white font-medium transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#2E2E2E] shadow-[0_2px_20px_rgba(0,0,0,0.1)] focus-visible:ring-offset-[#FFF8F5]"

const cardClass =
  "rounded-2xl border border-[#EDE5E0] bg-white/95 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A70]/20"

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

const trainingSummary = {
  company: {
    name: "TechCorp Customer Service",
    department: "Customer Success & Support",
    summary:
      "Leading technology company focused on delivering exceptional customer experiences through innovative support solutions and personalized service.",
    focusAreas: [
      "Technical troubleshooting and product support",
      "Billing inquiries and account management", 
      "Returns, refunds, and complaint resolution",
      "Product education and feature guidance",
      "Escalation management and team coordination",
    ],
  },
  scenarios: {
    difficulty: "Adaptive AI Training",
    summary:
      "AI-powered scenarios that automatically adjust difficulty based on your performance, ensuring optimal learning progression.",
    types: [
      "Technical Support - Product troubleshooting and issue resolution",
      "Billing & Accounts - Payment processing and account inquiries",
      "Returns & Refunds - Complaint handling and policy enforcement", 
      "Product Education - Feature guidance and usage assistance",
      "Escalation Management - Complex issue routing and follow-up",
    ],
  },
  metrics: [
    {
      label: "Empathy",
      detail: "How well you understand and address customer emotions and concerns.",
      weight: 35,
    },
    {
      label: "Clarity", 
      detail: "How clearly you communicate solutions and next steps.",
      weight: 30,
    },
    {
      label: "Resolution",
      detail: "How effectively you solve the customer's core problem.",
      weight: 35,
    },
  ],
  weights: { empathy: 35, clarity: 30, resolution: 35 },
  focusSummary:
    "Master the art of customer service through realistic AI conversations that adapt to your skill level, providing instant feedback on empathy, clarity, and resolution.",
  persona: {
    id: "ai-customer",
    name: "Alex Chen",
    title: "AI Customer Simulation · ElevenLabs",
    voiceLabel: "Realistic Customer Voice · ElevenLabs",
    voiceBadge: "Natural, varied, emotionally responsive",
    opener:
      "I'm your AI training customer. I'll present realistic scenarios and respond naturally to your approach, helping you master real-world customer interactions.",
    reasons: [
      "Provides realistic customer interactions across different personality types and situations.",
      "Adapts difficulty based on your performance, ensuring optimal learning progression.",
      "Offers instant feedback on empathy, clarity, and resolution skills.",
    ],
  },
  scenarioPreview: [
    {
      prompt: "I'm frustrated because my order arrived damaged and customer service isn't responding to my emails. I need this fixed today!",
      focus: "Angry customer",
    },
    {
      prompt:
        "I'm not very technical, but I think there's something wrong with my account settings. Can you help me figure out what's going on?",
      focus: "Confused customer",
    },
    {
      prompt:
        "I want to cancel my subscription and get a full refund. I've been a customer for 3 years and this is unacceptable service.",
      focus: "Cancellation request",
    },
  ],
}

interface HomePageProps {
  HeroComponent?: (props: HeroProps) => React.JSX.Element
}

export default function HomePage({ HeroComponent = Hero }: HomePageProps) {
  const [companyFile, setCompanyFile] = useState<File | null>(null)
  const [uploadedCompanyName, setUploadedCompanyName] = useState<string | null>(null)
  const [trainingScenariosInput, setTrainingScenariosInput] = useState("")
  const [trainingScenariosSource, setTrainingScenariosSource] = useState<string>("")
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showCalibrating, setShowCalibrating] = useState(false)

  useEffect(() => {
    if (analysisComplete) {
      const briefSection = document.getElementById("training-brief")
      briefSection?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [analysisComplete])

  const handleCompanyUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setCompanyFile(file)
    if (file) {
      setUploadedCompanyName(file.name)
    }
  }, [])

  const handleUsePracticePack = useCallback(() => {
    setCompanyFile(null)
    setUploadedCompanyName(SAMPLE_COMPANY_NAME)
    setTrainingScenariosInput(SAMPLE_TRAINING_SCENARIOS)
    setAnalysisComplete(false)
    setTrainingScenariosSource("")
  }, [])

  const handleAnalyzeMaterials = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isAnalyzing) {
        return
      }
      const resolvedCompanyName = companyFile?.name ?? uploadedCompanyName ?? SAMPLE_COMPANY_NAME
      const resolvedTrainingScenarios = trainingScenariosInput.trim() || SAMPLE_TRAINING_SCENARIOS

      setUploadedCompanyName(resolvedCompanyName)
      setTrainingScenariosSource(resolvedTrainingScenarios)
      setIsAnalyzing(true)
      setAnalysisComplete(false)
      setShowCalibrating(true)

      window.setTimeout(() => {
        setIsAnalyzing(false)
        setAnalysisComplete(true)
        setShowCalibrating(false)
      }, 1400)
    },
    [isAnalyzing, trainingScenariosInput, companyFile, uploadedCompanyName],
  )

  const handleScrollToIntake = useCallback(() => {
    const section = document.getElementById("intake-form")
    section?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const effectiveCompanyName = uploadedCompanyName ?? (analysisComplete ? SAMPLE_COMPANY_NAME : undefined)
  const stepItems = ["Setup", "Review training", "Start simulation", "Get feedback"]
  const currentStepIndex = analysisComplete ? 1 : 0

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      {showCalibrating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1A1A1A]/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#EDE5E0] bg-white/90 px-10 py-12 shadow-[0_28px_80px_-50px_rgba(26,26,26,0.6)]">
            <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-[#E5D7D0] border-t-[#FF7A70]" />
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Gemini</p>
              <h2 className="text-lg font-semibold tracking-tight text-[#1A1A1A]">Preparing your interview</h2>
              <p className="text-sm text-[#75665E]">We’re aligning your materials with the Coach Card focus areas.</p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[#EDE5E0] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#E0D6CF] bg-white/80 shadow-[0_10px_20px_-16px_rgba(26,26,26,0.45)] animate-mascot">
              <Image
                src="/mockly-glow.png"
                alt="Mockly mascot"
                width={44}
                height={44}
                className="h-full w-full object-contain mascot-blink"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-[#1A1A1A]">Mockly</span>
              <span className="text-xs text-[#777777]">AI Customer Service Training</span>
            </div>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <ProgressBar currentStep={1} totalSteps={4} />
            <div className="flex items-center gap-2 text-xs font-medium text-[#777777]">
              <span className="uppercase tracking-[0.2em] text-[#B7A89F]">Powered by</span>
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">Gemini</span>
              <span className="rounded-full bg-[#FFE7E4] px-2.5 py-1 font-semibold text-[#FF7A70]">ElevenLabs</span>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 space-y-20 pb-16 transition-opacity duration-500 md:pb-24 ${
          showCalibrating ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto max-w-screen-lg px-2 pt-16 md:px-8 md:pt-20">
          <StepIndicator steps={stepItems} currentIndex={currentStepIndex} />
          <HeroComponent onAnalyzeClick={handleScrollToIntake} />
        </div>

        <motion.section
          id="intake-form"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`${cardClass} relative isolate mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-12 animate-fade-up`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#FF7A70]/5 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
              Step 1
            </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[#1A1A1A] md:text-3xl lg:text-4xl">
                Configure your training
              </h2>
            <p className="font-body text-base font-medium leading-relaxed max-sm:text-sm max-sm:leading-snug">
              Mockly customizes every training session to your company specific scenarios and customer service standards.
              Our AI analyzes your materials to create personalized training experiences.
            </p>
          </div>

          <form className="relative mt-8 space-y-8" onSubmit={handleAnalyzeMaterials}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-3 rounded-2xl border border-[#EDE5E0] bg-white px-5 py-5 text-sm text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Company Profile (.pdf)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCompanyUpload}
                  className="rounded-lg border border-[#E3D8D2] bg-[#F9F3EF] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#B9AAA1] file:mr-4 file:rounded-md file:border-0 file:bg-white/90 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#94A3B8] focus:ring-offset-2 focus:ring-offset-white"
                />
                <span className="text-xs font-medium text-[#777777]">
                  {companyFile?.name ?? uploadedCompanyName ?? "No file selected yet."}
                </span>
              </label>

              <label className="flex flex-col gap-3 rounded-2xl border border-[#EDE5E0] bg-white px-5 py-5 text-sm text-[#1A1A1A] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Training scenarios</span>
                <textarea
                  rows={8}
                  value={trainingScenariosInput}
                  onChange={(event) => setTrainingScenariosInput(event.target.value)}
                  placeholder="Paste your customer service training scenarios, policies, or common issues here…"
                  className="rounded-lg border border-[#E3D8D2] bg-[#F9F3EF] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#B9AAA1] focus:outline-none focus:ring-2 focus:ring-[#94A3B8] focus:ring-offset-2 focus:ring-offset-white"
                />
                <span className="text-xs font-medium text-[#777777]">
                  Include common customer issues, company policies, or specific scenarios you want to practice.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" className={primaryCtaClass} disabled={isAnalyzing}>
                {isAnalyzing ? "Analyzing…" : "Configure Training"}
              </Button>
              <Button type="button" variant="outline" className={outlineButtonClass} onClick={handleUsePracticePack}>
                Use sample scenarios
              </Button>
              <span className="font-body text-sm font-medium text-[#777777] max-sm:clamp-2">
                {analysisComplete
                  ? `Training configured for ${effectiveCompanyName ?? SAMPLE_COMPANY_NAME}.`
                  : isAnalyzing
                    ? "Preparing your training plan…"
                    : "Uploads stay private to this session."}
              </span>
            </div>
          </form>
        </motion.section>

        <motion.section
          id="training-brief"
          className="mx-auto max-w-screen-lg px-2 md:px-8"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-b from-white/95 to-white/70 px-8 py-10 shadow-[0_2px_24px_rgba(0,0,0,0.05)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-12 top-10 h-40 w-40 rounded-full bg-[#FF7A70]/5 blur-3xl" />
              <div className="absolute right-16 bottom-12 h-48 w-48 rounded-full bg-[#FF7A70]/5 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F] animate-fade-up">
                Step 2
              </span>
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-[#FFF0EA] px-4 py-1 text-sm font-semibold text-[#7A6C64] animate-fade-up"
                style={{ animationDelay: "0.05s" }}
              >
                <Sparkles className="h-4 w-4 text-[#FF7A70]" /> AI training brief
              </div>
              <h2
                className="font-display text-2xl font-semibold tracking-tight text-[#1A1A1A] animate-fade-up md:text-3xl lg:text-4xl"
                style={{ animationDelay: "0.1s" }}
              >
                Your personalized training plan
              </h2>
              <p className="max-w-3xl font-body text-base font-medium leading-relaxed animate-fade-up max-sm:text-sm max-sm:leading-snug md:text-lg" style={{ animationDelay: "0.2s" }}>
                Our AI analyzes your company profile and training scenarios to create realistic customer interactions. 
                When you start training, the AI customer, difficulty level, and feedback metrics are perfectly calibrated to your needs.
              </p>
            </div>
          </div>
        </motion.section>

        {analysisComplete ? (
          <motion.div
            className="mx-auto grid max-w-screen-lg gap-8 px-2 md:px-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="space-y-8">
              <motion.div
                className={`${cardClass} p-6 md:p-8`}
                variants={{ ...cardVariants, ...hoverVariants }}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <FileText className="h-4 w-4 text-[#FF7A70]" /> Company profile
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-[#1A1A1A]">
                  {trainingSummary.company.name}
                </h3>
                <p className="mt-3 font-body text-sm font-medium leading-relaxed max-sm:clamp-2">
                  {trainingSummary.company.summary}
                </p>
                {effectiveCompanyName && (
                  <div className="mt-4 rounded-2xl border border-[#EDE5E0] bg-[#FFF2ED] px-4 py-2 text-xs font-medium text-[#777777]">
                    Configured for: <span className="text-[#1A1A1A]">{effectiveCompanyName}</span>
                  </div>
                )}
                <ul className="mt-4 space-y-2 font-body text-sm font-medium">
                  {trainingSummary.company.focusAreas.map((area) => (
                    <li key={area} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                className={`${cardClass} p-6 md:p-8`}
                variants={{ ...cardVariants, ...hoverVariants }}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <Link2 className="h-4 w-4 text-[#FF7A70]" /> Training scenarios
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-[#1A1A1A]">
                  {trainingSummary.scenarios.difficulty}
                </h3>
                <p className="mt-3 font-body text-sm font-medium leading-relaxed max-sm:clamp-2">
                  {trainingSummary.scenarios.summary}
                </p>
                <ul className="mt-4 space-y-2 font-body text-sm font-medium">
                  {trainingSummary.scenarios.types.map((type) => (
                    <li key={type} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                      <span>{type}</span>
                    </li>
                  ))}
                </ul>
                {trainingScenariosSource && (
                  <div className="mt-4 rounded-2xl border border-[#EDE5E0] bg-white/95 px-4 py-3 text-xs font-medium text-[#777777]">
                    <p className="font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Scenario excerpt</p>
                    <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-body text-sm font-medium leading-relaxed">
                      {trainingScenariosSource}
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                className={`${cardClass} p-6 md:p-8`}
                variants={{ ...cardVariants, ...hoverVariants }}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.18 }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <Target className="h-4 w-4 text-[#FF7A70]" /> Performance metrics
                </div>
                <p className="mt-4 font-body text-sm font-medium leading-relaxed">
                  {trainingSummary.focusSummary}
                </p>
                <div className="mt-6 space-y-4">
                  {trainingSummary.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#8F7A6F]">
                        <span>{metric.label}</span>
                        <span>{metric.weight}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3E9E3]">
                        <div
                          className={`h-full rounded-full ${
                            metric.label === 'Empathy' ? 'bg-[#FF7A70]' : 
                            metric.label === 'Clarity' ? 'bg-[#6EC8FF]' : 'bg-[#7ED2B8]'
                          }`}
                          style={{ width: `${metric.weight}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#666666]">{metric.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-1">
                  {trainingSummary.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-[#E4D6CE] bg-[#F9F2ED] px-4 py-3 font-body text-sm font-medium"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8F7A6F]">{metric.label}</p>
                      <p className="mt-2">{metric.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className={`${cardClass} p-6 md:p-8`}
                variants={{ ...cardVariants, ...hoverVariants }}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.24 }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <BarChart3 className="h-4 w-4 text-[#FF7A70]" /> Sample scenarios you will practice
                </div>
                <ul className="mt-4 space-y-4">
                  {trainingSummary.scenarioPreview.map((scenario, index) => (
                    <li key={scenario.prompt} className="rounded-2xl border border-[#E4D6CE] bg-white/85 p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#8F7A6F]">
                        <span>Scenario {index + 1}</span>
                        <span className="text-[#7A6C64]">{scenario.focus}</span>
                      </div>
                      <p className="mt-2 font-body text-sm font-medium leading-relaxed">&ldquo;{scenario.prompt}&rdquo;</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.aside
              className="space-y-8"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.18 }}
            >
              <motion.div 
                className={`${cardClass} p-6 md:p-8`}
                whileHover="hover"
                variants={hoverVariants}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
                  <MicVocal className="h-4 w-4 text-[#FF7A70]" /> Your AI training customer
                </div>
                <h3 className="mt-4 font-display text-3xl font-semibold text-[#1A1A1A]">
                  {trainingSummary.persona.name}
                </h3>
                <p className="font-body text-sm font-medium">{trainingSummary.persona.title}</p>
                <div className="mt-4 rounded-2xl border border-[#E4D6CE] bg-[#F9F2ED] p-4 font-body text-sm font-medium">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">Voice persona</p>
                  <p className="mt-2 font-semibold text-[#1A1A1A]">{trainingSummary.persona.voiceLabel}</p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#7A6C64]">
                    {trainingSummary.persona.voiceBadge}
                  </span>
                </div>
                <p className="mt-4 font-body text-sm font-medium leading-relaxed">
                  {trainingSummary.persona.opener}
                </p>
                <div className="mt-4 space-y-3 font-body text-sm font-medium">
                  {trainingSummary.persona.reasons.map((reason) => (
                    <div key={reason} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#FF7A70]" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.aside>
          </motion.div>
        ) : (
          <motion.div
            className={`${cardClass} mx-auto max-w-4xl px-8 py-12 text-center font-body text-sm font-medium md:px-12 animate-fade-up`}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Upload your company profile and training scenarios, then select{" "}
            <span className="font-semibold text-[#1A1A1A]">Configure Training</span> to generate your personalized customer service
            training plan.
          </motion.div>
        )}

        <motion.section
          className="mx-auto max-w-screen-lg px-2 pb-16 md:px-8"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex flex-col items-start gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0D6CF] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#8F7A6F]">
              Step 3
            </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[#1A1A1A] md:text-3xl lg:text-4xl">
                Start your training session
              </h2>
              <p className="max-w-2xl font-body text-base font-medium leading-relaxed max-sm:text-sm max-sm:leading-snug">
              Your AI customer, training scenarios, and feedback metrics are ready. Start practicing when you are prepared to speak and
              receive detailed coaching feedback moments after you finish.
            </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button
              asChild
              size="lg"
              disabled={!analysisComplete}
              className={stepActionButtonClass}
            >
              <Link href={`/sim?persona=${trainingSummary.persona.id}`} className="inline-flex items-center gap-2">
                Start Training Session
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            {!analysisComplete && (
              <span className="font-body text-sm font-medium text-[#777777]">
                Configure your training above to start practicing.
              </span>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  )
}
