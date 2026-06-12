import { z } from "zod"

export const phoneEntrySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^09\d{7,9}$/, "Phone must be 9, 10, or 11 digits starting with 09"),
})

export type PhoneEntryInput = z.infer<typeof phoneEntrySchema>

export const choiceSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Choice text is required"),
  isCorrect: z.boolean().default(false),
})

export const questionSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().min(2, "Question text is required"),
    type: z.enum([
      "MULTIPLE_CHOICE",
      "CHECKBOX",
      "TRUE_FALSE",
      "SHORT_TEXT",
      "LONG_TEXT",
    ]),
    order: z.number().int().default(0),
    choices: z.array(choiceSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "MULTIPLE_CHOICE" ||
      data.type === "CHECKBOX" ||
      data.type === "TRUE_FALSE"
    ) {
      if (!data.choices || data.choices.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 2 choices are required",
          path: ["choices"],
        })
      }
      const correctCount =
        data.choices?.filter(
          (c: { isCorrect: boolean }) => c.isCorrect
        ).length ?? 0
      if (data.type === "MULTIPLE_CHOICE" && correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Exactly one correct choice is required",
          path: ["choices"],
        })
      }
      if (data.type === "CHECKBOX" && correctCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one correct choice is required",
          path: ["choices"],
        })
      }
    }
    if (data.type === "TRUE_FALSE") {
      const hasTrue =
        data.choices?.some(
          (c: { isCorrect: boolean; text: string }) =>
            c.isCorrect && c.text.toLowerCase() === "true"
        ) ?? false
      const hasFalse =
        data.choices?.some(
          (c: { isCorrect: boolean; text: string }) =>
            c.isCorrect && c.text.toLowerCase() === "false"
        ) ?? false
      if (!hasTrue && !hasFalse) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mark True or False as correct",
          path: ["choices"],
        })
      }
    }
  })

export type QuestionInput = z.infer<typeof questionSchema>

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

export const csvRowSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "CHECKBOX",
    "TRUE_FALSE",
    "SHORT_TEXT",
    "LONG_TEXT",
  ]),
  order: z.string().refine((v) => !isNaN(Number(v)) && Number.isInteger(Number(v)), {
    message: "Order must be an integer",
  }),
  choices: z.string().optional(),
  correct: z.string().optional(),
})

export type CSVRow = z.infer<typeof csvRowSchema>
