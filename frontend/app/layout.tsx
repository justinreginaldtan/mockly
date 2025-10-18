import type React from "react"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import "../styles/persona-scroll.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "Mock Interviewer - AI-Powered Interview Practice",
  description: "Practice your interviews with AI-powered mock interviews tailored to your resume and job description",
    generator: 'v0.app'
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
