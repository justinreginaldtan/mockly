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
        <motion.div className="space-y-4" variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.01em] text-[#1A1A1A] md:text-5xl">
            Your friendly AI coach for interviews that feel real.
          </h1>
          <p
            className="font-body text-base font-medium leading-relaxed max-sm:clamp-2 md:text-lg"
          >
            Mockly listens, learns, and delivers instant voice feedback so every practice rep builds confidence where it counts.
          </p>
        </motion.div>
        <motion.div
          className="flex flex-col items-center gap-3"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
        >
          <Button
            size="lg"
            onClick={onAnalyzeClick}
            className="bg-[#FF6F65] px-8 py-4 text-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#ff6157] md:px-10"
          >
            Analyze with Gemini
          </Button>
          <span
            className="font-body text-sm font-medium text-[#777777]"
          >
            No setup. Start coaching instantly.
          </span>
        </motion.div>
      </div>
    </motion.section>
  )
}
