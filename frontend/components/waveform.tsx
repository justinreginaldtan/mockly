import { useEffect, useState } from "react"

interface WaveformProps {
  isActive: boolean
}

export function Waveform({ isActive }: WaveformProps) {
  const bars = 40
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-1 h-20">
      {Array.from({ length: bars }).map((_, i) => {
        const height =
          mounted && isActive ? `${Math.random() * 60 + 20}%` : isActive ? "40%" : "20%"
        return (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-all ${isActive ? "animate-wave bg-[#4b6bff]" : "bg-white/40"}`}
            style={{
              height,
              animationDelay: `${i * 0.05}s`,
              opacity: isActive ? 0.9 : 0.25,
            }}
          />
        )
      })}
    </div>
  )
}
