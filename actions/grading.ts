"use server"

import { prisma } from "@/lib/prisma"

export async function gradeSession(sessionId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      responses: {
        include: {
          question: { include: { choices: true } },
        },
      },
    },
  })

  if (!session) throw new Error("Session not found")
  if (!session.completedAt) {
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date() },
    })
  }

  let totalScore = 0
  const totalQuestions = session.totalQuestions || session.responses.length

  for (const response of session.responses) {
    const question = response.question
    let isCorrect = false
    let score = 0

    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE": {
        const correctChoice = question.choices.find(
          (c: { isCorrect: boolean; id: string }) => c.isCorrect
        )
        if (correctChoice && response.answer === correctChoice.id) {
          isCorrect = true
          score = 1
        }
        break
      }

      case "CHECKBOX": {
        try {
          const selectedIds: string[] = JSON.parse(response.answer)
          const correctIds = question.choices
            .filter((c: { isCorrect: boolean; id: string }) => c.isCorrect)
            .map((c: { id: string }) => c.id)
          if (
            selectedIds.length === correctIds.length &&
            selectedIds.every((id) => correctIds.includes(id))
          ) {
            isCorrect = true
            score = 1
          } else if (
            selectedIds.some((id) => correctIds.includes(id))
          ) {
            score = selectedIds.filter((id) => correctIds.includes(id)).length / correctIds.length
          }
        } catch {
          // malformed answer
        }
        break
      }

      case "SHORT_TEXT":
      case "LONG_TEXT": {
        const correctAnswers = question.choices
          .filter((c: { isCorrect: boolean; text: string }) => c.isCorrect)
          .map((c: { text: string }) => c.text.trim().toLowerCase())
        const userAnswer = response.answer.trim().toLowerCase()
        if (correctAnswers.some((ca) => ca === userAnswer)) {
          isCorrect = true
          score = 1
        }
        break
      }
    }

    totalScore += score

    await prisma.response.update({
      where: { id: response.id },
      data: { isCorrect, score },
    })
  }

  const finalScore = totalScore

  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { score: finalScore },
  })

  return {
    score: finalScore,
    totalQuestions,
    correctCount: Math.round(totalScore),
  }
}

export async function getSessionResult(sessionId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { user: { select: { name: true } } },
  })

  if (!session) throw new Error("Session not found")

  if (session.score === null) {
    return await gradeSession(sessionId)
  }

  const correctCount = await prisma.response.count({
    where: { sessionId, isCorrect: true },
  })

  return {
    score: session.score,
    totalQuestions: session.totalQuestions,
    correctCount,
  }
}
