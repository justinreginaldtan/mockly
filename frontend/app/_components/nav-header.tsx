"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

export default function NavHeader() {
  const pathname = usePathname()
  const isMinimalHeader = pathname === "/mock"

  return (
    <header className="sticky top-0 z-50 border-b border-[#EDE5E0] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 hover:scale-105">
          <Image 
            src="/mocklytransparent.png" 
            alt="Mockly" 
            width={40} 
            height={40}
            className="rounded-xl"
          />
        </Link>

        {!isMinimalHeader && (
          <nav className="flex items-center gap-2">
            <Link
              href="/setup"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/setup" || pathname === "/results"
                  ? "bg-[#FFE7E4] text-[#FF7A70]"
                  : "text-[#777777] hover:bg-[#FFF2ED] hover:text-[#1A1A1A]"
              }`}
            >
              Job Interviews
            </Link>
            <Link
              href="/sim"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/sim"
                  ? "bg-[#E8F4FF] text-[#6EC8FF]"
                  : "text-[#777777] hover:bg-[#E8F4FF] hover:text-[#1A1A1A]"
              }`}
            >
              CS Training
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
