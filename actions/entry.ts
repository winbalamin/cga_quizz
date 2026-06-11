"use server"

import { prisma } from "@/lib/prisma"
import { phoneEntrySchema } from "@/lib/validations"

export async function handleUserEntry(data: {
  name: string
  phone: string
}) {
  const parsed = phoneEntrySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, phone } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { phone },
    include: {
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  })

  if (existing) {
    const latestSession = existing.sessions[0]

    if (latestSession) {
      if (latestSession.completedAt) {
        return { error: "ဤဖုန်းနံပါတ်ဖြင့် ဖြေဆိုပြီးပါပြီ။" }
      }

      const now = new Date()
      if (now < latestSession.deadline) {
        return { user: existing }
      }
    }

    return { user: existing }
  }

  const user = await prisma.user.create({
    data: { name, phone },
  })

  return { user }
}
