'use client'

import { cn } from '@/lib/utils'

interface InsightsDrawerProps {
  open: boolean
  onClose: () => void
  voiceLabel: string
  insights: string[]
}

export function InsightsDrawer({ open, onClose, voiceLabel, insights }: InsightsDrawerProps) {
  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-200',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-40 h-full w-full max-w-xs bg-white/95 text-gray-900 shadow-2xl transition-transform duration-200 sm:max-w-sm',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-full flex-col gap-5 px-5 py-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Live aide</p>
            <h2 className="text-lg font-semibold text-gray-900">Interview insights</h2>
            <p className="text-sm text-gray-500">
              Context from Gemini and ElevenLabs to guide your responses in real time.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-[#4b6bff]">
              Voice persona
            </p>
            <p className="text-[0.9rem] leading-[1.35] text-gray-600">{voiceLabel}</p>
          </div>

          <div className="space-y-2.5">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-[#4b6bff]">
              Gemini suggests
            </p>
            <div className="space-y-2.5">
              {insights.map((tip) => (
                <div
                  key={tip}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[0.9rem] leading-[1.35] text-gray-600 shadow-sm"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-auto rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  )
}
