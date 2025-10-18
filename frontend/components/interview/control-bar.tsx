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
      'pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-5 py-3 shadow-md backdrop-blur-md transition duration-300',
    iconButton:
      'border border-transparent bg-white/10 text-white hover:bg-white/20 transition-colors duration-300',
    muteActive: 'bg-rose-600/80 hover:bg-rose-600/70',
    insightsButton:
      'border border-transparent bg-white/10 text-white hover:bg-white/20 transition-colors duration-300',
    insightsActive: 'bg-white/20 text-white',
    exitButton:
      'border border-transparent bg-red-500 text-white hover:bg-red-600 hover:text-white transition-colors duration-300',
    icon: 'text-white transition-colors duration-300',
    activeIcon: 'text-emerald-300 animate-pulse',
  },
  google: {
    wrapper:
      'pointer-events-auto flex items-center gap-3 rounded-full border border-gray-300 bg-gray-100 px-5 py-3 shadow-md transition duration-300',
    iconButton:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-200 transition-colors duration-300',
    muteActive: 'bg-rose-500 text-white hover:bg-rose-600 border-rose-500',
    insightsButton:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-200 transition-colors duration-300',
    insightsActive: 'border-blue-500 bg-blue-500/10 text-blue-600',
    exitButton:
      'border border-transparent bg-red-500 text-white hover:bg-red-600 transition-colors duration-300',
    icon: 'text-gray-700 transition-colors duration-300',
    activeIcon: 'text-blue-600 animate-pulse',
  },
  minimal: {
    wrapper:
      'pointer-events-auto flex items-center gap-3 rounded-full bg-transparent px-5 py-3 transition duration-300',
    iconButton:
      'border border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white transition-colors duration-300',
    muteActive: 'border-rose-500 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20',
    insightsButton:
      'border border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white transition-colors duration-300',
    insightsActive: 'border-white/30 bg-white/10 text-white',
    exitButton:
      'border border-rose-500 bg-transparent text-rose-400 hover:bg-rose-500/20 transition-colors duration-300',
    icon: 'text-gray-300 transition-colors duration-300',
    activeIcon: 'text-white animate-pulse',
    inactiveIcon: 'text-gray-500',
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
