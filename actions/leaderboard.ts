"use server"

import { prisma } from "@/lib/prisma"

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone
  return "*".repeat(phone.length - 4) + phone.slice(-4)
}

export async function getLeaderboard(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize

  const [sessions, total] = await Promise.all([
    prisma.quizSession.findMany({
      where: {
        completedAt: { not: null },
        score: { not: null },
      },
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: [{ score: "desc" }, { completedAt: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.quizSession.count({
      where: {
        completedAt: { not: null },
        score: { not: null },
      },
    }),
  ])

  return {
    entries: sessions.map((s, i) => ({
      rank: skip + i + 1,
      name: s.user.name,
      phone: maskPhone(s.user.phone),
      correctCount: Math.round(s.score!),
      totalQuestions: s.totalQuestions,
      completedAt: s.completedAt!.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
}
