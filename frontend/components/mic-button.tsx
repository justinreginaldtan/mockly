"use client"

import { Mic, MicOff } from "lucide-react"

interface MicButtonProps {
  isListening: boolean
  onClick: () => void
}

export function MicButton({ isListening, onClick }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
        isListening
          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
          : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50"
      }`}
    >
      {/* Pulsing ring when listening */}
      {isListening && <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />}

      <div className="relative z-10">
        {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-primary-foreground" />}
      </div>
    </button>
  )
}
