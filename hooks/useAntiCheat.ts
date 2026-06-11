"use client"

import { useEffect } from "react"

export function useAntiCheat() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault()

    const blockKeyboard = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "u", "s", "p", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault()
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault()
      }
      if (e.key === "PrintScreen") {
        e.preventDefault()
      }
    }

    document.addEventListener("contextmenu", block)
    document.addEventListener("dragstart", block)
    document.addEventListener("copy", block)
    document.addEventListener("cut", block)
    document.addEventListener("selectstart", block)
    document.addEventListener("keydown", blockKeyboard)

    return () => {
      document.removeEventListener("contextmenu", block)
      document.removeEventListener("dragstart", block)
      document.removeEventListener("copy", block)
      document.removeEventListener("cut", block)
      document.removeEventListener("selectstart", block)
      document.removeEventListener("keydown", blockKeyboard)
    }
  }, [])
}
