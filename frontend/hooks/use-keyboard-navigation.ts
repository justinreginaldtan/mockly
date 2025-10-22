"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function useKeyboardNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key - Go to home from any page
      if (event.key === "Escape") {
        // Don't navigate if user is typing in an input/textarea
        const target = event.target as HTMLElement
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return
        }

        // Don't navigate if already on home page
        if (pathname === "/") {
          return
        }

        // Navigate to home
        router.push("/")
      }

      // Ctrl/Cmd + K - Quick navigation (future enhancement)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        // Could open a command palette in the future
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, pathname])
}
