"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Briefcase, Headphones, Sparkles, Mic, BarChart3, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import NavHeader from "./nav-header"

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingHero() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] text-[#1A1A1A]">
      <NavHeader />

      <main className="mx-auto max-w-screen-lg px-4 py-16 md:px-8 md:py-24">
        <motion.section
          className="text-center"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5E0] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#777777] shadow-sm mb-6">
            <Sparkles className="h-4 w-4 text-[#FF7A70]" />
            AI-Powered Training
          </div>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-[#1A1A1A] md:text-5xl lg:text-6xl">
            Master Your Communication Skills
            <br />
            <span className="text-[#FF7A70]">with AI</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-body text-base font-medium leading-relaxed text-[#777777] md:text-lg">
            Practice job interviews and customer service scenarios with realistic AI-powered simulations.
            Get instant feedback powered by Gemini AI and natural voice interactions with ElevenLabs.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] hover:border-[#FF7A70]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A70]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A70] to-[#FF9A70] shadow-lg">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>

                <h2 className="mt-6 font-display text-2xl font-semibold text-[#1A1A1A]">
                  Job Interview Practice
                </h2>

                <p className="mt-3 font-body text-sm font-medium leading-relaxed text-[#777777]">
                  Prepare for real interviews with AI interviewers from Google, Amazon, Meta, and more.
                  Get personalized questions based on your resume and job description.
                </p>

                <ul className="mt-6 space-y-2 text-left font-body text-sm font-medium text-[#1A1A1A]">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A70]" />
                    Persona-based interviews
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A70]" />
                    Speech recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF7A70]" />
                    Detailed performance analysis
                  </li>
                </ul>

                <Link href="/setup" className="block mt-8">
                  <Button className="w-full bg-[#FF7A70] text-white hover:bg-[#ff6157] shadow-lg group-hover:scale-105 transition-transform">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Start Interview Practice
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl border border-[#EDE5E0] bg-white/95 p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] hover:border-[#6EC8FF]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#6EC8FF]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6EC8FF] to-[#5AB5F0] shadow-lg">
                  <Headphones className="h-8 w-8 text-white" />
                </div>

                <h2 className="mt-6 font-display text-2xl font-semibold text-[#1A1A1A]">
                  Customer Service Training
                </h2>

                <p className="mt-3 font-body text-sm font-medium leading-relaxed text-[#777777]">
                  Master customer service with adaptive AI scenarios that adjust to your skill level.
                  Get instant feedback on empathy, clarity, and resolution.
                </p>

                <ul className="mt-6 space-y-2 text-left font-body text-sm font-medium text-[#1A1A1A]">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#6EC8FF]" />
                    Adaptive difficulty
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#6EC8FF]" />
                    Real-time evaluation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#6EC8FF]" />
                    Coaching feedback
                  </li>
                </ul>

                <Link href="/sim" className="block mt-8">
                  <Button className="w-full bg-[#6EC8FF] text-white hover:bg-[#5AB5F0] shadow-lg group-hover:scale-105 transition-transform">
                    <Headphones className="mr-2 h-4 w-4" />
                    Start CS Training
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="mt-24"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-[#1A1A1A] md:text-4xl">
              Powered by Best-in-Class AI
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-base font-medium text-[#777777]">
              Mockly combines Google Gemini for intelligent evaluation and ElevenLabs for natural voice synthesis
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_28px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFE7E4]">
                <Sparkles className="h-6 w-6 text-[#FF7A70]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#1A1A1A]">
                AI-Powered Feedback
              </h3>
              <p className="mt-2 font-body text-sm font-medium text-[#777777]">
                Gemini analyzes your responses and provides detailed, actionable insights
              </p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_28px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F4FF]">
                <Mic className="h-6 w-6 text-[#6EC8FF]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#1A1A1A]">
                Realistic Voice Interaction
              </h3>
              <p className="mt-2 font-body text-sm font-medium text-[#777777]">
                ElevenLabs creates natural, human-like voices for immersive practice
              </p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="rounded-2xl border border-[#EDE5E0] bg-white/95 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_28px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8FFEF]">
                <Zap className="h-6 w-6 text-[#7ED2B8]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#1A1A1A]">
                Instant Results
              </h3>
              <p className="mt-2 font-body text-sm font-medium text-[#777777]">
                Get immediate feedback and track your improvement over time
              </p>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="mt-24 rounded-3xl border border-[#EDE5E0] bg-white/95 px-8 py-12 shadow-[0_2px_20px_rgba(0,0,0,0.04)] text-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="font-display text-3xl font-semibold text-[#1A1A1A] md:text-4xl">
            Ready to improve your skills?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base font-medium text-[#777777]">
            Choose your training mode and start practicing with AI-powered simulations
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/setup">
              <Button size="lg" className="bg-[#FF7A70] text-white hover:bg-[#ff6157] shadow-lg">
                <Briefcase className="mr-2 h-5 w-5" />
                Practice Interviews
              </Button>
            </Link>
            <Link href="/sim">
              <Button size="lg" variant="outline" className="border-[#6EC8FF] text-[#6EC8FF] hover:bg-[#6EC8FF] hover:text-white shadow-lg">
                <Headphones className="mr-2 h-5 w-5" />
                Train Customer Service
              </Button>
            </Link>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-[#EDE5E0] bg-white/80 py-8 text-center">
        <p className="font-body text-sm font-medium text-[#777777]">
          Powered by <span className="text-[#FF7A70]">Gemini</span> and <span className="text-[#FF7A70]">ElevenLabs</span>
        </p>
      </footer>
    </div>
  )
}
