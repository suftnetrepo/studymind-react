import type { CourseData, Complexity, QuizQuestion, Flashcard, SavedSummary } from './types'

const DEFAULT_API_URL = 'https://api.aismartlearner.com'

export interface CourseStatus {
  status:      'not_found' | 'pending' | 'indexing' | 'ready' | 'failed'
  module_id?:  string | null
  chunk_count?: number
  indexed_at?: string | null
  error?:      string | null
}

export type DocumentStatus = 'pending' | 'indexing' | 'ready' | 'failed'

export interface CourseDocument {
  id:          string
  filename:    string
  status:      DocumentStatus
  chunk_count: number
  size:        number
  format:      string | null
  url:         string
  uploaded_by: string | null
  indexed_at:  string | null
  error:       string | null
  created_at:  string | null
}

export interface ChatHistory {
  session_id: string | null
  messages: {
    id:        string
    role:      'user' | 'assistant'
    content:   string
    sources:   string[]  // source filenames, deduplicated
    timestamp: string
  }[]
}

export interface ChatResponse {
  answer:     string
  sources:    string[]  // source filenames, deduplicated
  session_id: string | null
}

// ── Raw API shapes (what /api/v1 actually returns) ──────────────────────────

interface RawCitation {
  document_id:     string
  filename:        string
  chunk_index:     number
  content_snippet: string
  relevance_score: number
}

interface RawQuizQuestion {
  position:       number
  question:       string
  options:        { id: string; text: string }[] | null
  correct_answer: string  // option id for mcq / true_false, text for short_answer
  explanation?:   string
}

interface RawFlashcard {
  position: number
  front:    string
  back:     string
}

function toQuizQuestion(q: RawQuizQuestion): QuizQuestion {
  const options = q.options ?? []
  const correct = options.find(o => o.id === q.correct_answer)
  return {
    id:          String(q.position),
    question:    q.question,
    options:     options.map(o => o.text),
    answer:      correct ? correct.text : q.correct_answer,
    explanation: q.explanation || undefined,
  }
}

interface RawSummary {
  summary:     string | null
  topic?:      string | null
  complexity?: string | null
  created_at?: string | null
}

function toSavedSummary(res: RawSummary, topic = '', complexity: Complexity = 'normal'): SavedSummary | null {
  if (!res.summary) return null
  return {
    content:    res.summary,
    topic:      res.topic ?? topic,
    complexity: (res.complexity as Complexity | null | undefined) ?? complexity,
    createdAt:  res.created_at ? new Date(res.created_at) : null,
  }
}

function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  // FastAPI validation errors: [{ loc, msg, type }, ...]
  if (Array.isArray(detail)) return detail.map(d => d?.msg).filter(Boolean).join('; ') || `HTTP ${status}`
  return `HTTP ${status}`
}

export class StudyMindClient {
  private apiKey:       string
  private apiUrl:       string
  private sessionToken: string | null = null

  /** `apiKey` may be empty when a session token is set via setSessionToken(). */
  constructor(apiKey: string, apiUrl?: string) {
    this.apiKey = apiKey
    this.apiUrl = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
  }

  /** Use a short-lived `st_` session token instead of the API key for all requests. */
  setSessionToken(token: string | null) {
    this.sessionToken = token || null
  }

