interface InterviewerAvatarProps {
  isSpeaking: boolean
}

export function InterviewerAvatar({ isSpeaking }: InterviewerAvatarProps) {
  return (
    <div className="relative">
      {/* Outer pulsing ring */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" style={{ padding: "20px" }} />
      )}

      {/* Main avatar circle */}
      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/80 to-accent/60 flex items-center justify-center shadow-2xl">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <svg className="w-20 h-20 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background" />
    </div>
  )
}
