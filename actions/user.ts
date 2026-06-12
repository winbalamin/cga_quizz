"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

export async function getUsers() {
  await requireAdmin()
  try {
    return await prisma.user.findMany({
      include: {
        sessions: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return []
  }
}

export async function deleteUser(id: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id } })
  revalidatePath("/admin/users")
}

export async function resetUserSession(userId: string) {
  await requireAdmin()
  await prisma.quizSession.deleteMany({ where: { userId } })
  revalidatePath("/admin/users")
}

export async function deleteAllUsers() {
  await requireAdmin()
  await prisma.quizSession.deleteMany()
  await prisma.response.deleteMany()
  await prisma.user.deleteMany()
  revalidatePath("/admin/users")
}
