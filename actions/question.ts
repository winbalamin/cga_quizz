"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

export async function getQuestions() {
  await requireAdmin()
  try {
    return await prisma.question.findMany({
      include: { choices: true },
      orderBy: { order: "asc" },
    })
  } catch {
    return []
  }
}

export async function getQuestion(id: string) {
  await requireAdmin()
  try {
    return await prisma.question.findUnique({
      where: { id },
      include: { choices: true },
    })
  } catch {
    return null
  }
}

export async function createQuestion(data: {
  text: string
  type: "MULTIPLE_CHOICE" | "CHECKBOX" | "TRUE_FALSE" | "SHORT_TEXT" | "LONG_TEXT"
  order: number
  choices: { text: string; isCorrect: boolean }[]
}) {
  await requireAdmin()
  const question = await prisma.question.create({
    data: {
      text: data.text,
      type: data.type,
      order: data.order,
      choices: {
        create: data.choices,
      },
    },
  })
  revalidatePath("/admin/questions")
  return question
}

export async function updateQuestion(
  id: string,
  data: {
    text: string
    type: "MULTIPLE_CHOICE" | "CHECKBOX" | "TRUE_FALSE" | "SHORT_TEXT" | "LONG_TEXT"
    order: number
    choices: { id?: string; text: string; isCorrect: boolean }[]
  }
) {
  await requireAdmin()
  await prisma.choice.deleteMany({ where: { questionId: id } })
  const question = await prisma.question.update({
    where: { id },
    data: {
      text: data.text,
      type: data.type,
      order: data.order,
      choices: {
        create: data.choices.map((c) => ({
          text: c.text,
          isCorrect: c.isCorrect,
        })),
      },
    },
  })
  revalidatePath("/admin/questions")
  return question
}

export async function deleteQuestion(id: string) {
  await requireAdmin()
  await prisma.question.delete({ where: { id } })
  revalidatePath("/admin/questions")
}

export async function deleteAllQuestions() {
  await requireAdmin()
  await prisma.response.deleteMany()
  await prisma.choice.deleteMany()
  await prisma.question.deleteMany()
  revalidatePath("/admin/questions")
}

export type ImportResult = {
  success: number
  failed: { row: number; error: string }[]
}

export async function importQuestionsFromCSV(
  rows: {
    text: string
    type: string
    order: string
    choices?: string
    correct?: string
  }[]
): Promise<ImportResult> {
  await requireAdmin()

  const validTypes = [
    "MULTIPLE_CHOICE",
    "CHECKBOX",
    "TRUE_FALSE",
    "SHORT_TEXT",
    "LONG_TEXT",
  ] as const

  let success = 0
  const failed: { row: number; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      const rawType = row.type?.trim().toUpperCase()
      if (!rawType || !validTypes.includes(rawType as (typeof validTypes)[number])) {
        failed.push({ row: rowNum, error: `Invalid type: "${row.type}"` })
        continue
      }
      const type = rawType as (typeof validTypes)[number]

      if (!row.text?.trim()) {
        failed.push({ row: rowNum, error: "Question text is required" })
        continue
      }

      const order = Number(row.order)
      if (isNaN(order) || !Number.isInteger(order)) {
        failed.push({ row: rowNum, error: `Invalid order: "${row.order}"` })
        continue
      }

      const needsChoices: (typeof validTypes)[number][] = [
        "MULTIPLE_CHOICE",
        "CHECKBOX",
        "TRUE_FALSE",
      ]

      let choiceTexts: string[] = []

      if (needsChoices.includes(type)) {
        if (type === "TRUE_FALSE" && !row.choices?.trim()) {
          choiceTexts = ["True", "False"]
        } else {
          const raw = row.choices || ""
          choiceTexts = raw.split("|").map((s: string) => s.trim()).filter(Boolean)
        }

        if (choiceTexts.length < 2) {
          failed.push({ row: rowNum, error: "At least 2 choices required" })
          continue
        }

        const rawCorrect = row.correct?.trim() || ""
        const correctIndices = rawCorrect
          .split(",")
          .map((s: string) => Number(s.trim()))
          .filter((n: number) => !isNaN(n))

        const choices = choiceTexts.map((text, ci) => ({
          text,
          isCorrect: correctIndices.includes(ci),
        }))

        const correctCount = choices.filter((c: { isCorrect: boolean }) => c.isCorrect).length

        if (type === "MULTIPLE_CHOICE" && correctCount !== 1) {
          failed.push({
            row: rowNum,
            error: "MULTIPLE_CHOICE needs exactly 1 correct choice",
          })
          continue
        }

        if (type === "TRUE_FALSE" && correctCount !== 1) {
          failed.push({
            row: rowNum,
            error: "TRUE_FALSE needs exactly 1 correct choice",
          })
          continue
        }

        if (type === "CHECKBOX" && correctCount < 1) {
          failed.push({
            row: rowNum,
            error: "CHECKBOX needs at least 1 correct choice",
          })
          continue
        }

        await prisma.question.create({
          data: {
            text: row.text.trim(),
            type,
            order,
            choices: { create: choices },
          },
        })

        success++
      } else {
        await prisma.question.create({
          data: {
            text: row.text.trim(),
            type,
            order,
          },
        })

        success++
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      failed.push({ row: rowNum, error: message })
    }
  }

  revalidatePath("/admin/questions")
  return { success, failed }
}
