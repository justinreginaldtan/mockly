import type React from "react"
import type { Metadata } from "next"
import { Inter, DM_Sans } from "next/font/google"
import { PageTransition } from "@/components/page-transition"
import "./globals.css"
import "../styles/persona-scroll.css"

const heading = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Mockly – Your AI Interview Coach",
  description:
    "Practice interviews with personalized voice feedback and real-time coaching from your friendly AI coach, Mockly.",
  keywords: [
    "mock interview",
    "AI coach",
    "interview practice",
    "voice feedback",
    "Gemini",
    "ElevenLabs",
  ],
  authors: [{ name: "Mockly Team" }],
  icons: {
    icon: "/mocklytransparent.png",
    shortcut: "/mocklytransparent.png",
    apple: "/mocklytransparent.png",
  },
  openGraph: {
    title: "Mockly – Your AI Interview Coach",
    description:
      "Turn every practice session into progress. Mockly gives you instant, structured feedback on your answers.",
    url: "https://coachmockly.com",
    siteName: "Mockly",
    images: [
      {
        url: "/og-mockly.png",
        width: 1200,
        height: 630,
        alt: "Mockly App Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mockly – Your AI Interview Coach",
    description: "Practice interviews with instant feedback and real-time voice coaching.",
    images: ["/og-mockly.png"],
  },
  themeColor: "#FF7A70",
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} antialiased`}>
      <body className="font-body">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}
