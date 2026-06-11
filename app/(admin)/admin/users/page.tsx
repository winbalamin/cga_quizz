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
import { Trash2, RotateCcw } from "lucide-react"
import { getUsers, deleteUser, resetUserSession } from "@/actions/user"

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      {users.length === 0 ? (
        <p className="text-muted-foreground">No users registered yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const lastSession = user.sessions[0]
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone ?? "-"}</TableCell>
                  <TableCell>{user.institution ?? "-"}</TableCell>
                  <TableCell>
                    {lastSession ? (
                      lastSession.completedAt ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )
                    ) : (
                      <Badge variant="outline">Not Started</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <ResetSessionButton userId={user.id} />
                      <DeleteUserButton userId={user.id} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function DeleteUserButton({ userId }: { userId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the user and all their quiz data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form
            action={async () => {
              "use server"
              await deleteUser(userId)
            }}
          >
            <AlertDialogAction type="submit">Delete</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ResetSessionButton({ userId }: { userId: string }) {
  return (
    <form
      action={async () => {
        "use server"
        await resetUserSession(userId)
      }}
    >
      <Button variant="ghost" size="icon" type="submit">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </form>
  )
}
