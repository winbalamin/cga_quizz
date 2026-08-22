"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QuestionCard } from "@/components/QuestionCard"
import { QuizTimer, QuizProgress } from "@/components/QuizTimer"
import { QuizWatermark } from "@/components/QuizWatermark"
import { useExamTimer } from "@/hooks/useExamTimer"
import { getExamStatus } from "@/actions/exam"
import { getOrCreateSession, getQuestionsForQuiz } from "@/actions/session"
import { saveResponse, finalizeQuiz } from "@/actions/response"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Flag, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Question, Choice } from "@prisma/client"

type QuestionWithChoices = Question & { choices: Choice[]; prompt?: string }

function QuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const phone = searchParams.get("phone")

  const [questions, setQuestions] = useState<QuestionWithChoices[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const initializedRef = useRef(false)
  const pendingSavesRef = useRef<Promise<unknown>[]>([])

  const { timeLeft, formatted, isExpired, isLoading: timerLoading, examStatus } =
    useExamTimer()

  const handleSubmit = useCallback(async () => {
    if (!sessionId || isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      await Promise.allSettled(pendingSavesRef.current)
      pendingSavesRef.current = []
      await finalizeQuiz(sessionId)
      toast.success("Quiz submitted!")
      router.push(`/quiz/result?sessionId=${sessionId}`)
    } catch {
      toast.error("Failed to submit quiz")
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [sessionId, router])

  const initQuiz = useCallback(async () => {
    if (initializedRef.current || !userId) return

    const status = await getExamStatus()
    if (status.status !== "active") return

    initializedRef.current = true

    try {
      const [qs, { session, responses }] = await Promise.all([
        getQuestionsForQuiz(),
        getOrCreateSession(userId),
      ])
      setQuestions(qs)
      setSessionId(session.id)

      const saved: Record<string, string> = {}
      for (const r of responses) {
        saved[r.questionId] = r.answer
      }
      setAnswers(saved)
    } catch {
      toast.error("Failed to start quiz")
      router.push("/")
    } finally {
      setIsInitializing(false)
    }
  }, [userId, router])

  useEffect(() => {
    if (examStatus === "active") {
      initQuiz()
    } else if (examStatus === "ended") {
      setIsInitializing(false)
    } else {
      setIsInitializing(false)
    }
  }, [examStatus, initQuiz])

  useEffect(() => {
    if (isExpired && sessionId && !isSubmittingRef.current) {
      handleSubmit()
    }
  }, [isExpired, sessionId, handleSubmit])

  const currentQuestion = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const answeredCount = Object.keys(answers).length
  const unansweredIndices: number[] = []
  for (let i = 0; i < questions.length; i++) {
    if (!answers[questions[i].id]) {
      unansweredIndices.push(i)
    }
  }

  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      if (sessionId) {
        const pending = saveResponse(sessionId, questionId, answer)
        pendingSavesRef.current.push(pending)
        pending.then(
          () => {
            pendingSavesRef.current = pendingSavesRef.current.filter(
              (p) => p !== pending
            )
          },
          () => {
            pendingSavesRef.current = pendingSavesRef.current.filter(
              (p) => p !== pending
            )
          }
        )
      }
    },
    [sessionId]
  )

  const goTo = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Invalid access. Please start from the home page.
        </p>
      </div>
    )
  }

  if (examStatus === "ended") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 motion-scale-in">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Exam has ended</p>
          <p className="text-sm text-muted-foreground">
            The exam session is no longer active.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  if (examStatus === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 motion-scale-in">
          <Clock className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-lg font-medium">Waiting for exam to start</p>
          <p className="text-sm text-muted-foreground">
            The exam will begin when the administrator starts the session. Please
            wait.
          </p>
        </div>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground motion-fade-in animate-pulse">Loading questions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      {phone && <QuizWatermark phone={phone} />}
      <div className="space-y-3 motion-slide-in-down">
        <QuizTimer
          timeLeft={timeLeft}
          formatted={formatted}
          isExpired={isExpired}
          isLoading={timerLoading}
        />
        <QuizProgress current={answeredCount} total={questions.length} />
      </div>

      {currentQuestion && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(answeredCount)}
              disabled={answeredCount === 0}
            >
              <Flag className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">Skip to next unanswered</span>
              <span className="sm:hidden">Skip ahead</span>
            </Button>
          </div>

          <div key={currentIndex} className="motion-question-enter">
            <QuestionCard
              question={currentQuestion}
              savedAnswer={answers[currentQuestion.id] ?? null}
              onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
            />
          </div>

          {isLast && unansweredIndices.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  You have {unansweredIndices.length} unanswered question
                  {unansweredIndices.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unansweredIndices.map((idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-800/50 transition-colors"
                    onClick={() => goTo(idx)}
                  >
                    #{idx + 1}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-4">
            <Button
              variant="outline"
              className="motion-press"
              onClick={() => goTo(currentIndex - 1)}
              disabled={isFirst}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            {isLast ? (
              <Button
                className="motion-press"
                onClick={handleSubmit}
                disabled={isSubmitting || isExpired}
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button className="motion-press" onClick={() => goTo(currentIndex + 1)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  )
}
