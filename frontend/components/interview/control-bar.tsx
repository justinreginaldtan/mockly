'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Maximize2,
  Minimize2,
  LogOut,
} from 'lucide-react'

export type ControlTheme = 'zoom' | 'google' | 'minimal'

const controlBarVariants: Record<
  ControlTheme,
  {
    wrapper: string
    iconButton: string
    muteActive: string
    insightsButton: string
    insightsActive: string
    exitButton: string
    icon: string
    activeIcon: string
    inactiveIcon?: string
  }
> = {
  zoom: {
    wrapper:
      'pointer-events-auto flex items-center gap-3 rounded-full border border-[#EDE5E0] bg-white/95 px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur transition duration-300',
    iconButton:
      'border border-[#EDE5E0] bg-white text-[#1A1A1A] hover:bg-[#FFF0EA] transition-colors duration-200',
    muteActive: 'bg-[#FF7A70] text-white border-[#FF7A70] hover:bg-[#ff695c]',
    insightsButton:
      'border border-[#EDE5E0] bg-white text-[#1A1A1A] hover:bg-[#FFF0EA] transition-colors duration-200',
    insightsActive: 'border-[#FF7A70] bg-[#FF7A70]/10 text-[#FF7A70]',
    exitButton:
      'border border-transparent bg-[#1A1A1A] text-white hover:bg-[#2E2E2E] transition-colors duration-200',
    icon: 'text-[#1A1A1A] transition-colors duration-300',
    activeIcon: 'text-[#FF7A70] animate-pulse',
  },
  google: {
    wrapper:
      'pointer-events-auto flex items-center gap-3 rounded-full border border-[#EDE5E0] bg-white/95 px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur transition duration-300',
    iconButton:
      'border border-[#EDE5E0] bg-white text-[#1A1A1A] hover:bg-[#FFF0EA] transition-colors duration-200',
    muteActive: 'bg-[#F38B6C] text-white border-[#F38B6C] hover:bg-[#e97b59]',
    insightsButton:
      'border border-[#EDE5E0] bg-white text-[#1A1A1A] hover:bg-[#FFF0EA] transition-colors duration-200',
    insightsActive: 'border-[#F38B6C] bg-[#F38B6C]/10 text-[#F38B6C]',
    exitButton:
      'border border-transparent bg-[#1A1A1A] text-white hover:bg-[#2E2E2E] transition-colors duration-200',
    icon: 'text-[#1A1A1A] transition-colors duration-300',
    activeIcon: 'text-[#F38B6C] animate-pulse',
  },
  minimal: {
    wrapper:
      'pointer-events-auto flex items-center gap-3 rounded-full border border-[#EDE5E0] bg-white/95 px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur transition duration-300',
    iconButton:
      'border border-[#EDE5E0] bg-white text-[#1A1A1A] hover:bg-[#FFF0EA] transition-colors duration-200',
    muteActive: 'bg-[#FF7A70] text-white border-[#FF7A70] hover:bg-[#ff695c]',
    insightsButton:
      'border border-[#EDE5E0] bg-white text-[#1A1A1A] hover:bg-[#FFF0EA] transition-colors duration-200',
    insightsActive: 'border-[#FF7A70] bg-[#FF7A70]/10 text-[#FF7A70]',
    exitButton:
      'border border-transparent bg-[#1A1A1A] text-white hover:bg-[#2E2E2E] transition-colors duration-200',
    icon: 'text-[#1A1A1A] transition-colors duration-300',
    activeIcon: 'text-[#FF7A70] animate-pulse',
    inactiveIcon: 'text-[#777777]',
  },
}

interface ControlBarProps {
  isMuted: boolean
  onToggleMute: () => void
  isCameraOn: boolean
  onToggleCamera: () => void
  insightsOpen: boolean
  onToggleInsights: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onExit: () => void
  theme?: ControlTheme
}

export function ControlBar({
  isMuted,
  onToggleMute,
  isCameraOn,
  onToggleCamera,
  insightsOpen,
  onToggleInsights,
  isFullscreen,
  onToggleFullscreen,
  onExit,
  theme = 'zoom',
}: ControlBarProps) {
  const styles = controlBarVariants[theme]

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 md:flex-row">
      <div className={cn(styles.wrapper)}>
        <Button
          size="icon"
          variant="outline"
          onClick={onToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(styles.iconButton, isMuted && styles.muteActive)}
        >
          {isMuted ? (
            <MicOff className={cn('h-4 w-4', styles.icon)} />
          ) : (
            <Mic className={cn('h-4 w-4', styles.icon, styles.activeIcon)} />
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={onToggleCamera}
          aria-pressed={isCameraOn}
          aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
          className={cn(styles.iconButton)}
        >
          {isCameraOn ? (
            <Video className={cn('h-4 w-4', styles.icon, styles.activeIcon)} />
          ) : (
            <VideoOff className={cn('h-4 w-4', styles.icon, theme === 'minimal' && styles.inactiveIcon)}
            />
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onToggleInsights}
          aria-pressed={insightsOpen}
          className={cn(styles.insightsButton, insightsOpen && styles.insightsActive, 'px-4 text-sm')}
        >
          <MessageSquare className={cn('mr-2 h-4 w-4', styles.icon)} />
          Insights
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={onToggleFullscreen}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={cn(styles.iconButton)}
        >
          {isFullscreen ? (
            <Minimize2 className={cn('h-4 w-4', styles.icon)} />
          ) : (
            <Maximize2 className={cn('h-4 w-4', styles.icon)} />
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onExit}
          className={cn(styles.exitButton, 'px-5')}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Exit
        </Button>
      </div>
    </div>
  )
}
