"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export interface HeroProps {
  onAnalyzeClick?: () => void
}

const PARALLAX_RANGE = 30

export default function Hero({ onAnalyzeClick }: HeroProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isParallaxActive, setIsParallaxActive] = useState(false)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleResize = () => {
      const active = window.innerWidth >= 768
      setIsParallaxActive(active)
      if (!active) {
        setOffset({ x: 0, y: 0 })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!isParallaxActive || typeof window === "undefined") {
        return
      }
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * PARALLAX_RANGE
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * PARALLAX_RANGE

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }

      frameRef.current = window.requestAnimationFrame(() => {
        setOffset({ x, y })
      })
    },
    [isParallaxActive],
  )

  const handleMouseLeave = useCallback(() => {
    if (!isParallaxActive || typeof window === "undefined") {
      return
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    frameRef.current = window.requestAnimationFrame(() => {
      setOffset({ x: 0, y: 0 })
    })
  }, [isParallaxActive])

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative isolate flex min-h-[26rem] flex-col items-center justify-center overflow-hidden rounded-[3rem] bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] px-2 py-18 text-center shadow-[0_24px_80px_-60px_rgba(26,26,26,0.32)] md:min-h-[30rem] md:px-8 md:py-28"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] rounded-full bg-[#FF7A70]/5 blur-[160px] transition-transform duration-700"
          style={{
            transform: isParallaxActive
              ? `translate(calc(-50% + ${offset.x / 3}px), calc(-50% + ${offset.y / 3}px))`
              : "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        />
      </div>
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6">
        <motion.div className="animate-mascot" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ delay: 0.1, duration: 0.6 }}>
          <div
            className="transition-transform duration-500 will-change-transform"
            style={{
              transform: isParallaxActive
                ? `translate(${(offset.x * -1) / 1.5}px, ${(offset.y * -1) / 1.5}px)`
                : "translate(0px, 0px)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mockly-glow.png" alt="Mockly mascot" className="mascot-blink h-28 w-28 sm:h-32 sm:w-32" />
          </div>
        </motion.div>
        <motion.div className="space-y-6" variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF7A70]/10 px-4 py-2 text-sm font-semibold text-[#FF7A70]">
              <span className="h-2 w-2 rounded-full bg-[#FF7A70] animate-pulse"></span>
              AI-Powered Customer Service Training
            </div>
            <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-[#1A1A1A] md:text-6xl lg:text-7xl">
              Master customer service with
              <span className="block bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] bg-clip-text text-transparent">
                real conversations
              </span>
            </h1>
            <p className="max-w-2xl font-body text-lg font-medium leading-relaxed text-[#666666] md:text-xl">
              Practice with AI customers that adapt to your skill level. Get instant voice feedback, 
              detailed coaching, and watch your empathy, clarity, and resolution scores improve in real-time.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7A70]/10">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A1A]">Adaptive Difficulty</div>
                <div className="text-xs text-[#666666]">AI adjusts to your level</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6EC8FF]/10">
                <span className="text-lg">🎤</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A1A]">Voice Practice</div>
                <div className="text-xs text-[#666666]">Real-time speech training</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7ED2B8]/10">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A1A]">Instant Feedback</div>
                <div className="text-xs text-[#666666]">Detailed performance metrics</div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="flex flex-col items-center gap-3"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
        >
          <Button
            size="lg"
            onClick={onAnalyzeClick}
            className="bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] px-10 py-5 text-white font-semibold text-lg shadow-[0_8px_32px_rgba(255,122,112,0.3)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(255,122,112,0.4)] md:px-12"
          >
            Start Training Now
            <span className="ml-2 text-xl">→</span>
          </Button>
          <div className="flex items-center gap-6 text-sm text-[#666666]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Instant AI feedback</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
