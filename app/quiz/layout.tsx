"use client"

import { useAntiCheat } from "@/hooks/useAntiCheat"

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAntiCheat()

  return (
    <div className="min-h-screen bg-background select-none">
      <main className="mx-auto max-w-2xl p-4">{children}</main>
    </div>
  )
}
