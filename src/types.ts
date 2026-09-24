export interface StudyMindConfig {
  apiKey:  string
  apiUrl?: string  // defaults to https://api.aismartlearner.com
}

export interface LectureData {
  title:         string
  description?:  string
  resourceUrl?:  string
  resourceType?: 'pdf' | 'video' | 'link' | 'zip' | 'github'
}

export interface SectionData {
  title:    string
  lectures: LectureData[]
}

export interface CourseData {
  title:        string
  description?: string
  sections?:    SectionData[]
}

export type UserRole = 'student' | 'tutor' | 'admin'

export interface StudyMindPanelProps {
  courseId:      string
  userId:        string
  userRole?:     UserRole
  courseData:    CourseData
  /** Short-lived `st_` token from POST /api/v1/auth/session, minted on YOUR server. Preferred. */
  sessionToken?: string
  /** API key config — local development only; never ship an API key to the browser. */
  config?:       StudyMindConfig
  /** API base URL when using sessionToken (defaults to https://api.aismartlearner.com). */
  apiUrl?:       string
  theme?:        'light' | 'dark' | 'auto'
  className?:    string
  // Callbacks
  onReady?:      () => void
  onError?:      (error: Error) => void
}

export type TabId = 'tutor' | 'quiz' | 'flashcards' | 'summary' | 'materials'

export interface Message {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  sources?:  string[]
  timestamp: Date
  /** Assistant message that reports a failed request */
  isError?:  boolean
}

export interface QuizQuestion {
  id:           string
  question:     string
  options:      string[]
  answer:       string  // text of the correct option
  explanation?: string
}

export interface Flashcard {
  id:    string
  front: string
  back:  string
}

export interface ApiError {
  message: string
  code?:   string
}
