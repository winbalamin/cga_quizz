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
import { saveResponse, submitQuiz } from "@/actions/response"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Flag, Clock } from "lucide-react"
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

  const { timeLeft, formatted, isExpired, isLoading: timerLoading, examStatus } =
    useExamTimer()

  const handleSubmit = useCallback(async () => {
    if (!sessionId || isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      await submitQuiz(sessionId)
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

  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      if (sessionId) {
        saveResponse(sessionId, questionId, answer)
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
        <div className="text-center space-y-4">
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
        <div className="text-center space-y-4">
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
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      {phone && <QuizWatermark phone={phone} />}
      <div className="space-y-3">
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
          <div className="flex items-center justify-between">
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
              Skip to next unanswered
            </Button>
          </div>

          <QuestionCard
            question={currentQuestion}
            savedAnswer={answers[currentQuestion.id] ?? null}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
          />

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => goTo(currentIndex - 1)}
              disabled={isFirst}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            {isLast ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isExpired}
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button onClick={() => goTo(currentIndex + 1)}>
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
