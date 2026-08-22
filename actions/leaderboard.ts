"use server"

import { prisma } from "@/lib/prisma"
import { formatMyanmarTime } from "@/lib/utils"

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone
  return "*".repeat(phone.length - 4) + phone.slice(-4)
}

export async function getLeaderboard(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize

  const [allSessions, total] = await Promise.all([
    prisma.quizSession.findMany({
      where: {
        completedAt: { not: null },
        score: { not: null },
      },
      include: {
        user: { select: { name: true, phone: true } },
      },
    }),
    prisma.quizSession.count({
      where: {
        completedAt: { not: null },
        score: { not: null },
      },
    }),
  ])

  const ranked = [...allSessions].sort((a, b) => {
    const scoreDiff = Math.round(b.score ?? 0) - Math.round(a.score ?? 0)
    if (scoreDiff !== 0) return scoreDiff

    const aTime = a.completedAt ? a.completedAt.getTime() : 0
    const bTime = b.completedAt ? b.completedAt.getTime() : 0
    return aTime - bTime
  })

  const sessions = ranked.slice(skip, skip + pageSize)

  return {
    entries: sessions.map((s, i) => ({
      rank: skip + i + 1,
      name: s.user.name,
      phone: maskPhone(s.user.phone),
      correctCount: Math.round(s.score ?? 0),
      totalQuestions: s.totalQuestions,
      completedAt: s.completedAt!.toISOString(),
      completedAtFormatted: formatMyanmarTime(s.completedAt!),
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
}
