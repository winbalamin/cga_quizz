"use server"

import { prisma } from "@/lib/prisma"

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above|prior|earlier)\s+(instructions?|prompts?|text)/gi,
  /disregard\s+(previous|all|above|prior|earlier)\s+(instructions?|prompts?|text)/gi,
  /bypass\s+(previous|all|above|prior|earlier)\s+(instructions?|prompts?|text)/gi,
  /override\s+(previous|all|above|prior|earlier)\s+(instructions?|prompts?|text)/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /act\s+as\s+(if|a|an)/gi,
  /do\s+not\s+(follow|obey)\s+(previous|prior|above)\s+(instructions?|prompts?)/gi,
  /forget\s+(all|previous|prior|above)\s+(instructions?|prompts?|text)/gi,
  /system\s*:\s*(new|updated?)\s+(prompts?|instructions?)/gi,
  /you\s+are\s+now\s+(a|an|the)/gi,
]

function sanitizeInjection(text: string): string {
  let sanitized = text
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[redacted]")
  }
  return sanitized
}

export async function saveResponse(
  sessionId: string,
  questionId: string,
  answer: string
) {
  const sanitized = sanitizeInjection(answer)
  return prisma.response.upsert({
    where: {
      sessionId_questionId: { sessionId, questionId },
    },
    update: { answer: sanitized },
    create: { sessionId, questionId, answer: sanitized },
  })
}

export async function submitQuiz(sessionId: string) {
  const now = new Date()
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { completedAt: now },
  })
}

export async function getResponsesForSession(sessionId: string) {
  return prisma.response.findMany({
    where: { sessionId },
    include: { question: { include: { choices: true } } },
  })
}
