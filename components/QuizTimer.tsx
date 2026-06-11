import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatTime } from "@/lib/utils"

interface QuizTimerProps {
  timeLeft: number | null
  formatted: string
  isExpired: boolean
  isLoading: boolean
}

export function QuizTimer({
  timeLeft,
  formatted,
  isExpired,
  isLoading,
}: QuizTimerProps) {
  const total = 30 * 60 * 1000
  const percent =
    timeLeft !== null ? Math.max(0, Math.min(100, (timeLeft / total) * 100)) : 100

  const isWarning = timeLeft !== null && timeLeft < 5 * 60 * 1000 && !isExpired

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Time</span>
        <span
          className={`font-mono text-lg font-bold tabular-nums ${
            isExpired
              ? "text-destructive"
              : isWarning
                ? "text-amber-500"
                : ""
          }`}
        >
          {isLoading ? "--:--" : formatted}
        </span>
      </div>
      <Progress
        value={isExpired ? 0 : percent}
        className={isWarning ? "[&>div]:bg-amber-500" : ""}
      />
    </div>
  )
}

interface QuizProgressProps {
  current: number
  total: number
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const percent = Math.round((current / total) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Progress
        </span>
        <span className="text-sm text-muted-foreground">
          {current} / {total}
        </span>
      </div>
      <Progress value={percent} />
    </div>
  )
}
