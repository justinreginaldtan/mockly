import type React from "react"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import "../styles/persona-scroll.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
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
    <html lang="en" className={`${manrope.variable} ${inter.variable} antialiased`}>
      <body className="font-body">{children}</body>
    </html>
  )
}
