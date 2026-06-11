import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { ListChecks, Users, PlayCircle, Trophy } from "lucide-react"
import { ExamControl } from "@/components/ExamControl"

async function getStats() {
  try {
    const [questionCount, userCount, sessionCount, completedCount] =
      await Promise.all([
        prisma.question.count(),
        prisma.user.count(),
        prisma.quizSession.count(),
        prisma.quizSession.count({ where: { completedAt: { not: null } } }),
      ])
    return { questionCount, userCount, sessionCount, completedCount }
  } catch {
    return {
      questionCount: 0,
      userCount: 0,
      sessionCount: 0,
      completedCount: 0,
    }
  }
}

export default async function AdminDashboardPage() {
  const { questionCount, userCount, sessionCount, completedCount } =
    await getStats()

  const stats = [
    {
      title: "Total Questions",
      value: questionCount,
      icon: ListChecks,
    },
    {
      title: "Registered Users",
      value: userCount,
      icon: Users,
    },
    {
      title: "Quiz Attempts",
      value: sessionCount,
      icon: PlayCircle,
    },
    {
      title: "Completed",
      value: completedCount,
      icon: Trophy,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ExamControl />
    </div>
  )
}
