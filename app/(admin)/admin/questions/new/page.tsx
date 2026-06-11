"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { DynamicQuestionForm } from "@/components/DynamicQuestionForm"
import { createQuestion } from "@/actions/question"
import { toast } from "sonner"
import type { QuestionInput } from "@/lib/validations"

export default function NewQuestionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: QuestionInput) => {
    setIsSubmitting(true)
    try {
      await createQuestion({
        text: data.text,
        type: data.type,
        order: data.order,
        choices: data.choices ?? [],
      })
      toast.success("Question created")
      router.push("/admin/questions")
    } catch {
      toast.error("Failed to create question")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Question</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Create a new quiz question. Select the type and provide answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicQuestionForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
