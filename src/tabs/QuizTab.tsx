import React, { useState } from 'react'
import { useStudyMind } from '../context'
import { s, tokens } from '../styles'
import { EmptyState } from './EmptyState'
import type { QuizQuestion } from '../types'

export function QuizTab() {
  const { client, courseId, userId } = useStudyMind()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading,   setLoading]   = useState(false)
  const [answers,   setAnswers]   = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.generateQuiz(courseId, userId, 5)
      setQuestions(res.questions)
      setAnswers({})
      setSubmitted(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  if (questions.length === 0) {
    return (
      <div style={s.scrollArea}>
        <EmptyState
          emoji="📝" text="Test your knowledge with an AI-generated quiz"
          error={error} buttonLabel="Generate Quiz" loading={loading} onClick={generate}
        />
      </div>
    )
  }

  const score       = questions.filter(q => answers[q.id] === q.answer).length
  const allAnswered = questions.every(q => answers[q.id] !== undefined)

  return (
    <div style={s.scrollArea}>
      {submitted && (
        <div style={{ ...s.card, background: tokens.colors.primaryBg,
          borderColor: tokens.colors.primary, marginBottom: '16px' }}>
          <p style={{ margin: 0, fontWeight: 700, color: tokens.colors.primary }}>
            Score: {score}/{questions.length}
          </p>
        </div>
      )}
      {questions.map((q, i) => {
        const selected = answers[q.id]
        const wrong    = submitted && selected !== undefined && selected !== q.answer
        return (
          <div key={q.id} style={s.card}>
            <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '14px' }}>
              {i + 1}. {q.question}
            </p>
            {q.options.map((opt, j) => {
              const isAnswer   = submitted && opt === q.answer
              const isWrongPick = wrong && opt === selected
              return (
                <button
                  key={j}
                  disabled={submitted}
                  aria-pressed={selected === opt}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', marginBottom: '6px',
                    borderRadius: tokens.radius.sm, cursor: submitted ? 'default' : 'pointer',
                    fontSize: '13px', fontFamily: tokens.font.sans,
                    border: `1px solid ${
                      isAnswer ? tokens.colors.success :
                      isWrongPick ? tokens.colors.error :
                      selected === opt ? tokens.colors.primary : tokens.colors.border
                    }`,
                    background:
                      isAnswer ? tokens.colors.successBg :
                      isWrongPick ? tokens.colors.errorBg :
                      selected === opt ? tokens.colors.primaryBg : tokens.colors.white,
                    color: tokens.colors.textPrimary,
                  }}
                >
                  {opt}
                </button>
              )
            })}
            {submitted && q.explanation && (
              <p style={{ fontSize: '12px', color: tokens.colors.textSecondary,
                marginTop: '8px', marginBottom: 0 }}>
                {q.explanation}
              </p>
            )}
          </div>
        )
      })}
      {error && <p role="alert" style={{ color: tokens.colors.error, fontSize: '13px' }}>{error}</p>}
      {!submitted ? (
        <button
          style={{ ...s.btn(), opacity: allAnswered ? 1 : 0.6 }}
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
        >
          Submit Quiz
        </button>
      ) : (
        <button style={s.btn('outline')} onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate New Quiz'}
        </button>
      )}
    </div>
  )
}
