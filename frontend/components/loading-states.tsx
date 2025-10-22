"use client"

import { motion } from "framer-motion"
import { Loader2, Sparkles, Brain, Mic, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  type?: "default" | "ai" | "voice" | "analysis" | "success"
  message?: string
  submessage?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const loadingConfig = {
  default: {
    icon: Loader2,
    color: "text-[#FF7A70]",
    bgColor: "bg-[#FF7A70]/10",
    message: "Loading...",
    submessage: "Please wait while we prepare everything for you"
  },
  ai: {
    icon: Brain,
    color: "text-[#6EC8FF]",
    bgColor: "bg-[#6EC8FF]/10",
    message: "AI is thinking...",
    submessage: "Our AI is crafting the perfect experience for you"
  },
  voice: {
    icon: Mic,
    color: "text-[#7ED2B8]",
    bgColor: "bg-[#7ED2B8]/10",
    message: "Preparing voice...",
    submessage: "ElevenLabs is generating natural speech"
  },
  analysis: {
    icon: Sparkles,
    color: "text-[#FF7A70]",
    bgColor: "bg-[#FF7A70]/10",
    message: "Analyzing your response...",
    submessage: "Gemini is providing detailed feedback"
  },
  success: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-100",
    message: "Complete!",
    submessage: "Everything is ready to go"
  }
}

export function LoadingState({ 
  type = "default", 
  message, 
  submessage, 
  size = "md",
  className 
}: LoadingStateProps) {
  const config = loadingConfig[type]
  const Icon = config.icon
  const isAnimated = type !== "success"

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-full mb-4",
        sizeClasses[size],
        config.bgColor
      )}>
        <Icon className={cn(
          size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8",
          config.color,
          isAnimated && "animate-spin"
        )} />
      </div>
      
      <motion.h3 
        className={cn(
          "font-semibold text-[#1A1A1A] mb-2",
          textSizeClasses[size]
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {message || config.message}
      </motion.h3>
      
      <motion.p 
        className={cn(
          "text-[#666666] text-center max-w-md",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {submessage || config.submessage}
      </motion.p>

      {/* Animated dots for loading states */}
      {isAnimated && (
        <motion.div 
          className="flex space-x-1 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#FF7A70] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 3 }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-[#E5E7EB] rounded",
            i === lines - 1 ? "w-3/4" : "w-full",
            i === 0 ? "h-4 mb-2" : "h-3 mb-1"
          )}
        />
      ))}
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  message?: string
  className?: string
}

export function ProgressBar({ progress, message, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      {message && (
        <div className="flex justify-between text-sm text-[#666666] mb-2">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF] h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}
