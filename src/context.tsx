import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { StudyMindClient } from './api'
import type { StudyMindConfig, CourseData, UserRole, Message, Complexity, SavedSummary } from './types'

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
  // AI Tutor conversation — held here (not in TutorTab) so it survives tab switches,
  // including a reply that arrives while another tab is open
  messages:      Message[]
  setMessages:   React.Dispatch<React.SetStateAction<Message[]>>
  sessionId:     string | undefined
  setSessionId:  React.Dispatch<React.SetStateAction<string | undefined>>
  sending:       boolean
  setSending:    React.Dispatch<React.SetStateAction<boolean>>
  complexity:    Complexity
  setComplexity: React.Dispatch<React.SetStateAction<Complexity>>
  // Section/lecture scope for Quiz, Flashcards and Summary ('' = all content) — shared so
  // picking it once applies to all three
  topic:         string
  setTopic:      React.Dispatch<React.SetStateAction<string>>
  // Latest summary — held here so it survives tab switches, and restored from the
  // server once the course is ready (survives reloads and new logins)
  summary:       SavedSummary | null
  setSummary:    React.Dispatch<React.SetStateAction<SavedSummary | null>>
}

const StudyMindContext = createContext<StudyMindContextValue | null>(null)

export function useStudyMind() {
  const ctx = useContext(StudyMindContext)
  if (!ctx) throw new Error('useStudyMind must be used inside StudyMindPanel or StudyMindProvider')
  return ctx
}

interface ProviderProps {
  courseId:      string
  userId:        string
  userRole:      UserRole
  courseData:    CourseData
  /** Preferred: `st_` token minted server-side via POST /api/v1/auth/session. */
  sessionToken?: string
  /** Dev fallback: API key used directly from the browser. */
  config?:       StudyMindConfig
  apiUrl?:       string
  onReady?:   () => void
  onError?:   (error: Error) => void
  children:   React.ReactNode
}

export function StudyMindProvider({
  courseId, userId, userRole, courseData,
  sessionToken, config, apiUrl, onReady, onError, children,
}: ProviderProps) {
  const [isReady,   setIsReady]   = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const [messages,   setMessages]   = useState<Message[]>([])
  const [sessionId,  setSessionId]  = useState<string | undefined>()
  const [sending,    setSending]    = useState(false)
  const [complexity, setComplexity] = useState<Complexity>('normal')
  const [topic,      setTopic]      = useState('')
  const [summary,    setSummary]    = useState<SavedSummary | null>(null)

  // A different course or user starts a fresh conversation
  useEffect(() => {
    setMessages([])
    setSessionId(undefined)
    setSending(false)
    setTopic('')
    setSummary(null)
  }, [courseId, userId])

  const apiKey     = config?.apiKey ?? ''
  const baseUrl    = apiUrl ?? config?.apiUrl
  const credential = sessionToken || apiKey

  const client = useMemo(() => {
    const c = new StudyMindClient(sessionToken ? '' : apiKey, baseUrl)
    if (sessionToken) c.setSessionToken(sessionToken)
    return c
  }, [sessionToken, apiKey, baseUrl])

  useEffect(() => {
    if (!sessionToken && apiKey) {
      console.warn(
        '[@studymind/react] Using an API key in the browser exposes it to every visitor. ' +
        'Mint a short-lived sessionToken on your server via POST /api/v1/auth/session instead.',
      )
    }
  }, [sessionToken, apiKey])

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

      if (!credential) {
        return fail(new Error('Missing StudyMind sessionToken (or API key for development)'))
      }

      try {
        const status = await client.getCourseStatus(courseId, userId)
        if (status.status === 'ready') return ready()

        // A session token may ingest its own course only (enforced server-side)
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
  }, [client, courseId, userId, credential])

  // Once the course is ready, restore the saved conversation (survives reloads and new logins).
  // Never overwrites a conversation the user has already started in the meantime.
  useEffect(() => {
    if (!isReady) return
    let cancelled = false
    client.getChatHistory(courseId, userId)
      .then(history => {
        if (cancelled || history.messages.length === 0) return
        setMessages(prev => prev.length > 0 ? prev : history.messages.map(m => ({
          id:        m.id,
          role:      m.role,
          content:   m.content,
          sources:   m.sources,
          timestamp: new Date(m.timestamp),
        })))
        if (history.session_id) setSessionId(prev => prev ?? history.session_id ?? undefined)
      })
      .catch(() => { /* history is best-effort — start a fresh conversation */ })
    return () => { cancelled = true }
  }, [isReady, client, courseId, userId])

  // Restore the most recent saved summary. Never replaces one generated in the meantime,
  // and doesn't touch the shared topic/complexity selectors — the summary carries its own.
  useEffect(() => {
    if (!isReady) return
    let cancelled = false
    client.getSummary(courseId, userId)
      .then(saved => { if (!cancelled && saved) setSummary(prev => prev ?? saved) })
      .catch(() => { /* best-effort — the user can generate a new one */ })
    return () => { cancelled = true }
  }, [isReady, client, courseId, userId])

  const value = useMemo(() => ({
    client, courseId, userId, userRole, courseData, isReady, isLoading, error,
    messages, setMessages, sessionId, setSessionId, sending, setSending, complexity, setComplexity,
    topic, setTopic, summary, setSummary,
  }), [client, courseId, userId, userRole, courseData, isReady, isLoading, error,
      messages, sessionId, sending, complexity, topic, summary])

  return (
    <StudyMindContext.Provider value={value}>
      {children}
    </StudyMindContext.Provider>
  )
}
