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
import { getUsers, deleteUser, resetUserSession, deleteAllUsers } from "@/actions/user"

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        {users.length > 0 && <DeleteAllButton />}
      </div>

      {users.length === 0 ? (
        <p className="text-muted-foreground">No users registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
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
        </div>
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

function DeleteAllButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Users
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Users</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete ALL users, their quiz sessions, and all responses. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form
            action={async () => {
              "use server"
              await deleteAllUsers()
            }}
          >
            <AlertDialogAction type="submit">
              Delete All
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
