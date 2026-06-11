import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
})

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@cga-quiz.com" },
    update: {},
    create: {
      email: "admin@cga-quiz.com",
      password: hashedPassword,
      name: "Admin",
    },
  })

  console.log("Seeded admin user:", admin.email)

  const questions = [
    {
      text: "What does CPU stand for?",
      type: "MULTIPLE_CHOICE" as const,
      order: 0,
      choices: [
        { text: "Central Processing Unit", isCorrect: true },
        { text: "Central Program Utility", isCorrect: false },
        { text: "Computer Personal Unit", isCorrect: false },
        { text: "Central Processor Unit", isCorrect: false },
      ],
    },
    {
      text: "HTML is a programming language.",
      type: "TRUE_FALSE" as const,
      order: 1,
      choices: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true },
      ],
    },
    {
      text: "Which of the following are JavaScript frameworks? (Select all that apply)",
      type: "CHECKBOX" as const,
      order: 2,
      choices: [
        { text: "React", isCorrect: true },
        { text: "Vue", isCorrect: true },
        { text: "Django", isCorrect: false },
        { text: "Angular", isCorrect: true },
      ],
    },
    {
      text: "What does CSS stand for?",
      type: "SHORT_TEXT" as const,
      order: 3,
      choices: [
        { text: "Cascading Style Sheets", isCorrect: true },
      ],
    },
    {
      text: "Explain the difference between SQL and NoSQL databases.",
      type: "LONG_TEXT" as const,
      order: 4,
      choices: [],
    },
  ]

  for (const q of questions) {
    const { choices, ...questionData } = q
    await prisma.question.upsert({
      where: { id: `seed-${q.order}` },
      update: {
        text: questionData.text,
        type: questionData.type,
        order: questionData.order,
        choices: {
          deleteMany: {},
          create: choices,
        },
      },
      create: {
        id: `seed-${q.order}`,
        ...questionData,
        choices: {
          create: choices,
        },
      },
    })
  }

  console.log("Seeded questions:", questions.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
