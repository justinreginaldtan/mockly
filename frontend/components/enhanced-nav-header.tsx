"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Home, Briefcase, Headphones, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  completed?: boolean
}

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  "/": [],
  "/setup": [
    { label: "Home", href: "/", icon: Home },
    { label: "Interview Setup", href: "/setup", icon: Briefcase }
  ],
  "/sim": [
    { label: "Home", href: "/", icon: Home },
    { label: "CS Training", href: "/sim", icon: Headphones }
  ],
  "/mock": [
    { label: "Home", href: "/", icon: Home },
    { label: "Interview Setup", href: "/setup", icon: Briefcase, completed: true },
    { label: "Mock Interview", href: "/mock", icon: Briefcase }
  ],
  "/results": [
    { label: "Home", href: "/", icon: Home },
    { label: "Interview Setup", href: "/setup", icon: Briefcase, completed: true },
    { label: "Mock Interview", href: "/mock", icon: Briefcase, completed: true },
    { label: "Results", href: "/results", icon: CheckCircle }
  ]
}

const progressSteps = [
  { label: "Setup", path: "/setup", icon: Briefcase },
  { label: "Interview", path: "/mock", icon: Briefcase },
  { label: "Results", path: "/results", icon: CheckCircle }
]

export default function EnhancedNavHeader() {
  const pathname = usePathname()

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-[#EDE5E0] bg-white/95 backdrop-blur-xl shadow-sm"
    >
      <div className="w-full px-4 py-4 md:px-8">
        <div className="mx-auto max-w-screen-lg flex items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 hover:scale-105 group"
          >
            <div className="relative">
              <Image 
                src="/mocklytransparent.png" 
                alt="Mockly" 
                width={40} 
                height={40}
                className="rounded-xl transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF7A70]/20 to-[#6EC8FF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-lg tracking-tight text-[#1A1A1A]">Mockly</h1>
              <p className="text-xs text-[#777777]">AI Communication Training</p>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center gap-3">
            <Link
              href="/setup/materials"
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105",
                pathname.startsWith("/setup") || pathname === "/results"
                  ? "bg-[#FFE7E4] text-[#FF7A70] shadow-sm"
                  : "text-[#777777] hover:bg-[#FFF2ED] hover:text-[#1A1A1A]"
              )}
            >
              <Briefcase className="w-4 h-4 mr-1.5 inline" />
              Job Interviews
            </Link>
            <Link
              href="/sim"
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105",
                pathname === "/sim"
                  ? "bg-[#E8F4FF] text-[#6EC8FF] shadow-sm"
                  : "text-[#777777] hover:bg-[#E8F4FF] hover:text-[#1A1A1A]"
              )}
            >
              <Headphones className="w-4 h-4 mr-1.5 inline" />
              CS Training
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}
