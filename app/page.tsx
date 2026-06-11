"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { handleUserEntry } from "@/actions/entry"
import { Trophy } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "" })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const result = await handleUserEntry({
      name: form.name,
      phone: form.phone,
    })

    if ("error" in result) {
      if (typeof result.error === "string") {
        toast.error(result.error)
      } else if (result.error) {
        setErrors(
          Object.fromEntries(
            Object.entries(result.error).map(([k, v]) => [k, v ?? []])
          )
        )
      }
      setIsSubmitting(false)
      return
    }

    toast.success("စတင်ပါမယ်!")
    router.push(
      `/quiz?userId=${result.user.id}&phone=${encodeURIComponent(result.user.phone)}`
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="text-center mb-8 sm:mb-12 motion-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image
            src="/CGA_Logo.png"
            alt="CGA Logo"
            width={48}
            height={48}
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">CGA Quiz</h1>
        </div>
        <p className="text-base sm:text-lg text-muted-foreground max-w-md">
          Test your knowledge across multiple domains with our interactive quiz
          platform.
        </p>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger
          render={
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 motion-fade-in-up motion-delay-2 motion-press">
              Start Quiz
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register to Start</DialogTitle>
            <DialogDescription>
              Enter your name and phone number to begin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="U Hla"
              />
              {errors.name?.map((e) => (
                <p key={e} className="text-sm text-destructive">{e}</p>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="09xxxxxxxxx"
                inputMode="numeric"
                pattern="(09[0-9]{7})|(09[0-9]{9})"
              />
              {errors.phone?.map((e) => (
                <p key={e} className="text-sm text-destructive">{e}</p>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Starting..." : "Begin Quiz"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-4 motion-fade-in-up motion-delay-3">
        <Link
          href="/leaderboard"
          className={buttonVariants({ variant: "outline", size: "lg" }) + " motion-press"}
        >
          <Trophy className="mr-2 h-5 w-5" />
          Leaderboard
        </Link>
      </div>
    </div>
  )
}
