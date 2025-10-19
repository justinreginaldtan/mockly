"use client"

import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  steps: string[]
  currentIndex: number
  className?: string
}

export function StepIndicator({ steps, currentIndex, className }: StepIndicatorProps) {
  return (
    <div
      className={cn(
        "sticky top-20 z-20 mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E0D6CF] bg-white/90 px-4 py-3 shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-sm max-md:top-16 max-md:px-3",
        className,
      )}
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isComplete = index < currentIndex
        return (
          <div key={step} className="flex flex-wrap items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200",
                isActive
                  ? "bg-[#FF6F65] text-white shadow-[0_4px_18px_rgba(255,111,101,0.35)]"
                  : isComplete
                    ? "bg-[#FFE1DD] text-[#FF6F65]"
                    : "bg-[#F5EFEA] text-[#94A3B8]",
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-medium transition-colors duration-200",
                isActive ? "text-[#1A1A1A]" : "text-[#777777]",
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span className="hidden h-px w-10 bg-[#94A3B8]/40 md:block" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
