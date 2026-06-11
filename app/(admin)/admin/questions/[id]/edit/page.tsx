"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DynamicQuestionForm } from "@/components/DynamicQuestionForm"
import { getQuestion, updateQuestion } from "@/actions/question"
import { toast } from "sonner"
import type { QuestionInput } from "@/lib/validations"

export default function EditQuestionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [question, setQuestion] = useState<Awaited<
    ReturnType<typeof getQuestion>
  > | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getQuestion(params.id).then((q) => {
      setQuestion(q)
      setIsLoading(false)
    })
  }, [params.id])

  const handleSubmit = async (data: QuestionInput) => {
    setIsSubmitting(true)
    try {
      await updateQuestion(params.id, {
        text: data.text,
        type: data.type,
        order: data.order,
        choices: data.choices ?? [],
      })
      toast.success("Question updated")
      router.push("/admin/questions")
    } catch {
      toast.error("Failed to update question")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Edit Question</h1>
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!question) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Edit Question</h1>
        <p className="text-muted-foreground">Question not found.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Question</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Edit the quiz question.</CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicQuestionForm
            defaultValues={{
              text: question.text,
              type: question.type as QuestionInput["type"],
              order: question.order,
              choices: question.choices,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
