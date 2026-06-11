"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Clock, CheckCircle2 } from "lucide-react"
import { startExam, resetExam, getExamStatus } from "@/actions/exam"
import { toast } from "sonner"
import { formatTime } from "@/lib/utils"

export function ExamControl() {
  const [status, setStatus] = useState<
    "idle" | "active" | "ended" | "loading"
  >("loading")
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const result = await getExamStatus()
      setStatus(result.status)
      if (result.status === "active" && result.deadline) {
        setTimeLeft(Math.max(0, result.deadline.getTime() - Date.now()))
      } else {
        setTimeLeft(null)
      }
    } catch {
      setStatus("idle")
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleStart = async () => {
    setIsBusy(true)
    try {
      await startExam()
      toast.success("Exam started!")
      await refresh()
    } catch {
      toast.error("Failed to start exam")
    } finally {
      setIsBusy(false)
    }
  }

  const handleReset = async () => {
    setIsBusy(true)
    try {
      await resetExam()
      toast.success("Exam reset")
      setStatus("idle")
      setTimeLeft(null)
    } catch {
      toast.error("Failed to reset exam")
    } finally {
      setIsBusy(false)
    }
  }

  const formatted = timeLeft !== null ? formatTime(timeLeft) : "--:--"
  const isWarning = timeLeft !== null && timeLeft < 5 * 60 * 1000 && timeLeft > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Exam Control
        </CardTitle>
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "ended"
                ? "secondary"
                : "outline"
          }
        >
          {status === "active"
            ? "LIVE"
            : status === "ended"
              ? "Ended"
              : status === "loading"
                ? "..."
                : "Ready"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "active" && timeLeft !== null && (
          <div className="text-center">
            <div
              className={`text-3xl font-bold tabular-nums font-mono ${
                isWarning ? "text-amber-500" : ""
              }`}
            >
              {formatted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Remaining
            </p>
          </div>
        )}

        {status === "idle" && (
          <div className="text-center space-y-3">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Exam not started
            </p>
          </div>
        )}

        {status === "ended" && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Exam completed
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {status === "idle" && (
            <Button
              className="w-full"
              onClick={handleStart}
              disabled={isBusy}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Exam
            </Button>
          )}
          {(status === "active" || status === "ended") && (
            <Button
              className="w-full"
              variant="outline"
              onClick={handleReset}
              disabled={isBusy}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Exam
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
