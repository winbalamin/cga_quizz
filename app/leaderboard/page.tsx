"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { getLeaderboard } from "@/actions/leaderboard"
import { Trophy, Medal, ArrowLeft } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  name: string
  phone: string
  correctCount: number
  totalQuestions: number
  completedAt: string
  completedAtFormatted: string
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1)
    return <Trophy className="h-5 w-5 text-amber-500 inline mr-1" />
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-400 inline mr-1" />
  if (rank === 3)
    return <Medal className="h-5 w-5 text-amber-700 inline mr-1" />
  return null
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [data, setData] = useState<{
    entries: LeaderboardEntry[]
    total: number
    page: number
    totalPages: number
  } | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchData = useCallback(
    async (showSkeleton = false) => {
      if (showSkeleton) setIsLoading(true)
      else setIsRefetching(true)

      const result = await getLeaderboard(page)
      setData(result)
      setIsLoading(false)
      setIsRefetching(false)
    },
    [page]
  )

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-3xl py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Leaderboard
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-green-600 align-middle">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                LIVE
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Top performers ranked by score
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>

        <Card className="motion-fade-in-up motion-delay-2">
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data || data.entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No completed quizzes yet. Be the first!
              </p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right w-40">Completed (MMT)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.entries.map((entry) => (
                      <TableRow key={`${entry.rank}-${entry.name}`}>
                        <TableCell className="font-medium">
                          <RankIcon rank={entry.rank} />
                          {entry.rank}
                        </TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {entry.phone}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {entry.correctCount}/{entry.totalQuestions}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {entry.completedAtFormatted}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
