"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSessionResult } from "@/actions/grading"
import { formatMyanmarTime } from "@/lib/utils"
import { Trophy, Target, CheckCircle2, Clock } from "lucide-react"

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("sessionId")

  const [result, setResult] = useState<{
    score: number
    totalQuestions: number
    correctCount: number
    completedAt?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    getSessionResult(sessionId).then((r) => {
      setResult(r)
      setIsLoading(false)
    })
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No result data found.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground motion-fade-in animate-pulse">Calculating your score...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center motion-scale-in">
        <CardHeader>
          <Trophy className="mx-auto h-12 w-12 text-amber-500 mb-2" />
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>
            Here&apos;s how you performed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="motion-score-reveal">
            <div className="text-5xl font-bold tabular-nums">
              {result?.correctCount ?? 0}/{result?.totalQuestions ?? 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Correct Answers
            </p>
          </div>

          <div className="flex justify-center gap-8 motion-fade-in-up motion-delay-2">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-green-500 mb-1" />
              <div className="font-bold tabular-nums">{result?.correctCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <Target className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <div className="font-bold tabular-nums">{result?.totalQuestions ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {result?.completedAt && (
            <div className="flex justify-center motion-fade-in-up motion-delay-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Completed: {formatMyanmarTime(result.completedAt)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 motion-fade-in-up motion-delay-3">
            <Button className="motion-press" onClick={() => router.push("/leaderboard")}>
              View Leaderboard
            </Button>
            <Button
              variant="outline"
              className="motion-press"
              onClick={() => router.push("/")}
            >
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Skeleton className="h-64 w-full max-w-md" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
