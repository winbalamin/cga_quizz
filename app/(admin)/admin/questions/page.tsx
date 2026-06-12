import Link from "next/link"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getQuestions, deleteQuestion, deleteAllQuestions } from "@/actions/question"
import { cn } from "@/lib/utils"
import { CSVImportDialog } from "@/components/CSVImportDialog"

const typeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  MULTIPLE_CHOICE: "default",
  CHECKBOX: "secondary",
  TRUE_FALSE: "outline",
  SHORT_TEXT: "default",
  LONG_TEXT: "secondary",
}

export default async function AdminQuestionsPage() {
  const questions = await getQuestions()

  return (
    <div className="motion-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Questions</h1>
        <div className="flex items-center gap-2">
          {questions.length > 0 && <DeleteAllButton />}
          <CSVImportDialog />
          <Link
            href="/admin/questions/new"
            className={cn(buttonVariants(), "inline-flex items-center gap-1.5")}
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Link>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-muted-foreground">
          No questions yet. Create your first question!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.order}</TableCell>
                <TableCell className="max-w-md truncate">{q.text}</TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant[q.type] ?? "default"}>
                    {q.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" })
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteQuestionButton id={q.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  )
}

function DeleteQuestionButton({ id }: { id: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Question</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form
            action={async () => {
              "use server"
              await deleteQuestion(id)
            }}
          >
            <AlertDialogAction type="submit">Delete</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteAllButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Questions</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete ALL questions, choices, and responses. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form
            action={async () => {
              "use server"
              await deleteAllQuestions()
            }}
          >
            <AlertDialogAction type="submit">Delete All</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
