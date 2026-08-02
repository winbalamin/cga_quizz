"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Trophy, Medal, Download } from "lucide-react"
import { getAdminResults, exportResultsCSV, exportDetailedResultsCSV } from "@/actions/results"
import { toast } from "sonner"

interface ResultEntry {
  rank: number
  name: string
  phone: string
  correctCount: number
  totalQuestions: number
  completedAt: string
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

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingDetailed, setIsExportingDetailed] = useState(false)

  const fetchResults = useCallback(async () => {
    setIsLoading(true)
    const data = await getAdminResults()
    setResults(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await exportResultsCSV()
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cga_quiz_results.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("CSV exported")
    } catch {
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDetailedExport = async () => {
    setIsExportingDetailed(true)
    try {
      const csv = await exportDetailedResultsCSV()
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cga_quiz_detailed_results.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Detailed CSV exported")
    } catch {
      toast.error("Export failed")
    } finally {
      setIsExportingDetailed(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Results</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport} disabled={isExporting || results.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Summary CSV"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDetailedExport}
            disabled={isExportingDetailed || results.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExportingDetailed ? "Exporting..." : "Export Detailed CSV"}
          </Button>
        </div>
      </div>

      <Card className="motion-fade-in-up motion-delay-1">
        <CardHeader>
          <CardTitle>All Results</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No completed quizzes yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right w-40">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((entry) => (
                  <TableRow key={`${entry.rank}-${entry.phone}`}>
                    <TableCell className="font-medium">
                      <RankIcon rank={entry.rank} />
                      {entry.rank}
                    </TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.phone}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {entry.correctCount}/{entry.totalQuestions}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(entry.completedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