  private get bearer(): string {
    return this.sessionToken ?? this.apiKey
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.bearer}`,
        'Content-Type':  'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(errorMessage(err, res.status))
    }

    return res.json()
  }

  async ingestCourse(courseId: string, userId: string, userRole: string, courseData: CourseData) {
    return this.request<{ module_id: string; course_id: string; status: string; message: string }>(
      'POST', '/api/v1/courses/ingest', {
        course_id:   courseId,
        user_id:     userId,
        user_role:   userRole,
        title:       courseData.title,
        description: courseData.description,
        sections:    courseData.sections?.map(s => ({
          title:    s.title,
          lectures: s.lectures.map(l => ({
            title:         l.title,
            description:   l.description,
            resource_url:  l.resourceUrl,
            resource_type: l.resourceType,
          })),
        })) || [],
      },
    )
  }

  async getCourseStatus(courseId: string, userId: string) {
    const qs = new URLSearchParams({ course_id: courseId, user_id: userId })
    return this.request<CourseStatus>('GET', `/api/v1/courses/status?${qs}`)
  }

  async chat(
    courseId:    string,
    userId:      string,
    message:     string,
    sessionId?:  string,
    complexity:  Complexity = 'normal',
  ): Promise<ChatResponse> {
    const res = await this.request<{ answer: string; sources: RawCitation[]; session_id: string | null }>(
      'POST', '/api/v1/chat', {
        course_id:  courseId,
        user_id:    userId,
        message,
        session_id: sessionId,
        complexity,
      },
    )
    return {
      answer:     res.answer,
      sources:    Array.from(new Set((res.sources ?? []).map(c => c.filename))),
      session_id: res.session_id,
    }
  }

  /** The user's saved conversation for this course (latest `limit` messages, oldest first). */
  async getChatHistory(courseId: string, userId: string, limit = 50): Promise<ChatHistory> {
    const qs  = new URLSearchParams({ course_id: courseId, user_id: userId, limit: String(limit) })
    const res = await this.request<{
      session_id: string | null
      messages: { id: string; role: 'user' | 'assistant'; content: string; sources: RawCitation[]; timestamp: string }[]
    }>('GET', `/api/v1/chat/history?${qs}`)
    return {
      session_id: res.session_id,
      messages:   res.messages.map(m => ({
        ...m,
        sources: Array.from(new Set((m.sources ?? []).map(c => c.filename))),
      })),
    }
  }

  async generateQuiz(
    courseId: string, userId: string, count: number = 5, topic?: string, complexity: Complexity = 'normal',
  ) {
    const res = await this.request<{ questions: RawQuizQuestion[]; count: number }>(
      'POST', '/api/v1/quiz/generate', {
        course_id:      courseId,
        user_id:        userId,
        question_count: count,
        topic,
        complexity,
      },
    )
    const questions = res.questions.map(toQuizQuestion)
    return { questions, count: questions.length }
  }

  async generateFlashcards(
    courseId: string, userId: string, count: number = 20, topic?: string, complexity: Complexity = 'normal',
  ) {
    const res = await this.request<{ cards: RawFlashcard[]; count: number }>(
      'POST', '/api/v1/flashcards/generate', {
        course_id: courseId,
        user_id:   userId,
        max_cards: count,
        topic,
        complexity,
      },
    )
    const cards: Flashcard[] = res.cards.map(c => ({ id: String(c.position), front: c.front, back: c.back }))
    return { cards, count: cards.length }
  }

  // ── Course materials (tutor/admin) ──────────────────────────────────────

  async listDocuments(courseId: string) {
    const qs = new URLSearchParams({ course_id: courseId })
    return this.request<CourseDocument[]>('GET', `/api/v1/documents/list?${qs}`)
  }

  /** Upload a file (PDF, DOCX, TXT, MD · max 20MB). `onProgress` receives 0–100. */
  async uploadDocument(
    courseId:    string,
    userId:      string,
    file:        File,
    onProgress?: (pct: number) => void,
  ): Promise<CourseDocument> {
    const form = new FormData()
    form.append('course_id', courseId)
    form.append('user_id',   userId)
    form.append('file',      file)
    return this.sendForm('/api/v1/documents/upload', form, onProgress)
  }

  async deleteDocument(courseId: string, documentId: string) {
    const qs = new URLSearchParams({ course_id: courseId })
    return this.request<{ deleted: boolean; document_id: string }>(
      'DELETE', `/api/v1/documents/${encodeURIComponent(documentId)}?${qs}`,
    )
  }

  async replaceDocument(
    courseId:    string,
    documentId:  string,
    file:        File,
    onProgress?: (pct: number) => void,
  ): Promise<CourseDocument> {
    const form = new FormData()
    form.append('course_id', courseId)
    form.append('file',      file)
    return this.sendForm(`/api/v1/documents/${encodeURIComponent(documentId)}/replace`, form, onProgress)
  }

  /** multipart POST via XHR — fetch() can't report upload progress. */
  private sendForm<T>(path: string, form: FormData, onProgress?: (pct: number) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${this.apiUrl}${path}`)
      xhr.setRequestHeader('Authorization', `Bearer ${this.bearer}`)
      xhr.responseType = 'json'
      if (onProgress) {
        xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as T)
        else reject(new Error(errorMessage(xhr.response, xhr.status)))
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(form)
    })
  }

  /** Generate a summary. The server also saves it as the latest for this course/user/topic. */
  async summarise(
    courseId: string, userId: string, topic?: string, complexity: Complexity = 'normal',
  ): Promise<SavedSummary> {
    const res = await this.request<RawSummary>('POST', '/api/v1/summarise', {
      course_id: courseId,
      user_id:   userId,
      topic,
      complexity,
    })
    return toSavedSummary(res, topic ?? '', complexity)!
  }

  /**
   * The saved summary: for `topic` if given ('' = all content), otherwise the most recent
   * one on any topic. Null if none has been generated yet.
   */
  async getSummary(courseId: string, userId: string, topic?: string): Promise<SavedSummary | null> {
    const params = new URLSearchParams({ course_id: courseId, user_id: userId })
    if (topic !== undefined) params.append('topic', topic)
    const res = await this.request<RawSummary>('GET', `/api/v1/summary?${params}`)
    return toSavedSummary(res)
  }
}
