"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

export async function getAdminResults() {
  await requireAdmin()

  try {
    const sessions = await prisma.quizSession.findMany({
      where: {
        completedAt: { not: null },
        score: { not: null },
      },
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: [{ score: "desc" }, { completedAt: "asc" }],
    })

    return sessions.map(
      (
        s: {
          user: { name: string; phone: string }
          score: number | null
          totalQuestions: number
          completedAt: Date | null
        },
        i: number
      ) => ({
        rank: i + 1,
        name: s.user.name,
        phone: s.user.phone,
        correctCount: Math.round(s.score!),
        totalQuestions: s.totalQuestions,
        completedAt: s.completedAt!.toISOString(),
      })
    )
  } catch {
    return []
  }
}

export async function exportResultsCSV() {
  await requireAdmin()

  const results = await getAdminResults()

  const headers = ["Rank", "Name", "Phone", "Score", "Total", "Completed At"]
  const rows = results.map(
    (r: {
      rank: number
      name: string
      phone: string
      correctCount: number
      totalQuestions: number
      completedAt: string
    }) =>
      [
        r.rank,
        r.name,
        r.phone,
        r.correctCount,
        r.totalQuestions,
        new Date(r.completedAt).toLocaleString(),
      ].map((v: number | string) => `"${String(v).replace(/"/g, '""')}"`)
  )

  const csv = [
    "\uFEFF" + headers.join(","),
    ...rows.map((r: string[]) => r.join(",")),
  ].join("\n")

  return csv
}

function choiceLabel(index: number): string {
  return String.fromCharCode(65 + index)
}

function resolveAnswer(
  answer: string,
  questionType: string,
  choices: { id: string; text: string; isCorrect: boolean }[]
): string {
  if (!answer) return ""

  switch (questionType) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      const idx = choices.findIndex((c) => c.id === answer)
      return idx >= 0 ? `${choiceLabel(idx)}. ${choices[idx].text}` : answer
    }
    case "CHECKBOX": {
      try {
        const ids: string[] = JSON.parse(answer)
        return ids
          .map((id) => {
            const idx = choices.findIndex((c) => c.id === id)
            return idx >= 0 ? `${choiceLabel(idx)}. ${choices[idx].text}` : id
          })
          .join("; ")
      } catch {
        return answer
      }
    }
    default:
      return answer
  }
}

function resolveCorrectAnswer(
  questionType: string,
  choices: { id: string; text: string; isCorrect: boolean }[]
): string {
  const correctChoices = choices.filter((c) => c.isCorrect)

  if (correctChoices.length === 0) return ""

  if (questionType === "CHECKBOX" || correctChoices.length > 1) {
    return correctChoices
      .map((c) => {
        const idx = choices.findIndex((ch) => ch.id === c.id)
        return idx >= 0 ? `${choiceLabel(idx)}. ${c.text}` : c.text
      })
      .join("; ")
  }

  const idx = choices.findIndex((ch) => ch.id === correctChoices[0].id)
  return idx >= 0
    ? `${choiceLabel(idx)}. ${correctChoices[0].text}`
    : correctChoices[0].text
}

export async function exportDetailedResultsCSV() {
  await requireAdmin()

  const sessions = await prisma.quizSession.findMany({
    where: {
      completedAt: { not: null },
      score: { not: null },
    },
    include: {
      user: { select: { name: true, phone: true } },
      responses: {
        include: {
          question: { include: { choices: true } },
        },
        orderBy: { question: { order: "asc" } },
      },
    },
    orderBy: { completedAt: "asc" },
  })

  const headers = [
    "Name",
    "Phone",
    "Question",
    "Type",
    "User Answer",
    "Correct Answer",
    "Result",
    "Score",
    "Submitted At",
  ]

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`

  const rows = sessions.flatMap((session) =>
    session.responses.map((r) => {
      const question = r.question
      const userAnswer = resolveAnswer(
        r.answer,
        question.type,
        question.choices
      )
      const correctAnswer = resolveCorrectAnswer(
        question.type,
        question.choices
      )

      const result =
        r.isCorrect === true
          ? "Correct"
          : r.isCorrect === false
            ? "Incorrect"
            : "Not Graded"

      return [
        session.user.name,
        session.user.phone,
        question.text,
        question.type.replace(/_/g, " "),
        userAnswer,
        correctAnswer,
        result,
        r.score?.toString() ?? "",
        session.completedAt!.toLocaleString(),
      ].map(escape)
    })
  )

  const csv = [
    "\uFEFF" + headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n")

  return csv
}
