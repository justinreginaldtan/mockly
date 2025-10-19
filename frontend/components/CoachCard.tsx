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

export default function CoachCard({ empathy, clarity, resolution, tip, summary, onNext }: CoachCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-[#FFF8F5] to-white p-6 shadow-lg">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight">Customer Feedback</h3>
            {summary ? (
              <p className="text-sm text-muted-foreground">
                {summary}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <ScoreRow label="Empathy" value={empathy} accentClass="bg-[#FF7A70]" />
            <ScoreRow label="Clarity" value={clarity} accentClass="bg-[#6EC8FF]" />
            <ScoreRow label="Resolution" value={resolution} accentClass="bg-[#7ED2B8]" />
          </div>

          <div className="rounded-lg border bg-background/40 p-4">
            <p className="text-sm italic leading-relaxed text-muted-foreground">“{tip}”</p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-[#FF7A70] px-5 py-2.5 text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderColor: "transparent" }}
            >
              Next Scenario
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}


