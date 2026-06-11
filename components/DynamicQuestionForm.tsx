"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus } from "lucide-react"
import type { QuestionInput } from "@/lib/validations"

type QuestionType = QuestionInput["type"]

interface Choice {
  id?: string
  text: string
  isCorrect: boolean
}

interface DynamicQuestionFormProps {
  defaultValues?: Partial<QuestionInput>
  onSubmit: (data: QuestionInput) => Promise<void>
  isSubmitting: boolean
}

const inputClasses =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 flex-1"

export function DynamicQuestionForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: DynamicQuestionFormProps) {
  const [type, setType] = useState<QuestionType>(
    defaultValues?.type ?? "MULTIPLE_CHOICE"
  )
  const [text, setText] = useState(defaultValues?.text ?? "")
  const [order, setOrder] = useState(defaultValues?.order ?? 0)
  const [choices, setChoices] = useState<Choice[]>(
    defaultValues?.choices?.length
      ? defaultValues.choices
      : [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]
  )

  const needsChoices =
    type === "MULTIPLE_CHOICE" ||
    type === "CHECKBOX" ||
    type === "TRUE_FALSE"

  const isRadioType = type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE"

  const correctIndex = choices.findIndex((c) => c.isCorrect)

  const addChoice = () => {
    setChoices([...choices, { text: "", isCorrect: false }])
  }

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index))
  }

  const updateChoice = (index: number, text: string) => {
    setChoices((prev) =>
      prev.map((c, i) => (i === index ? { ...c, text } : c))
    )
  }

  const setCorrectChoice = (index: number) => {
    setChoices((prev) =>
      prev.map((c, i) => ({ ...c, isCorrect: i === index }))
    )
  }

  const toggleCheckboxChoice = (index: number) => {
    setChoices((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, isCorrect: !c.isCorrect } : c
      )
    )
  }

  const handleTypeChange = (v: string | null) => {
    if (!v) return
    setType(v as QuestionType)
    if (v === "TRUE_FALSE") {
      setChoices([
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: false },
      ])
    } else if (v === "MULTIPLE_CHOICE") {
      setChoices([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ])
    } else if (v === "CHECKBOX") {
      setChoices([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ])
    } else {
      setChoices([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      text,
      type,
      order,
      choices: needsChoices ? choices : [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="type">Question Type</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
            <SelectItem value="CHECKBOX">Checkbox</SelectItem>
            <SelectItem value="TRUE_FALSE">True / False</SelectItem>
            <SelectItem value="SHORT_TEXT">Short Text</SelectItem>
            <SelectItem value="LONG_TEXT">Long Text</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Question Text</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the question"
          required
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Display Order</Label>
        <Input
          id="order"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          min={0}
        />
      </div>

      {needsChoices && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Answer Choices</Label>
            {(type === "MULTIPLE_CHOICE" || type === "CHECKBOX") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChoice}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Choice
              </Button>
            )}
          </div>

          {isRadioType ? (
            <RadioGroup
              value={correctIndex >= 0 ? String(correctIndex) : ""}
              onValueChange={(v) => setCorrectChoice(Number(v))}
              className="space-y-2 !grid-cols-1"
            >
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <RadioGroupItem
                    value={String(index)}
                    id={`choice-${index}`}
                  />
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) =>
                      updateChoice(index, e.target.value)
                    }
                    placeholder={`Choice ${index + 1}`}
                    disabled={type === "TRUE_FALSE"}
                    className={inputClasses}
                  />
                  {type === "MULTIPLE_CHOICE" && choices.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeChoice(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Checkbox
                    checked={choice.isCorrect}
                    onCheckedChange={() => toggleCheckboxChoice(index)}
                    id={`choice-${index}`}
                  />
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) =>
                      updateChoice(index, e.target.value)
                    }
                    placeholder={`Choice ${index + 1}`}
                    className={inputClasses}
                  />
                  {choices.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeChoice(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Question"}
      </Button>
    </form>
  )
}
