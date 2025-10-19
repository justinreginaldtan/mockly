import type React from "react"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import "../styles/persona-scroll.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "Mockly – Your AI Interview Coach",
  description: "Practice interviews with personalized voice feedback and real-time coaching.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
