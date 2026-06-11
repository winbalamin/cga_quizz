import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LayoutDashboard, ListChecks, Users, Trophy, LogOut } from "lucide-react"
import { auth, signOut } from "@/lib/auth"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Questions", icon: ListChecks },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/results", label: "Results", icon: Trophy },
]

const linkClasses = cn(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-sm font-medium",
  "hover:bg-muted hover:text-foreground",
  "w-full justify-start"
)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Not authorized. Please sign in.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-sidebar p-4 flex flex-col">
        <div className="font-bold text-lg mb-6 px-3">CGA Quiz Admin</div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClasses}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator className="my-4" />
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/admin/login" })
          }}
        >
          <Button variant="ghost" className="w-full justify-start" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
