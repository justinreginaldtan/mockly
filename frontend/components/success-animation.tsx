"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

interface SuccessAnimationProps {
  onComplete: () => void
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300)
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(79,97,255,0.55),_rgba(12,15,25,0.96))] backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#141c2f]/95 px-8 py-10 text-center shadow-2xl shadow-black/40 space-y-6 animate-in zoom-in duration-500">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-14 w-14 text-emerald-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-white">Great job!</h2>
          <p className="text-sm text-white/70">Gemini is analyzing your responses…</p>
        </div>
      </div>
    </div>
  )
}
