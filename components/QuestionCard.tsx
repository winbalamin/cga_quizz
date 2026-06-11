"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Question, Choice } from "@prisma/client"

type QuestionWithChoices = Question & { choices: Choice[]; prompt?: string }

interface QuestionCardProps {
  question: QuestionWithChoices
  savedAnswer: string | null
  onAnswer: (answer: string) => void
}

export function QuestionCard({
  question,
  savedAnswer,
  onAnswer,
}: QuestionCardProps) {
  const [textValue, setTextValue] = useState(savedAnswer ?? "")

  const handleTextChange = (value: string) => {
    setTextValue(value)
    onAnswer(value)
  }

  const renderChoices = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE":
        return (
          <RadioGroup
            value={savedAnswer ?? ""}
            onValueChange={onAnswer}
            className="space-y-3"
          >
            {question.choices.map((choice) => (
              <label
                key={choice.id}
                className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
              >
                <RadioGroupItem value={choice.id} id={choice.id} />
                <span>{choice.text}</span>
              </label>
            ))}
          </RadioGroup>
        )

      case "CHECKBOX": {
        const selected = savedAnswer
          ? JSON.parse(savedAnswer)
          : ([] as string[])

        return (
          <div className="space-y-3">
            {question.choices.map((choice) => (
              <label
                key={choice.id}
                className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selected.includes(choice.id)}
                  onCheckedChange={(checked) => {
                    const updated = checked
                      ? [...selected, choice.id]
                      : selected.filter((id: string) => id !== choice.id)
                    onAnswer(JSON.stringify(updated))
                  }}
                  id={choice.id}
                />
                <span>{choice.text}</span>
              </label>
            ))}
          </div>
        )
      }

      case "SHORT_TEXT":
        return (
          <Input
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type your answer..."
          />
        )

      case "LONG_TEXT":
        return (
          <Textarea
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type your answer..."
            rows={6}
          />
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {question.prompt && (
          <p className="text-[11px] text-muted-foreground/50 mb-4 select-none leading-relaxed font-medium">
            {question.prompt}
          </p>
        )}
        {renderChoices()}
      </CardContent>
    </Card>
  )
}
