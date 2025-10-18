"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Upload, Check } from "lucide-react"

interface FileUploadCardProps {
  icon: React.ReactNode
  title: string
  description: string
  acceptedFormats: string
}

export function FileUploadCard({ icon, title, description, acceptedFormats }: FileUploadCardProps) {
  const [isUploaded, setIsUploaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setIsUploaded(true)
  }

  const handleClick = () => {
    setIsUploaded(true)
  }

  return (
    <Card
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#141c2f]/90 p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#4f61ff]/20 ${
        isDragging ? "border-[#4f61ff]/60 bg-[#1d2744]" : ""
      } ${isUploaded ? "border-[#4f61ff] shadow-lg shadow-[#4f61ff]/30" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={`p-4 rounded-2xl transition-colors duration-300 ${
            isUploaded
              ? "bg-[linear-gradient(120deg,_#4c6fff_0%,_#6b5bff_35%,_#a855f7_70%,_#38bdf8_100%)] text-white shadow-lg shadow-[#4f61ff]/30"
              : "bg-white/10 text-[#4f61ff]"
          }`}
        >
          {isUploaded ? (
            <Check className="w-6 h-6" />
          ) : (
            <div className="text-muted-foreground">{icon}</div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-white">{title}</h3>
          <p className="text-sm text-white/70">{description}</p>
        </div>
        {!isUploaded ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Upload className="w-4 h-4 text-[#4f61ff]" />
            <span>Click or drag to upload</span>
          </div>
        ) : (
          <p className="text-sm font-medium text-[#9aa7ff]">File uploaded successfully</p>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-2 h-24 rounded-full bg-gradient-to-t from-[#4f61ff]/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Card>
  )
}
