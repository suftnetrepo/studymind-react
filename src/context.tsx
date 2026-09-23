import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { StudyMindClient } from './api'
import type { StudyMindConfig, CourseData, UserRole } from './types'

const POLL_INTERVAL_MS  = 2000
const MAX_POLL_ATTEMPTS = 30  // ~60s

interface StudyMindContextValue {
  client:     StudyMindClient
  courseId:   string
  userId:     string
  userRole:   UserRole
  courseData: CourseData
  isReady:    boolean
  isLoading:  boolean
  error:      string | null
}

const StudyMindContext = createContext<StudyMindContextValue | null>(null)

export function useStudyMind() {
  const ctx = useContext(StudyMindContext)
  if (!ctx) throw new Error('useStudyMind must be used inside StudyMindPanel or StudyMindProvider')
  return ctx
}

interface ProviderProps {
  courseId:   string
  userId:     string
  userRole:   UserRole
  courseData: CourseData
  config:     StudyMindConfig
  onReady?:   () => void
  onError?:   (error: Error) => void
  children:   React.ReactNode
}

export function StudyMindProvider({
  courseId, userId, userRole, courseData,
  config, onReady, onError, children,
}: ProviderProps) {
  const [isReady,   setIsReady]   = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const client = useMemo(
    () => new StudyMindClient(config.apiKey, config.apiUrl),
    [config.apiKey, config.apiUrl],
  )

  // Latest props via refs so inline callbacks / courseData objects don't re-trigger indexing
  const latest = useRef({ userRole, courseData, onReady, onError })
  latest.current = { userRole, courseData, onReady, onError }

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const ready = () => {
      if (cancelled) return
      setIsReady(true)
      setIsLoading(false)
      latest.current.onReady?.()
    }

    const fail = (err: Error) => {
      if (cancelled) return
      setError(err.message)
      setIsLoading(false)
      latest.current.onError?.(err)
    }

    async function poll(attempt: number) {
      if (cancelled) return
      try {
        const s = await client.getCourseStatus(courseId, userId)
        if (s.status === 'ready') return ready()
        if (s.status === 'failed') return fail(new Error(s.error || 'Failed to index course content'))
      } catch { /* transient — keep polling */ }
      if (attempt >= MAX_POLL_ATTEMPTS) return fail(new Error('Timed out indexing course content'))
      timer = setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS)
    }

    async function initCourse() {
      setIsReady(false)
      setIsLoading(true)
      setError(null)

      if (!config.apiKey) {
        return fail(new Error('Missing StudyMind API key'))
      }

      try {
        const status = await client.getCourseStatus(courseId, userId)
        if (status.status === 'ready') return ready()

        if (status.status !== 'indexing') {
          const { userRole, courseData } = latest.current
          await client.ingestCourse(courseId, userId, userRole, courseData)
        }
        timer = setTimeout(() => poll(1), POLL_INTERVAL_MS)
      } catch (e: unknown) {
        fail(e instanceof Error ? e : new Error('Failed to connect'))
      }
    }

    initCourse()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [client, courseId, userId, config.apiKey])

  const value = useMemo(() => ({
    client, courseId, userId, userRole, courseData, isReady, isLoading, error,
  }), [client, courseId, userId, userRole, courseData, isReady, isLoading, error])

  return (
    <StudyMindContext.Provider value={value}>
      {children}
    </StudyMindContext.Provider>
  )
}
