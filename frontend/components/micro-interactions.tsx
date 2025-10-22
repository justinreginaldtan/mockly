"use client"

import { motion, useAnimation, useInView } from "framer-motion"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right"
  className?: string
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  direction = "up",
  className 
}: FadeInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  const directionVariants = {
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
    left: { x: 20, opacity: 0 },
    right: { x: -20, opacity: 0 }
  }

  const variants = {
    hidden: directionVariants[direction],
    visible: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ 
  children, 
  className, 
  staggerDelay = 0.1 
}: StaggerContainerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface HoverScaleProps {
  children: React.ReactNode
  scale?: number
  className?: string
}

export function HoverScale({ 
  children, 
  scale = 1.05, 
  className 
}: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PulseProps {
  children: React.ReactNode
  className?: string
  intensity?: "low" | "medium" | "high"
}

export function Pulse({ 
  children, 
  className, 
  intensity = "medium" 
}: PulseProps) {
  const intensityMap = {
    low: { scale: [1, 1.02, 1], duration: 2 },
    medium: { scale: [1, 1.05, 1], duration: 1.5 },
    high: { scale: [1, 1.1, 1], duration: 1 }
  }

  return (
    <motion.div
      animate={intensityMap[intensity]}
      transition={{
        duration: intensityMap[intensity].duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ShakeProps {
  children: React.ReactNode
  trigger?: boolean
  className?: string
}

export function Shake({ 
  children, 
  trigger = false, 
  className 
}: ShakeProps) {
  return (
    <motion.div
      animate={trigger ? "shake" : "rest"}
      variants={{
        rest: { x: 0 },
        shake: {
          x: [-10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RippleProps {
  children: React.ReactNode
  className?: string
  color?: string
}

export function Ripple({ 
  children, 
  className, 
  color = "rgba(255, 122, 112, 0.3)" 
}: RippleProps) {
  return (
    <motion.div
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{
          scale: 2,
          opacity: [0, 0.5, 0],
          transition: { duration: 0.6 }
        }}
      />
    </motion.div>
  )
}

interface FloatingProps {
  children: React.ReactNode
  intensity?: "low" | "medium" | "high"
  className?: string
}

export function Floating({ 
  children, 
  intensity = "medium", 
  className 
}: FloatingProps) {
  const intensityMap = {
    low: { y: [0, -4, 0], duration: 3 },
    medium: { y: [0, -8, 0], duration: 2.5 },
    high: { y: [0, -12, 0], duration: 2 }
  }

  return (
    <motion.div
      animate={intensityMap[intensity]}
      transition={{
        duration: intensityMap[intensity].duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface TypewriterProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export function Typewriter({ 
  text, 
  speed = 50, 
  className, 
  onComplete 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="ml-1"
      >
        |
      </motion.span>
    </span>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  color?: string
}

export function ProgressRing({ 
  progress, 
  size = 100, 
  strokeWidth = 8, 
  className,
  color = "#FF7A70"
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// Add missing import
import { useState } from "react"
