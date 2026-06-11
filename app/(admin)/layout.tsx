import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/AdminSidebar"

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
      <AdminSidebar />
      <main className="flex-1 p-4 pt-16 lg:p-8 lg:pt-8 min-w-0">{children}</main>
    </div>
  )
}
