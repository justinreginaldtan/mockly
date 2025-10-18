interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 w-12 rounded-full transition-colors ${
            index < currentStep ? "bg-primary" : index === currentStep ? "bg-primary/50" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}
