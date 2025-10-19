"use client"

import { Button } from "@/components/ui/button"

export interface HeroProps {
  onAnalyzeClick?: () => void
}

export default function Hero({ onAnalyzeClick }: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[28rem] flex-col items-center justify-center overflow-hidden rounded-[3rem] bg-gradient-to-b from-[#FFF8F5] to-[#FDFCFB] px-6 py-24 text-center shadow-[0_40px_120px_-80px_rgba(26,26,26,0.45)] md:min-h-[32rem] md:px-8 md:py-32">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[440px] w-[440px] rounded-full bg-[#FF7A70]/5 blur-[160px]" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mockly-head.svg"
          alt="Mockly mascot"
          className="h-28 w-28 animate-fade-up sm:h-32 sm:w-32"
          style={{ animationDelay: "0s" }}
        />
        <div className="space-y-4">
          <h1
            className="font-display text-4xl font-semibold tracking-tight text-[#1A1A1A] animate-fade-up md:text-5xl"
            style={{ animationDelay: "0.1s" }}
          >
            Your friendly AI coach for interviews that feel real.
          </h1>
          <p
            className="font-body text-base text-[#444444] animate-fade-up md:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            Mockly listens, learns, and delivers instant voice feedback so every practice rep builds confidence where it counts.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onAnalyzeClick}
            className="animate-fade-up rounded-full bg-[#FF7A70] px-8 py-4 font-semibold text-white shadow-[0_20px_50px_-28px_rgba(255,122,112,0.8)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#ff6b60] focus-visible:ring-[#FF7A70]/60 md:px-10"
            style={{ animationDelay: "0.3s" }}
          >
            Analyze with Gemini
          </Button>
          <span
            className="font-body text-sm text-[#6F5F58] animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            No setup. Start coaching instantly.
          </span>
        </div>
      </div>
    </section>
  )
}
