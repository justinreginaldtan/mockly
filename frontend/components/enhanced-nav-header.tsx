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
  const breadcrumbs = breadcrumbMap[pathname] || []
  const isMinimalHeader = pathname === "/mock" || pathname === "/results"
  
  // Calculate progress
  const currentStepIndex = progressSteps.findIndex(step => pathname.startsWith(step.path))
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / progressSteps.length) * 100 : 0

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-[#EDE5E0] bg-white/95 backdrop-blur-xl shadow-sm"
    >
      <div className="mx-auto max-w-screen-lg px-4 py-3 md:px-8">
        <div className="flex items-center justify-between">
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

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && !isMinimalHeader && (
            <nav className="hidden md:flex items-center space-x-2" aria-label="Breadcrumb">
              {breadcrumbs.map((item, index) => {
                const Icon = item.icon
                const isLast = index === breadcrumbs.length - 1
                
                return (
                  <div key={item.href} className="flex items-center">
                    {index > 0 && (
                      <div className="mx-2 text-[#D1D5DB]">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isLast
                          ? "text-[#1A1A1A] bg-[#F3F4F6]"
                          : "text-[#777777] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                      {item.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </Link>
                  </div>
                )
              })}
            </nav>
          )}

          {/* Progress Bar */}
          {!isMinimalHeader && progress > 0 && (
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {progressSteps.map((step, index) => {
                  const isActive = pathname.startsWith(step.path)
                  const isCompleted = index < currentStepIndex
                  const Icon = step.icon
                  
                  return (
                    <div key={step.path} className="flex items-center">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-200",
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isActive 
                            ? "bg-[#FF7A70] text-white" 
                            : "bg-[#F3F4F6] text-[#9CA3AF]"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      {index < progressSteps.length - 1 && (
                        <div className={cn(
                          "w-8 h-0.5 mx-2 transition-colors duration-200",
                          isCompleted ? "bg-green-500" : "bg-[#E5E7EB]"
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-[#777777] font-medium">
                {Math.round(progress)}% Complete
              </div>
            </div>
          )}

          {/* Main Navigation */}
          {!isMinimalHeader && (
            <nav className="flex items-center gap-2">
              <Link
                href="/setup"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105",
                  pathname === "/setup" || pathname === "/results"
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
          )}

          {/* Back Button for Interview/Results */}
          {(pathname === "/mock" || pathname === "/results") && (
            <Link
              href="/setup"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#777777] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Setup</span>
            </Link>
          )}
        </div>

        {/* Mobile Progress Bar */}
        {!isMinimalHeader && progress > 0 && (
          <div className="mt-3 lg:hidden">
            <div className="flex items-center justify-between text-xs text-[#777777] mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-[#FF7A70] to-[#6EC8FF] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.header>
  )
}
