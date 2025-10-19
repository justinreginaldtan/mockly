"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
    <section
      className="relative isolate flex min-h-[28rem] flex-col items-center justify-center overflow-hidden rounded-[3rem] bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] px-6 py-24 text-center shadow-[0_24px_80px_-60px_rgba(26,26,26,0.35)] md:min-h-[32rem] md:px-8 md:py-32"
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
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-8">
        <div className="animate-fade-up" style={{ animationDelay: "0s" }}>
          <div
            className="transition-transform duration-500 will-change-transform"
            style={{
              transform: isParallaxActive
                ? `translate(${(offset.x * -1) / 1.5}px, ${(offset.y * -1) / 1.5}px)`
                : "translate(0px, 0px)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mockly-head.svg" alt="Mockly mascot" className="h-28 w-28 sm:h-32 sm:w-32" />
          </div>
        </div>
        <div className="space-y-4">
          <h1
            className="font-display text-4xl font-semibold tracking-tight text-[#1A1A1A] animate-fade-up md:text-5xl"
            style={{ animationDelay: "0.1s" }}
          >
            Your friendly AI coach for interviews that feel real.
          </h1>
          <p
            className="font-body text-base font-medium leading-relaxed text-[#444444] animate-fade-up md:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            Mockly listens, learns, and delivers instant voice feedback so every practice rep builds confidence where it counts.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onAnalyzeClick}
            className="animate-fade-up bg-[#FF7A70] px-8 py-4 text-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#ff695c] md:px-10"
            style={{ animationDelay: "0.3s" }}
          >
            Analyze with Gemini
          </Button>
          <span
            className="font-body text-sm font-medium text-[#777777] animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            No setup. Start coaching instantly.
          </span>
        </div>
      </div>
    </section>
  )
}
