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

    return sessions.map((s, i) => ({
      rank: i + 1,
      name: s.user.name,
      phone: s.user.phone,
      correctCount: Math.round(s.score!),
      totalQuestions: s.totalQuestions,
      completedAt: s.completedAt!.toISOString(),
    }))
  } catch {
    return []
  }
}

export async function exportResultsCSV() {
  await requireAdmin()

  const results = await getAdminResults()

  const headers = ["Rank", "Name", "Phone", "Score", "Total", "Completed At"]
  const rows = results.map((r) =>
    [
      r.rank,
      r.name,
      r.phone,
      r.correctCount,
      r.totalQuestions,
      new Date(r.completedAt).toLocaleString(),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
  )

  const csv = ["\uFEFF" + headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  )

  return csv
}
