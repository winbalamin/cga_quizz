"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import { importQuestionsFromCSV, type ImportResult } from "@/actions/question"
import { cn } from "@/lib/utils"

interface ParsedRow {
  text: string
  type: string
  order: string
  choices: string
  correct: string
}

export function CSVImportZone({ onComplete }: { onComplete: () => void }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [validationErrors, setValidationErrors] = useState<
    { row: number; error: string }[]
  >([])
  const [step, setStep] = useState<"idle" | "parsed" | "importing" | "done">("idle")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }
    setFile(selectedFile)
    setValidationErrors([])
    setImportResult(null)

    Papa.parse<ParsedRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.filter(
          (r) => r.text || r.type
        )
        setRows(parsed)

        const errors: { row: number; error: string }[] = []
        parsed.forEach((row, i) => {
          const rowNum = i + 2
          if (!row.text?.trim()) {
            errors.push({ row: rowNum, error: "Missing question text" })
          }
          const validTypes = [
            "MULTIPLE_CHOICE",
            "CHECKBOX",
            "TRUE_FALSE",
            "SHORT_TEXT",
            "LONG_TEXT",
          ]
          const rawType = row.type?.trim().toUpperCase()
          if (!rawType || !validTypes.includes(rawType)) {
            errors.push({
              row: rowNum,
              error: `Invalid type: "${row.type || "(empty)"}"`,
            })
          }
          const orderNum = Number(row.order)
          if (isNaN(orderNum) || !Number.isInteger(orderNum)) {
            errors.push({
              row: rowNum,
              error: `Invalid order: "${row.order || "(empty)"}"`,
            })
          }
        })

        setValidationErrors(errors)
        setStep("parsed")
      },
      error: (err) => {
        toast.error(`Failed to parse CSV: ${err.message}`)
      },
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFile(droppedFile)
    },
    [handleFile]
  )

  const handleImport = async () => {
    setStep("importing")
    setImportProgress(0)

    const result = await importQuestionsFromCSV(rows)
    setImportProgress(100)
    setImportResult(result)
    setStep("done")

    if (result.failed.length === 0) {
      toast.success(`${result.success} questions imported successfully`)
    } else {
      toast.warning(
        `${result.success} imported, ${result.failed.length} failed`
      )
    }

    router.refresh()
    onComplete()
  }

  const reset = () => {
    setFile(null)
    setRows([])
    setValidationErrors([])
    setImportResult(null)
    setStep("idle")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const typeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
    MULTIPLE_CHOICE: "default",
    CHECKBOX: "secondary",
    TRUE_FALSE: "outline",
    SHORT_TEXT: "default",
    LONG_TEXT: "secondary",
  }

  const handleDownloadTemplate = () => {
    const headers = ["text", "type", "order", "choices", "correct"]

    const rows = [
      [
        "What is the capital of France?",
        "MULTIPLE_CHOICE",
        "1",
        "Paris|London|Berlin|Rome",
        "0",
      ],
      [
        "Which of the following are web technologies? (Select all that apply)",
        "CHECKBOX",
        "2",
        "HTML|CSS|Docker|JavaScript",
        "0,1,3",
      ],
      [
        "The Earth is flat.",
        "TRUE_FALSE",
        "3",
        "True|False",
        "1",
      ],
    ]

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csvLines = [
      headers.map(escape).join(","),
      ...rows.map((row) => row.map(escape).join(",")),
    ]

    const bom = "\uFEFF"
    const csvContent = bom + csvLines.join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "quiz_questions_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {step === "idle" && (
        <div className="space-y-3">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag a CSV file here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              .csv files only
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </div>
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadTemplate()
              }}
            >
              <Download className="mr-1 h-3 w-3" />
              Download sample template
            </Button>
          </div>
        </div>
      )}

      {step === "parsed" && (
        <>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file?.name}</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} rows parsed
                {validationErrors.length > 0 &&
                  ` · ${validationErrors.length} rows with errors`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              Change
            </Button>
          </div>

          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                <AlertCircle className="h-4 w-4" />
                Validation Issues
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {validationErrors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    Row {e.row}: {e.error}
                  </p>
                ))}
                {validationErrors.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    ...and {validationErrors.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-auto rounded-lg border">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Choices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 10).map((row, i) => (
                  <TableRow
                    key={i}
                    className={
                      validationErrors.some((e) => e.row === i + 2)
                        ? "bg-destructive/5"
                        : undefined
                    }
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {row.text}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          typeBadgeVariant[row.type?.trim().toUpperCase()] ??
                          "default"
                        }
                        className="text-xs"
                      >
                        {row.type?.replace("_", " ") || "?"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {row.choices || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={rows.length === 0}
            >
              Import {rows.length} Question{rows.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </>
      )}

      {step === "importing" && (
        <div className="flex flex-col items-center py-8 gap-4">
          <Progress value={importProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Importing {rows.length} questions...
          </p>
        </div>
      )}

      {step === "done" && importResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium">
                {importResult.success} question
                {importResult.success !== 1 ? "s" : ""} imported
              </p>
              {importResult.failed.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {importResult.failed.length} failed
                </p>
              )}
            </div>
          </div>

          {importResult.failed.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                <XCircle className="h-4 w-4" />
                Failed Rows
              </div>
              {importResult.failed.map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  Row {f.row}: {f.error}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>
              Import Another
            </Button>
            <Button onClick={onComplete}>Close</Button>
          </div>
        </div>
      )}
    </div>
  )
}
