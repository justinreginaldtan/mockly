"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CoachCardProps = {
  empathy: number
  clarity: number
  resolution: number
  tip: string
  summary?: string
  tips?: string[]
  idealResponse?: string
  onNext: () => void
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function ScoreRow({ label, value, accentClass }: { label: string; value: number; accentClass: string }) {
  const percentage = clampPercent(value)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{percentage}%</span>
      </div>
      <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted/60")}> 
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", accentClass)}
        />
      </div>
    </div>
  )
}

export default function CoachCard({ empathy, clarity, resolution, tip, summary, tips, idealResponse, onNext }: CoachCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A70]/5 via-[#6EC8FF]/5 to-[#7ED2B8]/5"></div>
      <div className="relative p-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FF7A70] to-[#FF9F70] flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#1A1A1A]">Performance Analysis</h3>
                <p className="text-[#666666]">Detailed feedback on your customer service skills</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Analysis Complete</span>
            </div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#FF7A70]/10 to-[#FF9F70]/10 border border-[#FF7A70]/20">
              <div className="text-4xl font-bold text-[#FF7A70] mb-2">{clampPercent(empathy)}%</div>
              <div className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Empathy</div>
              <div className="text-xs text-[#666666] mt-1">Understanding customer emotions</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#6EC8FF]/10 to-[#7ED2B8]/10 border border-[#6EC8FF]/20">
              <div className="text-4xl font-bold text-[#6EC8FF] mb-2">{clampPercent(clarity)}%</div>
              <div className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Clarity</div>
              <div className="text-xs text-[#666666] mt-1">Clear communication</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#7ED2B8]/10 to-[#6EC8FF]/10 border border-[#7ED2B8]/20">
              <div className="text-4xl font-bold text-[#7ED2B8] mb-2">{clampPercent(resolution)}%</div>
              <div className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">Resolution</div>
              <div className="text-xs text-[#666666] mt-1">Problem-solving effectiveness</div>
            </div>
          </div>

          {/* Main Insight */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F8F9FA] to-[#F0F9FF] p-6 border border-[#E9ECEF]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF7A70]/5 to-[#6EC8FF]/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FF7A70] to-[#FF9F70] flex items-center justify-center">
                  <span className="text-lg">💡</span>
                </div>
                <h4 className="text-lg font-bold text-[#1A1A1A]">Key Insight</h4>
              </div>
              <p className="text-[#1A1A1A] leading-relaxed font-medium">"{tip}"</p>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <span className="text-[#FF7A70]">📝</span>
                Summary
              </h4>
              <p className="text-[#666666] leading-relaxed bg-[#F8F9FA] rounded-xl p-4 border border-[#E9ECEF]">{summary}</p>
            </div>
          )}

          {/* Additional Tips */}
          {tips && tips.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <span className="text-[#6EC8FF]">🎯</span>
                Additional Tips
              </h4>
              <div className="grid gap-3">
                {tips.map((tipItem, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-[#F0F9FF] border border-[#BFDBFE]">
                    <span className="text-[#6EC8FF] mt-1 font-bold">•</span>
                    <span className="text-[#1A1A1A] font-medium">{tipItem}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ideal Response */}
          {idealResponse && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <span className="text-[#7ED2B8]">✨</span>
                Ideal Response
              </h4>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 border border-green-200">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative">
                  <p className="text-[#1A1A1A] leading-relaxed font-medium">"{idealResponse}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="button"
              onClick={onNext}
              className="group relative bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] hover:from-[#FF6B60] hover:to-[#FF8F60] text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-[0_8px_32px_rgba(255,122,112,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,122,112,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Next Scenario
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


