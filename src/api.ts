import type { CourseData, QuizQuestion, Flashcard } from './types'

const DEFAULT_API_URL = 'https://api.aismartlearner.com'

export interface CourseStatus {
  status:      'not_found' | 'pending' | 'indexing' | 'ready' | 'failed'
  module_id?:  string | null
  chunk_count?: number
  indexed_at?: string | null
  error?:      string | null
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

function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  // FastAPI validation errors: [{ loc, msg, type }, ...]
  if (Array.isArray(detail)) return detail.map(d => d?.msg).filter(Boolean).join('; ') || `HTTP ${status}`
  return `HTTP ${status}`
}

export class StudyMindClient {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey: string, apiUrl?: string) {
    this.apiKey = apiKey
    this.apiUrl = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
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

  async chat(courseId: string, userId: string, message: string, sessionId?: string): Promise<ChatResponse> {
    const res = await this.request<{ answer: string; sources: RawCitation[]; session_id: string | null }>(
      'POST', '/api/v1/chat', {
        course_id:  courseId,
        user_id:    userId,
        message,
        session_id: sessionId,
      },
    )
    return {
      answer:     res.answer,
      sources:    Array.from(new Set((res.sources ?? []).map(c => c.filename))),
      session_id: res.session_id,
    }
  }

  async generateQuiz(courseId: string, userId: string, count: number = 5, topic?: string) {
    const res = await this.request<{ questions: RawQuizQuestion[]; count: number }>(
      'POST', '/api/v1/quiz/generate', {
        course_id:      courseId,
        user_id:        userId,
        question_count: count,
        topic,
      },
    )
    const questions = res.questions.map(toQuizQuestion)
    return { questions, count: questions.length }
  }

  async generateFlashcards(courseId: string, userId: string, count: number = 20, topic?: string) {
    const res = await this.request<{ cards: RawFlashcard[]; count: number }>(
      'POST', '/api/v1/flashcards/generate', {
        course_id: courseId,
        user_id:   userId,
        max_cards: count,
        topic,
      },
    )
    const cards: Flashcard[] = res.cards.map(c => ({ id: String(c.position), front: c.front, back: c.back }))
    return { cards, count: cards.length }
  }

  async summarise(courseId: string, userId: string, topic?: string) {
    return this.request<{ summary: string }>('POST', '/api/v1/summarise', {
      course_id: courseId,
      user_id:   userId,
      topic,
    })
  }
}
