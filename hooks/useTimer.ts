"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { validateTimer } from "@/actions/session"
import { formatTime } from "@/lib/utils"

export function useTimer(sessionId: string) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const expiredRef = useRef(false)
  const sessionRef = useRef(sessionId)

  const syncDeadline = useCallback(async () => {
    if (!sessionRef.current) {
      setIsLoading(false)
      return
    }

    try {
      const result = await validateTimer(sessionRef.current)
      if (result.expired) {
        if (!expiredRef.current) {
          expiredRef.current = true
          setIsExpired(true)
          setTimeLeft(0)
        }
        return
      }
      const remaining = result.deadline.getTime() - Date.now()
      setTimeLeft(Math.max(0, remaining))
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    sessionRef.current = sessionId
    expiredRef.current = false
    setIsExpired(false)
    setTimeLeft(null)
    setIsLoading(true)

    if (!sessionId) {
      setIsLoading(false)
      return
    }

    syncDeadline()
    const syncInterval = setInterval(syncDeadline, 30000)
    return () => clearInterval(syncInterval)
  }, [sessionId, syncDeadline])

  useEffect(() => {
    if (timeLeft === null || isExpired) return

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
  }, [timeLeft, isExpired])

  return {
    timeLeft,
    isExpired,
    isLoading,
    formatted: timeLeft !== null ? formatTime(timeLeft) : "--:--",
  }
}
