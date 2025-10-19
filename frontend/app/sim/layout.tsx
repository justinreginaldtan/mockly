import type { Viewport } from "next"
import React from "react"

export const viewport: Viewport = {
  themeColor: "#FFF8F5",
}

export default function SimLayout({ children }: { children: React.ReactNode }) {
  return children
}


