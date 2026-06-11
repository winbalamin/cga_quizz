"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getExamStatus } from "@/actions/exam"
import { formatTime } from "@/lib/utils"

export function useExamTimer() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [examStatus, setExamStatus] = useState<
    "idle" | "active" | "ended"
  >("idle")
  const expiredRef = useRef(false)

  const syncStatus = useCallback(async () => {
    try {
      const result = await getExamStatus()
      setExamStatus(result.status)

      if (result.status === "ended") {
        if (!expiredRef.current) {
          expiredRef.current = true
          setIsExpired(true)
          setTimeLeft(0)
        }
        return
      }

      if (result.status === "active" && result.deadline) {
        const remaining = result.deadline.getTime() - Date.now()
        if (remaining <= 0) {
          if (!expiredRef.current) {
            expiredRef.current = true
            setIsExpired(true)
            setTimeLeft(0)
          }
          return
        }
        setTimeLeft(Math.max(0, remaining))
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    syncStatus()
    const interval = setInterval(syncStatus, 5000)
    return () => clearInterval(interval)
  }, [syncStatus])

  useEffect(() => {
    if (timeLeft === null || isExpired || examStatus !== "active") return

    if (timeLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        setIsExpired(true)
        setTimeLeft(0)
      }
      return
    }

    const tick = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1000) {
          clearInterval(tick)
          if (!expiredRef.current) {
            expiredRef.current = true
            setIsExpired(true)
          }
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [timeLeft, isExpired, examStatus])

  return {
    timeLeft,
    isExpired,
    isLoading,
    examStatus,
    formatted: timeLeft !== null ? formatTime(timeLeft) : "--:--",
  }
}
