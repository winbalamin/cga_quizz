"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Trophy,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Questions", icon: ListChecks },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/results", label: "Results", icon: Trophy },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent transition-transform duration-100 active:scale-95 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 motion-fade-in lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex w-64 flex-col border-r bg-sidebar p-4",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6 px-3">
          <span className="font-bold text-lg">CGA Quiz Admin</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-sm font-medium",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "w-full justify-start",
                pathname === item.href &&
                  "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator className="my-4" />
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ redirectTo: "/admin/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </aside>
    </>
  )
}
