"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

export async function startExam(minutes: number) {
  await requireAdmin()

  try {
    const existing = await prisma.examSession.findFirst({
      where: { isActive: true },
    })
    if (existing) return existing

    const now = new Date()
    const deadline = new Date(now.getTime() + minutes * 60 * 1000)

    const exam = await prisma.examSession.create({
      data: {
        startedAt: now,
        deadline,
        durationMinutes: minutes,
        isActive: true,
      },
    })

    revalidatePath("/admin")
    return exam
  } catch {
    throw new Error("Failed to start exam. Make sure the database is up to date.")
  }
}

export async function getExamStatus() {
  try {
    const exam = await prisma.examSession.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })

    if (!exam) return { status: "idle" as const }

    const now = new Date()

    if (exam.deadline && now >= exam.deadline) {
      await prisma.examSession.update({
        where: { id: exam.id },
        data: { isActive: false },
      })
      return { status: "ended" as const, deadline: exam.deadline }
    }

    return {
      status: "active" as const,
      startedAt: exam.startedAt!,
      deadline: exam.deadline!,
    }
  } catch {
    return { status: "idle" as const }
  }
}

export async function resetExam() {
  await requireAdmin()
  await prisma.examSession.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  })
  revalidatePath("/admin")
}

export async function getLatestExam() {
  return prisma.examSession.findFirst({
    orderBy: { createdAt: "desc" },
  })
}
