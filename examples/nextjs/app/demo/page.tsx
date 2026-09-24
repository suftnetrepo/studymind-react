'use client'

import { useState, useEffect } from 'react'
import { StudyMindPanel } from '@studymind/react'

// Mock course — simulates what Learnify would pass
const MOCK_COURSE = {
  id:    'demo_python_101',
  title: 'Introduction to Python Programming',
  description: 'A comprehensive beginner course covering Python fundamentals.',
  sections: [
    {
      title: 'Getting Started with Python',
      lectures: [
        {
          title:       'What is Python?',
          description: 'Python is a high-level, interpreted programming language known for its simplicity and readability. It was created by Guido van Rossum and released in 1991. Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.',
        },
        {
          title:       'Installing Python',
          description: 'Download Python from python.org. Choose Python 3.x (the latest stable version). On Windows, check "Add Python to PATH" during installation. Verify installation by running python --version in your terminal.',
        },
      ],
    },
    {
      title: 'Variables and Data Types',
      lectures: [
        {
          title:       'Variables in Python',
          description: 'A variable is a named location in memory that stores a value. In Python, you do not need to declare variable types. Python uses dynamic typing. Example: name = "Alice", age = 25, price = 9.99, is_active = True.',
        },
        {
          title:       'Python Data Types',
          description: 'Python has several built-in data types: str (strings), int (integers), float (decimal numbers), bool (True/False), list (ordered mutable collection), tuple (ordered immutable collection), dict (key-value pairs), set (unordered unique values).',
        },
      ],
    },
    {
      title: 'Control Flow',
      lectures: [
        {
          title:       'If Statements',
          description: 'If statements allow conditional execution. Syntax: if condition: block. Use elif for multiple conditions and else for the default case. Python uses indentation (4 spaces) to define code blocks.',
        },
        {
          title:       'Loops',
          description: 'Python has two main loop types. For loops iterate over sequences: for item in list. While loops repeat while a condition is true: while condition. Use break to exit a loop and continue to skip to the next iteration.',
        },
      ],
    },
  ],
}

const MOCK_USER = {
  id:   'demo_student_001',
  role: 'student' as const,
  name: 'Demo Student',
}

type PanelStatus = 'waiting' | 'ready' | 'error'

export default function DemoPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [apiUrl,       setApiUrl]       = useState<string | undefined>()
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [panelStatus,  setPanelStatus]  = useState<PanelStatus>('waiting')

  useEffect(() => {
    let cancelled = false

    async function setup() {
      try {
        // Your server exchanges the API key for a short-lived session token.
        // The panel then indexes the course itself if it isn't indexed yet.
        const res = await fetch('/api/studymind-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: MOCK_COURSE.id,
            userId:   MOCK_USER.id,
            userRole: MOCK_USER.role,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to get session')
        if (cancelled) return
        setSessionToken(data.sessionToken)
        setApiUrl(data.apiUrl)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Setup failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setup()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              @studymind/react — Demo
            </h1>
            <p className="text-sm text-gray-500">
              Testing StudyMindPanel with a mock Python course
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              loading ? 'bg-yellow-100 text-yellow-700' :
              error   ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
            }`}>
              {loading ? 'Setting up…' : error ? 'Error' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Mock course content — left side */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {MOCK_COURSE.title}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {MOCK_COURSE.description}
              </p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  {MOCK_COURSE.sections.length} sections
                </span>
                <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                  {MOCK_COURSE.sections.reduce((a, s) => a + s.lectures.length, 0)} lectures
                </span>
                <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full">
                  Beginner
                </span>
              </div>
            </div>

            {/* Course sections */}
            {MOCK_COURSE.sections.map((section, si) => (
              <div key={si} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Section {si + 1}: {section.title}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.lectures.map((lecture, li) => (
                    <div key={li} className="px-6 py-4 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center
                        justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                        {li + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {lecture.title}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                          {lecture.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Debug info */}
            <div className="bg-gray-900 rounded-2xl p-4 text-xs font-mono">
              <p className="text-green-400 mb-2">{'// Debug info'}</p>
              <p className="text-gray-400">
                Course ID: <span className="text-white">{MOCK_COURSE.id}</span>
              </p>
              <p className="text-gray-400">
                User ID: <span className="text-white">{MOCK_USER.id}</span>
              </p>
              <p className="text-gray-400">
                API URL: <span className="text-white">{apiUrl ?? '—'}</span>
              </p>
              <p className="text-gray-400">
                Session token: <span className="text-white">
                  {sessionToken ? sessionToken.slice(0, 12) + '…' : 'none'}
                </span>
              </p>
              <p className="text-gray-400">
                Panel: <span className="text-white">{panelStatus}</span>
              </p>
              {error && (
                <p className="text-red-400 mt-1">Error: {error}</p>
              )}
            </div>
          </div>

          {/* StudyMind Panel — right side */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8
                  text-center h-96 flex flex-col items-center justify-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <p className="text-gray-600 text-sm">Setting up AI…</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl border border-red-200 p-8
                  text-center h-96 flex flex-col items-center justify-center">
                  <div className="text-3xl mb-3">⚠️</div>
                  <p className="text-red-600 text-sm">{error}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Check your .env.local and that the API is running
                  </p>
                </div>
              ) : sessionToken ? (
                <StudyMindPanel
                  courseId={MOCK_COURSE.id}
                  userId={MOCK_USER.id}
                  userRole={MOCK_USER.role}
                  courseData={{
                    title:       MOCK_COURSE.title,
                    description: MOCK_COURSE.description,
                    sections:    MOCK_COURSE.sections,
                  }}
                  sessionToken={sessionToken}
                  apiUrl={apiUrl}
                  onReady={() => { setPanelStatus('ready'); console.log('StudyMind ready') }}
                  onError={(e) => { setPanelStatus('error'); console.error('StudyMind error:', e) }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
